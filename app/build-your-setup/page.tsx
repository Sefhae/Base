'use client';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  Plus,
  RotateCw,
  Search,
  Trash2,
} from 'lucide-react';
import {
  CATALOG,
  CATEGORIES,
  SHOW_PRICES,
  findItem,
  formatPrice,
} from './catalog';
import type { Placed } from './SetupCanvas';
import { SETUP_STORAGE_KEY } from '../setup-storage';

const SetupCanvas = dynamic(() => import('./SetupCanvas'), {
  ssr: false,
  loading: () => <p className="canvas-loading">Preparing your 3D space…</p>,
});

let counter = 0;
const nextUid = () => {
  counter += 1;
  return `piece-${counter}-${Date.now()}`;
};

export default function BuildYourSetup() {
  const router = useRouter();
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const add = (itemId: string) => {
    const item = findItem(itemId);
    if (!item) return;
    const ring = placed.length;
    const angle = ring * 1.1;
    const radius = Math.min(1 + ring * 0.35, 4);
    const uid = nextUid();
    setPlaced((current) => [
      ...current,
      {
        uid,
        itemId,
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        rotation: 0,
      },
    ]);
    setSelected(uid);
  };

  const move = (uid: string, x: number, z: number) =>
    setPlaced((current) =>
      current.map((piece) => (piece.uid === uid ? { ...piece, x, z } : piece)),
    );

  const rotate = () =>
    setPlaced((current) =>
      current.map((piece) =>
        piece.uid === selected
          ? { ...piece, rotation: piece.rotation + Math.PI / 8 }
          : piece,
      ),
    );

  const remove = () => {
    setPlaced((current) => current.filter((piece) => piece.uid !== selected));
    setSelected(null);
  };

  /** How many of each catalog item are currently in the scene. */
  const placedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    placed.forEach((piece) => {
      counts.set(piece.itemId, (counts.get(piece.itemId) ?? 0) + 1);
    });
    return counts;
  }, [placed]);

  /** Catalog grouped by category, narrowed by the search box. */
  const visibleGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return CATEGORIES.map((category) => ({
      category,
      items: CATALOG.filter(
        (item) =>
          item.category === category &&
          (needle === '' || item.name.toLowerCase().includes(needle)),
      ),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  const summary = useMemo(
    () =>
      [...placedCounts.entries()].map(([itemId, count]) => {
        const item = findItem(itemId);
        return {
          itemId,
          count,
          name: item?.name ?? itemId,
          lineTotal: (item?.price ?? 0) * count,
        };
      }),
    [placedCounts],
  );

  const total = useMemo(
    () => summary.reduce((sum, row) => sum + row.lineTotal, 0),
    [summary],
  );

  const sendToInquiry = () => {
    const lines = summary.map((row) =>
      SHOW_PRICES
        ? `- ${row.name} x${row.count} — ${formatPrice(row.lineTotal)}`
        : `- ${row.name} x${row.count}`,
    );
    const text = SHOW_PRICES
      ? `My setup idea:\n${lines.join('\n')}\n\nEstimated total: ${formatPrice(
          total,
        )} (estimate only, to be confirmed)`
      : `My setup idea:\n${lines.join('\n')}`;
    try {
      sessionStorage.setItem(SETUP_STORAGE_KEY, text);
    } catch {
      // Private browsing can block storage; the form still works without it.
    }
    router.push('/get-more-information');
  };

  const selectedPiece = placed.find((piece) => piece.uid === selected);
  const selectedName = selectedPiece
    ? (findItem(selectedPiece.itemId)?.name ?? 'Item')
    : null;

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
            Place the pieces you like, drag them where you want them, and send us
            the plan. Drag the background to look around.
          </p>
        </div>

        <div className="builder-grid">
          <section className="palette" aria-label="Items you can add">
            <div className="palette-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search items"
                aria-label="Search items"
              />
            </div>
            {visibleGroups.length === 0 ? (
              <p className="palette-empty">No items match that search.</p>
            ) : (
              <div className="palette-list">
                {visibleGroups.map(({ category, items }) => (
                  <div key={category} className="palette-group">
                    <p className="palette-heading">
                      <span>{category}</span>
                      <span>{items.length}</span>
                    </p>
                    {items.map((item) => {
                      const used = placedCounts.get(item.id) ?? 0;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className="palette-item"
                          onClick={() => add(item.id)}
                          aria-label={`Add ${item.name}`}
                        >
                          <span
                            className="swatch"
                            style={{ background: item.color }}
                            aria-hidden="true"
                          />
                          <span className="palette-label">
                            <span className="palette-name">{item.name}</span>
                            {SHOW_PRICES ? (
                              <span className="palette-price">
                                {formatPrice(item.price)}
                              </span>
                            ) : null}
                          </span>
                          {used > 0 ? (
                            <span className="palette-used">{used}</span>
                          ) : null}
                          <Plus
                            className="palette-add"
                            size={15}
                            aria-hidden="true"
                          />
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="stage" aria-label="Your setup in 3D">
            <div className="canvas-shell">
              <SetupCanvas
                placed={placed}
                selected={selected}
                onSelect={setSelected}
                onMove={move}
              />
            </div>
            <div className="stage-bar">
              <span className="stage-status">
                {selectedName
                  ? `Selected: ${selectedName}`
                  : placed.length === 0
                    ? 'Choose an item to begin'
                    : 'Tap a piece to select it'}
                {SHOW_PRICES && placed.length > 0 ? (
                  <>
                    {' · '}
                    <strong className="stage-total">{formatPrice(total)}</strong>
                  </>
                ) : null}
              </span>
              <span className="stage-actions">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={rotate}
                  disabled={!selected}
                >
                  <RotateCw size={16} /> Rotate
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={remove}
                  disabled={!selected}
                >
                  <Trash2 size={16} /> Remove
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    setPlaced([]);
                    setSelected(null);
                  }}
                  disabled={placed.length === 0}
                >
                  Clear all
                </button>
              </span>
            </div>
          </section>
        </div>

        <section className="setup-summary" aria-label="Your setup so far">
          <h2>Your setup</h2>
          {summary.length === 0 ? (
            <p>Nothing added yet. Pick a piece from the list to start.</p>
          ) : (
            <ul>
              {summary.map((row) => (
                <li key={row.itemId}>
                  {row.name} <span>x{row.count}</span>
                  {SHOW_PRICES ? (
                    <span>{formatPrice(row.lineTotal)}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {SHOW_PRICES && summary.length > 0 ? (
            <div className="setup-total">
              <span>Estimated total</span>
              <strong>{formatPrice(total)}</strong>
            </div>
          ) : null}
          {SHOW_PRICES ? (
            <p className="price-note">
              These figures are a planning guide only. Your final quote depends
              on your date, location, and the details you choose, and is
              confirmed with us directly.
            </p>
          ) : null}
          <button
            type="button"
            className="button"
            onClick={sendToInquiry}
            disabled={placed.length === 0}
          >
            Send this setup with my inquiry <ArrowUpRight size={18} />
          </button>
        </section>
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
