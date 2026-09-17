'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BuiltInBuilder from './BuiltInBuilder';
import ModelBuilder from './ModelBuilder';
import { fetchActiveItems, type SetupItemRow } from '@/lib/setup-items';

/**
 * Two builders live behind this page.
 *
 * Once models have been uploaded in /admin, those are what visitors get, each
 * one dropping into the exact spot chosen there. Until then — and if Supabase
 * is unreachable — it falls back to the built-in shapes in catalog.ts, which
 * the visitor arranges freely. The fallback is what keeps the published page
 * useful while the catalog is still being filled.
 */
export default function BuildYourSetup() {
  const [items, setItems] = useState<SetupItemRow[] | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchActiveItems().then(({ items: rows, error }) => {
      if (!alive) return;
      setItems(rows);
      // A visitor can do nothing about a database that is down, and the
      // built-in shapes below still give them a working page, so the failure
      // is logged rather than shown. The admin panel surfaces the real error.
      if (error) console.warn('Could not load the uploaded catalog:', error);
    });
    return () => {
      alive = false;
    };
  }, []);

  const uploaded = items !== null && items.length > 0;

  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <header id="top">
        <Link href="/" className="logo" aria-label="BASE Entertainment home">
          BASE
        </Link>
        <Link className="text-link" href="/">
          <ArrowLeft size={18} /> Back to the website
        </Link>
      </header>
      <main id="main" className="builder wrap">
        <div className="builder-head">
          <p className="eyebrow">BEAUTIFUL MOMENTS, BEAUTIFUL PLACES</p>
          <h1>Build Your Setup</h1>
          <p className="form-intro">
            {uploaded
              ? 'Pick the pieces you like and watch your setup come together. Drag the background to look around.'
              : 'Place the pieces you like, drag them where you want them, and send us the plan. Drag the background to look around.'}
          </p>
        </div>

        {items === null ? (
          <p className="canvas-loading">Loading the catalog…</p>
        ) : uploaded ? (
          <ModelBuilder items={items} />
        ) : (
          <BuiltInBuilder />
        )}
      </main>
      <footer>
        <div className="footer-top">
          <Link href="/" className="logo">
            BASE
          </Link>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} BASE Entertainment</span>
          <span>Based in Orlando · Serving all of Florida</span>
          <Link href="/">BACK TO HOME ↑</Link>
        </div>
      </footer>
    </>
  );
}
