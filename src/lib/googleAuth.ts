import supabase from './supabase';

const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export async function signInWithGoogle(appName = 'PadhaiNepal') {
  try {
    // 1. Primary: Native Supabase Google OAuth (works on Vercel, localhost, and custom domains)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/home`,
      },
    });

    if (!error && data?.url) {
      return;
    }

    // 2. Fallback: Design Arena Auth Proxy Popup
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_GOOGLE_AUTH_PROXY;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (clientId && redirectUri) {
      const state = btoa(JSON.stringify({ origin: window.location.origin, appName, supabaseUrl, supabaseAnonKey }));
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=select_account&state=${encodeURIComponent(state)}`;
      window.open(url, 'google-auth', isMobile() ? '' : 'width=500,height=600');

      const handler = async (event: MessageEvent) => {
        if (event.data?.type === 'google-auth-denied') { window.removeEventListener('message', handler); return; }
        if (event.data?.type !== 'google-auth-success') return;
        window.removeEventListener('message', handler);
        if (event.data.access_token && event.data.refresh_token) {
          await supabase.auth.setSession({ access_token: event.data.access_token, refresh_token: event.data.refresh_token });
        } else if (event.data.id_token) {
          await supabase.auth.signInWithIdToken({ provider: 'google', token: event.data.id_token });
        }
      };
      window.addEventListener('message', handler);
    }
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
