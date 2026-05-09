import type { SupabaseClient } from '@supabase/supabase-js';

function fallbackUsername(email: string): string {
  const local = email.split('@')[0] || 'user';
  const safe = local.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_').slice(0, 40);
  return safe || 'user';
}

/** يضمن وجود صف في profiles لأن tools/books تُربط بـ profiles وليس auth.users مباشرة. */
export async function ensureUserProfile(
  client: SupabaseClient,
  userId: string,
  email: string,
  extras?: { full_name?: string | null; username?: string | null }
): Promise<{ error: { message: string; code?: string } | null }> {
  const { data } = await client.from('profiles').select('id').eq('id', userId).maybeSingle();
  if (data) return { error: null };

  const row = {
    id: userId,
    username: (extras?.username && String(extras.username).trim()) || fallbackUsername(email),
    full_name: extras?.full_name ?? null,
  };

  const { error } = await client.from('profiles').insert(row);
  return { error: error ? { message: error.message, code: error.code } : null };
}
