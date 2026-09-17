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
  if (error) return { item: null, error: error.message };
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
