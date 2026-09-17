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
