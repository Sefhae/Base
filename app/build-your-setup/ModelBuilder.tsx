'use client';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Check, Plus, Search } from 'lucide-react';
import { CATEGORIES, SHOW_PRICES, formatPrice } from './catalog';
import type { Piece } from './SetupCanvas';
import {
  groupIntoEntries,
  modelUrl,
  type SetupItemRow,
} from '@/lib/setup-items';
import { stashSetupSummary } from '../setup-storage';

const SetupCanvas = dynamic(() => import('./SetupCanvas'), {
  ssr: false,
  loading: () => <p className="canvas-loading">Preparing your 3D space…</p>,
});

/**
 * The builder customers see once models have been uploaded in /admin. Every
 * piece sits at the position, height, rotation and scale chosen there, so
 * picking an entry adds it to those exact spots and picking it again takes it
 * away. Nothing in here can move a piece: the layout is the admin's design,
 * not the visitor's.
 *
 * A package is one entry made of several models — choosing it brings the whole
 * arrangement in at once.
 */
export default function ModelBuilder({ items }: { items: SetupItemRow[] }) {
  const router = useRouter();
  const [chosen, setChosen] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  const entries = useMemo(() => groupIntoEntries(items), [items]);

  const toggle = (key: string) =>
    setChosen((current) =>
      current.includes(key)
        ? current.filter((entry) => entry !== key)
        : [...current, key],
    );

  /**
   * Categories in the order catalog.ts lists them, with anything the admin
   * typed that is not on that list appended alphabetically rather than dropped.
   */
  const visibleGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matching = entries.filter(
      (entry) => needle === '' || entry.name.toLowerCase().includes(needle),
    );
    const known = CATEGORIES.map((name) => String(name));
    const extra = [...new Set(matching.map((entry) => entry.category))]
      .filter((name) => !known.includes(name))
      .sort();
    return [...known, ...extra]
      .map((category) => ({
        category,
        entries: matching.filter((entry) => entry.category === category),
      }))
      .filter((group) => group.entries.length > 0);
  }, [entries, query]);

  const chosenEntries = useMemo(
    () =>
      chosen.flatMap((key) => {
        const entry = entries.find((candidate) => candidate.key === key);
        return entry ? [entry] : [];
      }),
    [chosen, entries],
  );

  const total = useMemo(
    () => chosenEntries.reduce((sum, entry) => sum + entry.price, 0),
    [chosenEntries],
  );

  const pieces = useMemo<Piece[]>(
    () =>
      chosenEntries.flatMap((entry) =>
        entry.items.map((item) => ({
          uid: item.id,
          x: item.position_x,
          y: item.position_y,
          z: item.position_z,
          rotation: item.rotation_y,
          scale: item.scale,
          source: { kind: 'glb' as const, url: modelUrl(item.model_path) },
          ringSize: 0,
        })),
      ),
    [chosenEntries],
  );

  const sendToInquiry = () => {
    const lines = chosenEntries.map((entry) => {
      const label = entry.isPackage
        ? `${entry.name} (${entry.items.length} pieces)`
        : entry.name;
      return SHOW_PRICES ? `- ${label} — ${formatPrice(entry.price)}` : `- ${label}`;
    });
    stashSetupSummary(
      SHOW_PRICES
        ? `My setup idea:\n${lines.join('\n')}\n\nEstimated total: ${formatPrice(
            total,
          )} (estimate only, to be confirmed)`
        : `My setup idea:\n${lines.join('\n')}`,
    );
    router.push('/get-more-information');
  };

  const stageBar = (
    <div className="stage-bar">
      <span className="stage-status">
        {chosenEntries.length === 0
          ? 'Choose a piece to begin'
          : `${pieces.length} piece${pieces.length === 1 ? '' : 's'} in your setup`}
        {SHOW_PRICES && chosenEntries.length > 0 ? (
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
          onClick={() => setChosen([])}
          disabled={chosen.length === 0}
        >
          Clear all
        </button>
      </span>
    </div>
  );

  return (
    <>
      <div className="builder-grid">
        <section className="palette" aria-label="Pieces you can add">
          <div className="palette-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pieces"
              aria-label="Search pieces"
            />
          </div>
          {visibleGroups.length === 0 ? (
            <p className="palette-empty">No pieces match that search.</p>
          ) : (
            <div className="palette-list">
              {visibleGroups.map(({ category, entries: group }) => (
                <div key={category} className="palette-group">
                  <p className="palette-heading">
                    <span>{category}</span>
                    <span>{group.length}</span>
                  </p>
                  {group.map((entry) => {
                    const added = chosen.includes(entry.key);
                    return (
                      <button
                        key={entry.key}
                        type="button"
                        className="palette-item"
                        onClick={() => toggle(entry.key)}
                        aria-pressed={added}
                        aria-label={`${added ? 'Remove' : 'Add'} ${entry.name}`}
                      >
                        <span className="palette-label">
                          <span className="palette-name">{entry.name}</span>
                          <span className="palette-price">
                            {SHOW_PRICES ? formatPrice(entry.price) : null}
                            {entry.isPackage
                              ? `${SHOW_PRICES ? ' · ' : ''}${entry.items.length} pieces`
                              : null}
                          </span>
                        </span>
                        {added ? (
                          <Check
                            className="palette-add"
                            size={15}
                            aria-hidden="true"
                          />
                        ) : (
                          <Plus
                            className="palette-add"
                            size={15}
                            aria-hidden="true"
                          />
                        )}
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
            {/* No onSelect or onMove: the layout is the admin's, not the visitor's. */}
            <SetupCanvas pieces={pieces} />
          </div>
          {stageBar}
        </section>
      </div>

      <section className="setup-summary" aria-label="Your setup so far">
        <h2>Your setup</h2>
        {chosenEntries.length === 0 ? (
          <p>Nothing added yet. Pick a piece from the list to start.</p>
        ) : (
          <ul>
            {chosenEntries.map((entry) => (
              <li key={entry.key}>
                {entry.name}{' '}
                <span>{entry.isPackage ? `${entry.items.length} pieces` : ''}</span>
                {SHOW_PRICES ? <span>{formatPrice(entry.price)}</span> : null}
              </li>
            ))}
          </ul>
        )}
        {SHOW_PRICES && chosenEntries.length > 0 ? (
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
          disabled={chosenEntries.length === 0}
        >
          Send this setup with my inquiry <ArrowUpRight size={18} />
        </button>
      </section>
    </>
  );
}
