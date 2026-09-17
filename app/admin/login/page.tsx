'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * The only way into /admin. There is no sign-up anywhere on the site: the
 * account is created once in the Supabase dashboard (Authentication → Users →
 * Add user, with "Auto Confirm User" ticked).
 */
export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Someone already signed in has no business on this page.
  useEffect(() => {
    let alive = true;
    void supabase?.auth.getSession().then(({ data }) => {
      if (alive && data.session) router.replace('/admin');
    });
    return () => {
      alive = false;
    };
  }, [router]);

  const signIn = async () => {
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace('/admin');
  };

  return (
    <>
      <header id="top">
        <Link href="/" className="logo" aria-label="BASE Entertainment home">
          BASE
        </Link>
        <Link className="text-link" href="/">
          <ArrowLeft size={18} /> Back to the website
        </Link>
      </header>
      <main id="main" className="form-page wrap admin-login">
        <p className="eyebrow">STAFF ONLY</p>
        <h1>Sign in</h1>
        <p className="form-intro">
          The setup catalog — which pieces customers can choose, what they cost,
          and where each one sits in the 3D scene.
        </p>
        {!isSupabaseConfigured ? (
          <p className="admin-alert">
            Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and a
            publishable key to <code>.env.local</code>, then restart the server.
          </p>
        ) : (
          <form
            className="info-form"
            onSubmit={(event) => {
              event.preventDefault();
              void signIn();
            }}
          >
            <p className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </p>
            <p className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </p>
            {error ? <p className="admin-alert">{error}</p> : null}
            <button className="button" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'} <ArrowUpRight size={18} />
            </button>
          </form>
        )}
      </main>
    </>
  );
}
