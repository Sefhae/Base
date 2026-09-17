import { createClient } from '@supabase/supabase-js';

// Both values below are meant to be public. The key only grants what the Row
// Level Security policies in supabase/schema.sql allow, which for an anonymous
// visitor is read-only. Writing requires a signed-in admin session.
//
// Supabase renamed "anon key" to "publishable key"; accept either name so the
// project works whichever one the dashboard shows you.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False until .env.local points at a Supabase project. */
export const isSupabaseConfigured = Boolean(url && key);

/**
 * null when the project has no Supabase credentials yet. Everything that talks
 * to Supabase checks for null first, so the site keeps working on its built-in
 * catalog alone rather than crashing before setup is done.
 */
export const supabase = url && key ? createClient(url, key) : null;
