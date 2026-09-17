'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, LogOut, Trash2, Upload } from 'lucide-react';
import { CATEGORIES, CURRENCY } from '../build-your-setup/catalog';
import type { Piece } from '../build-your-setup/SetupCanvas';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  deleteItem,
  fetchAllItems,
  groupIntoEntries,
  modelUrl,
  nameFromFile,
  saveItem,
  type SetupItemRow,
  uploadModel,
} from '@/lib/setup-items';

const SetupCanvas = dynamic(() => import('../build-your-setup/SetupCanvas'), {
  ssr: false,
  loading: () => <p className="canvas-loading">Preparing the preview…</p>,
});

/** The scene stores radians; the panel shows whole degrees. */
const TO_DEGREES = 180 / Math.PI;
const TO_RADIANS = Math.PI / 180;

/** How high a piece may be lifted off the floor, in metres. */
const MAX_HEIGHT = 4;

/** Defaults a freshly uploaded model starts with: centre of the floor, unscaled. */
const defaultsFor = (
  file: string,
  path: string,
  order: number,
  pkg: string,
) => ({
  name: nameFromFile(file),
  category: String(CATEGORIES[0]),
  price: 0,
  model_path: path,
  position_x: 0,
  position_y: 0,
  position_z: 0,
  rotation_y: 0,
  scale: 1,
  is_active: true,
  sort_order: order,
  package: pkg.trim() || null,
});

/** Reads a number field without ever letting NaN reach the database. */
const num = (value: string, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function AdminPanel() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  // Starts false when there is no client to ask: that case renders the
  // "not configured" screen below without ever consulting this flag.
  const [checking, setChecking] = useState(Boolean(supabase));
  const [items, setItems] = useState<SetupItemRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SetupItemRow | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  /** Package the next upload goes into; blank uploads stand on their own. */
  const [packageName, setPackageName] = useState('');

  const load = useCallback(async () => {
    const { items: rows, error: loadError } = await fetchAllItems();
    setItems(rows);
    setError(loadError);
    return rows;
  }, []);

  // Nobody without a session gets to see the panel. Row level security would
  // refuse the writes anyway; this just avoids showing an unusable screen.
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      if (!data.session) {
        router.replace('/admin/login');
        return;
      }
      await load();
      if (alive) setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/admin/login');
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [load, router]);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const dirty = Boolean(
    draft && selected && JSON.stringify(draft) !== JSON.stringify(selected),
  );

  /** Switching away from unsaved edits should be a decision, not an accident. */
  const select = (item: SetupItemRow | null) => {
    if (
      dirty &&
      !window.confirm('You have unsaved changes. Discard them?')
    ) {
      return;
    }
    setSelectedId(item?.id ?? null);
    setDraft(item ? { ...item } : null);
    setNote(null);
  };

  const patch = (changes: Partial<SetupItemRow>) =>
    setDraft((current) => (current ? { ...current, ...changes } : current));

  /**
   * The preview shows the scene as customers will see it — every visible piece
   * at its saved spot — with the piece being edited drawn from the unsaved
   * draft so dragging and typing show up immediately.
   */
  const pieces = useMemo<Piece[]>(() => {
    const shown = items.filter(
      (item) => item.is_active || item.id === selectedId,
    );
    return shown.map((item) => {
      const source = draft && item.id === selectedId ? draft : item;
      return {
        uid: item.id,
        x: source.position_x,
        y: source.position_y,
        z: source.position_z,
        rotation: source.rotation_y,
        scale: source.scale,
        source: { kind: 'glb' as const, url: modelUrl(source.model_path) },
        ringSize: 1.4,
      };
    });
  }, [draft, items, selectedId]);

  /**
   * Several files at once become several pieces. Given a package name they all
   * carry it, which is what makes them one row in the customer's palette — so a
   * whole arrangement can be uploaded and placed piece by piece, then sold as
   * one thing.
   */
  const handleUpload = async (files: File[]) => {
    const models = files.filter((file) => /\.(glb|gltf)$/i.test(file.name));
    if (models.length === 0) {
      setError('Choose .glb files (or .gltf). Other formats will not load.');
      return;
    }
    setError(null);
    setNote(null);

    const added: SetupItemRow[] = [];
    const failures: string[] = [];
    for (const [index, file] of models.entries()) {
      setBusy(`Uploading ${index + 1} of ${models.length}…`);
      const { path, error: uploadError } = await uploadModel(file);
      if (!path) {
        failures.push(`${file.name}: ${uploadError}`);
        continue;
      }
      const { item, error: saveError } = await saveItem(
        defaultsFor(file.name, path, items.length + added.length, packageName),
      );
      if (!item) {
        failures.push(`${file.name}: ${saveError}`);
        continue;
      }
      added.push(item);
    }
    setBusy(null);

    if (added.length > 0) {
      setItems((current) => [...current, ...added]);
      const first = added[0];
      setSelectedId(first.id);
      setDraft({ ...first });
      setNote(
        added.length === 1
          ? 'Uploaded. Set the price and drag it into place, then save.'
          : `${added.length} pieces uploaded${packageName.trim() ? ` into "${packageName.trim()}"` : ''}. Place and price them one by one.`,
      );
    }
    // Partial failures are named rather than summarised: which file failed is
    // the only part the person here can act on.
    setError(failures.length > 0 ? failures.join(' · ') : null);
  };

  const handleSave = async () => {
    if (!draft) return;
    setBusy('Saving…');
    setError(null);
    const { item, error: saveError } = await saveItem(draft);
    setBusy(null);
    if (!item) {
      setError(saveError);
      return;
    }
    setItems((current) =>
      current.map((entry) => (entry.id === item.id ? item : entry)),
    );
    setDraft({ ...item });
    setNote('Saved. Customers see this straight away.');
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (
      !window.confirm(
        `Delete "${selected.name}"? This removes the model file as well and cannot be undone.`,
      )
    ) {
      return;
    }
    setBusy('Deleting…');
    setError(null);
    const { error: deleteError } = await deleteItem(selected);
    setBusy(null);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    setItems((current) => current.filter((entry) => entry.id !== selected.id));
    setSelectedId(null);
    setDraft(null);
    setNote('Deleted.');
  };

  const handleMove = (uid: string, x: number, z: number) => {
    if (uid !== selectedId) return;
    patch({ position_x: Number(x.toFixed(2)), position_z: Number(z.toFixed(2)) });
  };

  if (!isSupabaseConfigured) {
    return (
      <main className="form-page wrap">
        <h1>Setup catalog</h1>
        <p className="admin-alert">
          Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and a
          publishable key to <code>.env.local</code>, then restart the server.
        </p>
      </main>
    );
  }

  if (checking) {
    return (
      <main className="form-page wrap">
        <p className="canvas-loading">Checking your session…</p>
      </main>
    );
  }

  return (
    <>
      <header id="top">
        <Link href="/" className="logo" aria-label="BASE Entertainment home">
          BASE
        </Link>
        <span className="admin-header-actions">
          <Link className="text-link" href="/build-your-setup" target="_blank">
            View the live page <ExternalLink size={16} />
          </Link>
          <button
            type="button"
            className="ghost-button"
            onClick={() => supabase?.auth.signOut()}
          >
            <LogOut size={16} /> Sign out
          </button>
        </span>
      </header>
      <main id="main" className="admin wrap">
        <div className="builder-head">
          <p className="eyebrow">SETUP CATALOG</p>
          <h1>Your 3D pieces</h1>
          <p className="form-intro">
            Upload a model, give it a price, and drag it to the spot it should
            take when a customer picks it. That spot is fixed — customers choose
            pieces, they do not move them.
          </p>
        </div>

        {error ? <p className="admin-alert">{error}</p> : null}
        {note ? <p className="admin-note">{note}</p> : null}

        <div className="admin-grid">
          <section className="admin-list" aria-label="Uploaded pieces">
            <p className="field">
              <label htmlFor="package-name">Package for the next upload</label>
              <input
                id="package-name"
                value={packageName}
                onChange={(event) => setPackageName(event.target.value)}
                placeholder="Leave empty for single pieces"
              />
            </p>
            <label className="button admin-upload">
              <Upload size={16} /> {busy?.startsWith('Uploading') ? busy : 'Upload .glb files'}
              <input
                ref={fileInput}
                type="file"
                accept=".glb,.gltf,model/gltf-binary"
                multiple
                hidden
                onChange={(event) => {
                  const files = [...(event.target.files ?? [])];
                  if (files.length > 0) void handleUpload(files);
                  // Let the same files be picked again after a failed upload.
                  if (fileInput.current) fileInput.current.value = '';
                }}
              />
            </label>
            <p className="admin-hint">
              Pick several files at once to fill a package. Name the package
              first and they all land in it; its price is what its pieces come
              to together.
            </p>

            {items.length === 0 ? (
              <p className="palette-empty">
                Nothing uploaded yet. Until you add a piece, the public page
                keeps showing the built-in shapes.
              </p>
            ) : (
              <div className="palette-list">
                {groupIntoEntries(items).map((entry) => (
                  <div key={entry.key} className="palette-group">
                    {entry.isPackage ? (
                      <p className="palette-heading">
                        <span>
                          {entry.name} · {entry.items.length} pieces
                        </span>
                        <span>
                          {CURRENCY}
                          {entry.price.toLocaleString('en-US')}
                        </span>
                      </p>
                    ) : null}
                    {entry.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`palette-item${item.id === selectedId ? ' is-selected' : ''}`}
                        onClick={() => select(item)}
                      >
                        <span className="palette-label">
                          <span className="palette-name">{item.name}</span>
                          <span className="palette-price">
                            {CURRENCY}
                            {item.price.toLocaleString('en-US')} ·{' '}
                            {item.category}
                          </span>
                        </span>
                        {!item.is_active ? (
                          <span className="palette-used">hidden</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="admin-editor" aria-label="Piece settings">
            {!draft ? (
              <p className="palette-empty">
                Pick a piece on the left to edit it, or upload a new one.
              </p>
            ) : (
              <>
                <div className="canvas-shell">
                  <SetupCanvas
                    pieces={pieces}
                    selected={selectedId}
                    onSelect={(uid) => {
                      const next = items.find((item) => item.id === uid) ?? null;
                      if (next && next.id !== selectedId) select(next);
                    }}
                    onMove={handleMove}
                  />
                </div>
                <p className="admin-hint">
                  Drag the piece across the floor to set where it lands. Drag the
                  background to look around.
                </p>

                <div className="field-row">
                  <p className="field">
                    <label htmlFor="name">Name</label>
                    <input
                      id="name"
                      value={draft.name}
                      onChange={(event) => patch({ name: event.target.value })}
                    />
                  </p>
                  <p className="field">
                    <label htmlFor="category">Category</label>
                    <select
                      id="category"
                      value={draft.category}
                      onChange={(event) =>
                        patch({ category: event.target.value })
                      }
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                      {CATEGORIES.map(String).includes(draft.category) ? null : (
                        <option>{draft.category}</option>
                      )}
                    </select>
                  </p>
                </div>

                <div className="field-row">
                  <p className="field">
                    <label htmlFor="price">Price ({CURRENCY})</label>
                    <input
                      id="price"
                      type="number"
                      min={0}
                      step={5}
                      value={draft.price}
                      onChange={(event) =>
                        patch({ price: Math.max(0, Math.round(num(event.target.value))) })
                      }
                    />
                  </p>
                  <p className="field">
                    <label htmlFor="order">List order</label>
                    <input
                      id="order"
                      type="number"
                      step={1}
                      value={draft.sort_order}
                      onChange={(event) =>
                        patch({ sort_order: Math.round(num(event.target.value)) })
                      }
                    />
                  </p>
                </div>

                <div className="field-row">
                  <p className="field">
                    <label htmlFor="x">Across (x)</label>
                    <input
                      id="x"
                      type="number"
                      step={0.1}
                      value={draft.position_x}
                      onChange={(event) =>
                        patch({ position_x: num(event.target.value) })
                      }
                    />
                  </p>
                  <p className="field">
                    <label htmlFor="z">Depth (z)</label>
                    <input
                      id="z"
                      type="number"
                      step={0.1}
                      value={draft.position_z}
                      onChange={(event) =>
                        patch({ position_z: num(event.target.value) })
                      }
                    />
                  </p>
                </div>

                {/* Height has no drag of its own — the floor drag sets x and z —
                    so the slider is how a piece gets hung, floated or raised. */}
                <p className="field">
                  <label htmlFor="height">Height off the floor</label>
                  <span className="admin-slider">
                    <input
                      id="height"
                      type="range"
                      min={0}
                      max={MAX_HEIGHT}
                      step={0.05}
                      value={Math.min(MAX_HEIGHT, Math.max(0, draft.position_y))}
                      onChange={(event) =>
                        patch({ position_y: num(event.target.value) })
                      }
                    />
                    <input
                      type="number"
                      step={0.05}
                      aria-label="Height off the floor in metres"
                      value={draft.position_y}
                      onChange={(event) =>
                        patch({ position_y: num(event.target.value) })
                      }
                    />
                  </span>
                </p>

                <div className="field-row">
                  <p className="field">
                    <label htmlFor="scale">Size</label>
                    <input
                      id="scale"
                      type="number"
                      min={0.05}
                      step={0.05}
                      value={draft.scale}
                      onChange={(event) =>
                        patch({ scale: Math.max(0.05, num(event.target.value, 1)) })
                      }
                    />
                  </p>
                  <p className="field">
                    <label htmlFor="rotation">Turn (degrees)</label>
                    <input
                      id="rotation"
                      type="number"
                      step={5}
                      value={Math.round(draft.rotation_y * TO_DEGREES)}
                      onChange={(event) =>
                        patch({ rotation_y: num(event.target.value) * TO_RADIANS })
                      }
                    />
                  </p>
                </div>

                <p className="field">
                  <label htmlFor="package">Package</label>
                  <input
                    id="package"
                    value={draft.package ?? ''}
                    placeholder="Empty: sold on its own"
                    onChange={(event) =>
                      patch({ package: event.target.value.trim() || null })
                    }
                  />
                </p>

                <p className="consent-item">
                  <input
                    id="active"
                    type="checkbox"
                    checked={draft.is_active}
                    onChange={(event) =>
                      patch({ is_active: event.target.checked })
                    }
                  />
                  <label htmlFor="active">
                    Customers can pick this piece. Untick to keep it uploaded but
                    hidden from the public page.
                  </label>
                </p>

                <div className="admin-actions">
                  <button
                    type="button"
                    className="button"
                    onClick={() => void handleSave()}
                    disabled={!dirty || busy !== null}
                  >
                    {busy === 'Saving…' ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => void handleDelete()}
                    disabled={busy !== null}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                  <span className="admin-dirty">
                    {dirty ? 'Unsaved changes' : 'Everything saved'}
                  </span>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
