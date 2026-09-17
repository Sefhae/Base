'use client';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Plus, RotateCw, Search, Trash2 } from 'lucide-react';
import {
  CATALOG,
  CATEGORIES,
  SHOW_PRICES,
  findItem,
  formatPrice,
} from './catalog';
import type { Piece } from './SetupCanvas';
import { stashSetupSummary } from '../setup-storage';

const SetupCanvas = dynamic(() => import('./SetupCanvas'), {
  ssr: false,
  loading: () => <p className="canvas-loading">Preparing your 3D space…</p>,
});

/**
 * The fallback builder, shown while no models have been uploaded in /admin. It
 * runs on the built-in shapes in catalog.ts and lets the visitor arrange them
 * freely, which is how this page worked before the admin panel existed.
 */
type Placed = {
  uid: string;
  itemId: string;
  x: number;
  z: number;
  rotation: number;
};

let counter = 0;
const nextUid = () => {
  counter += 1;
  return `piece-${counter}-${Date.now()}`;
};

export default function BuiltInBuilder() {
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

  const pieces = useMemo<Piece[]>(
    () =>
      placed.flatMap((piece) => {
        const item = findItem(piece.itemId);
        if (!item) return [];
        return [
          {
            uid: piece.uid,
            x: piece.x,
            y: 0,
            z: piece.z,
            rotation: piece.rotation,
            scale: 1,
            source: {
              kind: 'builtin' as const,
              model: item.model,
              color: item.color,
            },
            ringSize: item.size,
          },
        ];
      }),
    [placed],
  );

  const sendToInquiry = () => {
    const lines = summary.map((row) =>
      SHOW_PRICES
        ? `- ${row.name} x${row.count} — ${formatPrice(row.lineTotal)}`
        : `- ${row.name} x${row.count}`,
    );
    stashSetupSummary(
      SHOW_PRICES
        ? `My setup idea:\n${lines.join('\n')}\n\nEstimated total: ${formatPrice(
            total,
          )} (estimate only, to be confirmed)`
        : `My setup idea:\n${lines.join('\n')}`,
    );
    router.push('/get-more-information');
  };

  const selectedPiece = placed.find((piece) => piece.uid === selected);
  const selectedName = selectedPiece
    ? (findItem(selectedPiece.itemId)?.name ?? 'Item')
    : null;

  const stageBar = (
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
  );

  return (
    <>
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
              pieces={pieces}
              selected={selected}
              onSelect={setSelected}
              onMove={move}
            />
          </div>
          {stageBar}
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
                {SHOW_PRICES ? <span>{formatPrice(row.lineTotal)}</span> : null}
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
            These figures are a planning guide only. Your final quote depends on
            your date, location, and the details you choose, and is confirmed
            with us directly.
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
    </>
  );
}
