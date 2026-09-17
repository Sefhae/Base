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
   * Pieces sharing this text are sold together as one package. Null means the
   * piece stands on its own.
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
 * One row in a palette: either a lone piece, or a package standing for the
 * several pieces uploaded into it. A package costs what its pieces cost
 * together, so there is no second price to keep in step with the first.
 */
export type CatalogEntry = {
  /** Stable key: the package name, or the id of a lone piece. */
  key: string;
  name: string;
  category: string;
  price: number;
  items: SetupItemRow[];
  isPackage: boolean;
};

/** Collapses rows into palette entries, packages first-come in list order. */
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
 * Postgres names the missing column and stops there, which reads as a bug
 * rather than as a migration that has not been run yet. Say what to do.
 */
const explain = (message: string) =>
  /column .*package.* does not exist/i.test(message)
    ? "The database has no `package` column yet. Open the Supabase SQL editor and run: alter table public.setup_items add column if not exists package text;"
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

/**
 * Removes the row and then its .glb. The row goes first: a leftover file is
 * harmless, while a row pointing at a deleted file would break the scene.
 */
export async function deleteItem(
  item: SetupItemRow,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { error } = await supabase.from('setup_items').delete().eq('id', item.id);
  if (error) return { error: error.message };
  await supabase.storage.from(MODELS_BUCKET).remove([item.model_path]);
  return { error: null };
}
