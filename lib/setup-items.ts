import { supabase } from './supabase';

/** One uploaded 3D model, as stored in the setup_items table. */
export type SetupItemRow = {
  id: string;
  name: string;
  category: string;
  price: number;
  model_path: string;
  /** The fixed spot chosen in the admin panel. Customers cannot move it. */
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_y: number;
  scale: number;
  is_active: boolean;
  sort_order: number;
  /**
   * Rows sharing this text are one thing to the customer: clicking it brings
   * every one of them in, each at its own spot. Copies of a model live here.
   * Null means the row stands on its own.
   */
  package: string | null;
};

/** Everything the admin panel can change about a row. */
export type SetupItemDraft = Omit<SetupItemRow, 'id'> & { id?: string };

export const MODELS_BUCKET = 'models';

/** Public URL of a .glb inside the models bucket; '' when unconfigured. */
export const modelUrl = (path: string) =>
  supabase?.storage.from(MODELS_BUCKET).getPublicUrl(path).data.publicUrl ?? '';

type FetchResult = { items: SetupItemRow[]; error: string | null };

/**
 * Items shown to customers. Errors are returned rather than thrown or swallowed,
 * so the caller can decide whether to surface them.
 */
export async function fetchActiveItems(): Promise<FetchResult> {
  if (!supabase) return { items: [], error: null };
  const { data, error } = await supabase
    .from('setup_items')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) return { items: [], error: error.message };
  return { items: (data as SetupItemRow[] | null) ?? [], error: null };
}

/** Every item, active or not — used by the admin panel. */
export async function fetchAllItems(): Promise<FetchResult> {
  if (!supabase) return { items: [], error: null };
  const { data, error } = await supabase
    .from('setup_items')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) return { items: [], error: error.message };
  return { items: (data as SetupItemRow[] | null) ?? [], error: null };
}


/**
 * One row in a palette: a lone model, or a group standing for several rows —
 * copies of one model, or different models placed together. A group costs what
 * its rows cost together, so there is no second price to keep in step.
 */
export type CatalogEntry = {
  /** Stable key: the group name, or the id of a lone row. */
  key: string;
  name: string;
  category: string;
  price: number;
  items: SetupItemRow[];
  isPackage: boolean;
};

/** Collapses rows into palette entries, groups first-come in list order. */
export function groupIntoEntries(items: SetupItemRow[]): CatalogEntry[] {
  const entries: CatalogEntry[] = [];
  const byPackage = new Map<string, CatalogEntry>();
  for (const item of items) {
    const name = item.package?.trim();
    if (!name) {
      entries.push({
        key: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        items: [item],
        isPackage: false,
      });
      continue;
    }
    const existing = byPackage.get(name);
    if (existing) {
      existing.items.push(item);
      existing.price += item.price;
      continue;
    }
    const entry: CatalogEntry = {
      key: `package:${name}`,
      name,
      category: item.category,
      price: item.price,
      items: [item],
      isPackage: true,
    };
    byPackage.set(name, entry);
    entries.push(entry);
  }
  return entries;
}

/** Message used whenever a write is attempted before setup is finished. */
const NOT_CONFIGURED =
  'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and a publishable key to .env.local.';

/**
 * Strip a filename down to something safe for a storage key: the bucket accepts
 * a limited character set, and a collision would overwrite someone else's model.
 */
const storageKey = (fileName: string) => {
  const safe = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-60);
  return `${Date.now()}-${safe || 'model.glb'}`;
};

/** Human name suggested for a freshly uploaded file: "rose-arch.glb" → "Rose arch". */
export const nameFromFile = (fileName: string) => {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : 'New item';
};

/** Uploads a .glb and returns its path inside the bucket. */
export async function uploadModel(
  file: File,
): Promise<{ path: string | null; error: string | null }> {
  if (!supabase) return { path: null, error: NOT_CONFIGURED };
  const path = storageKey(file.name);
  const { error } = await supabase.storage
    .from(MODELS_BUCKET)
    .upload(path, file, { contentType: 'model/gltf-binary', upsert: false });
  if (error) return { path: null, error: error.message };
  return { path, error: null };
}

/**
 * A column Postgres cannot find reads as a bug rather than as a migration that
 * has not been run yet. PostgREST phrases the same thing a second way when its
 * cached copy of the table is stale, so both wordings reach the same advice.
 */
const explain = (message: string) =>
  /(does not exist|schema cache|could not find)/i.test(message)
    ? `${message} — the database is behind the code. Open the Supabase SQL editor and run supabase/schema.sql.`
    : message;

/** Inserts a new row, or updates the existing one when the draft carries an id. */
export async function saveItem(
  draft: SetupItemDraft,
): Promise<{ item: SetupItemRow | null; error: string | null }> {
  if (!supabase) return { item: null, error: NOT_CONFIGURED };
  const { id, ...values } = draft;
  const query = id
    ? supabase.from('setup_items').update(values).eq('id', id)
    : supabase.from('setup_items').insert(values);
  const { data, error } = await query.select().single();
  if (error) return { item: null, error: explain(error.message) };
  return { item: data as SetupItemRow, error: null };
}

/** How far apart copies are dropped, in metres, so none hides inside another. */
const COPY_SPACING = 0.8;

/**
 * Makes `count` more of one model: new rows pointing at the same .glb, so
 * nothing is uploaded twice. They all carry one group name, which is what makes
 * the customer see a single entry that brings every copy in at once. Each copy
 * is a row of its own, so each can be placed, turned and resized separately.
 */
export async function copyItem(
  item: SetupItemRow,
  count: number,
  group: string,
): Promise<{ items: SetupItemRow[]; error: string | null }> {
  if (!supabase) return { items: [], error: NOT_CONFIGURED };
  const made: SetupItemRow[] = [];
  for (let copy = 1; copy <= count; copy += 1) {
    const { id: _id, ...values } = item;
    const { item: saved, error } = await saveItem({
      ...values,
      package: group,
      // Dropped on the exact same spot the copies would hide inside each other,
      // leaving the ones underneath impossible to click.
      position_x: item.position_x + copy * COPY_SPACING,
      sort_order: item.sort_order + copy,
    });
    if (!saved) return { items: made, error };
    made.push(saved);
  }
  return { items: made, error: null };
}

/**
 * Removes the row, and its .glb only when no other row still points at that
 * file. Copies share one upload, so deleting a copy must not take the file out
 * from under the rows that remain.
 */
export async function deleteItem(
  item: SetupItemRow,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { error } = await supabase.from('setup_items').delete().eq('id', item.id);
  if (error) return { error: error.message };

  const { data: sharing } = await supabase
    .from('setup_items')
    .select('id')
    .eq('model_path', item.model_path)
    .limit(1);
  if ((sharing ?? []).length === 0) {
    await supabase.storage.from(MODELS_BUCKET).remove([item.model_path]);
  }
  return { error: null };
}
