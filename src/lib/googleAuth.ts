import supabase from './supabase';

export async function signInWithGoogle() {
  try {
    // Execute Supabase Google OAuth with exact redirectTo option
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('Supabase Google OAuth error:', error.message);
    }
    return { data, error };
  } catch (err) {
    console.error('Google Sign In error:', err);
  }
}

export async function handleGoogleRedirect() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('google_id_token');
  if (!token) return;
  window.history.replaceState({}, '', window.location.pathname);
  const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token });
  if (error) { console.error('[google-auth] signInWithIdToken failed:', error.message); return; }
  try { window.close(); } catch {}
}
