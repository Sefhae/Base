// The items a customer can place in their 3D setup.
//
// THIS IS THE LIST YOU CONTROL. Add, remove, rename, recolour or reprice entries
// here and both the palette and the running total update automatically.
//
// ⚠ THE PRICES BELOW ARE EXAMPLE PLACEHOLDERS, NOT REAL PRICING.
//   They exist so the running total has something to add up. Replace every
//   `price` with your real figure before this page goes live, or remove pricing
//   entirely by setting SHOW_PRICES to false.
//
// Each entry needs:
//   id       unique key, also used to look the item up
//   name     the label shown in the palette and in the setup summary
//   category which group it appears under (see CATEGORIES below)
//   model    which shape to draw — must match a case in items.tsx
//   color    the main colour of the shape
//   size     rough footprint in metres, used to space newly added items apart
//   price    EXAMPLE price in whole US dollars — see the warning above
export type Category = 'Proposal' | 'Wedding' | 'Celebration' | 'Lighting';

export type CatalogItem = {
  id: string;
  name: string;
  category: Category;
  model: string;
  color: string;
  size: number;
  price: number;
};

/** Set to false to hide every price and the running total. */
export const SHOW_PRICES = true;

/** Currency prefix used next to each number. */
export const CURRENCY = '$';

export const CATEGORIES: Category[] = [
  'Proposal',
  'Wedding',
  'Celebration',
  'Lighting',
];

export const CATALOG: CatalogItem[] = [
  // ---------- Proposal ----------
  {
    id: 'flower-arch',
    name: 'Heart arch frame',
    category: 'Proposal',
    model: 'arch',
    color: '#e6cfdd',
    size: 2.9,
    price: 380,
  },
  {
    id: 'marry-me',
    name: '"MARRY ME" letters',
    category: 'Proposal',
    model: 'letters',
    color: '#f5f1e6',
    size: 2.4,
    price: 220,
  },
  {
    id: 'candle-path',
    name: 'Candle path',
    category: 'Proposal',
    model: 'candlePath',
    color: '#f6e7c8',
    size: 3,
    price: 140,
  },
  {
    id: 'petal-circle',
    name: 'Petal circle',
    category: 'Proposal',
    model: 'petalCircle',
    color: '#cf5f66',
    size: 2.8,
    price: 90,
  },
  {
    id: 'rug',
    name: 'Round rug',
    category: 'Proposal',
    model: 'rug',
    color: '#cdbba4',
    size: 2.4,
    price: 70,
  },
  {
    id: 'flower-stand',
    name: 'Flower stand',
    category: 'Proposal',
    model: 'flowerStand',
    color: '#dfa9bd',
    size: 1,
    price: 85,
  },

  // ---------- Wedding ----------
  {
    id: 'moon-frame',
    name: 'Floral moon frame',
    category: 'Wedding',
    model: 'moonFrame',
    color: '#f0dce6',
    size: 2.6,
    price: 340,
  },
  {
    id: 'aisle-runner',
    name: 'Aisle runner',
    category: 'Wedding',
    model: 'aisleRunner',
    color: '#f7f4ec',
    size: 4.4,
    price: 120,
  },
  {
    id: 'love-letters',
    name: '"LOVE" letters',
    category: 'Wedding',
    model: 'loveLetters',
    color: '#f5f1e6',
    size: 1.8,
    price: 210,
  },
  {
    id: 'rose-column',
    name: 'Rose column',
    category: 'Wedding',
    model: 'roseColumn',
    color: '#e2909f',
    size: 1,
    price: 180,
  },
  {
    id: 'champagne-table',
    name: 'Champagne table',
    category: 'Wedding',
    model: 'champagneTable',
    color: '#f2efe6',
    size: 1.1,
    price: 160,
  },
  {
    id: 'ring-podium',
    name: 'Ring podium',
    category: 'Wedding',
    model: 'ringPodium',
    color: '#efe8da',
    size: 0.8,
    price: 95,
  },
  {
    id: 'photo-frame',
    name: 'Standing photo frame',
    category: 'Wedding',
    model: 'photoFrame',
    color: '#c8a86a',
    size: 1,
    price: 75,
  },

  // ---------- Celebration ----------
  {
    id: 'round-table',
    name: 'Round table',
    category: 'Celebration',
    model: 'table',
    color: '#f2efe6',
    size: 1.4,
    price: 60,
  },
  {
    id: 'chair',
    name: 'Chair',
    category: 'Celebration',
    model: 'chair',
    color: '#8a7f6e',
    size: 0.8,
    price: 15,
  },
  {
    id: 'balloon-column',
    name: 'Balloon column',
    category: 'Celebration',
    model: 'balloonColumn',
    color: '#bfd2c4',
    size: 1,
    price: 130,
  },
  {
    id: 'cake-table',
    name: 'Cake table',
    category: 'Celebration',
    model: 'cakeTable',
    color: '#f7f3ea',
    size: 1.2,
    price: 110,
  },
  {
    id: 'backdrop',
    name: 'Backdrop panel',
    category: 'Celebration',
    model: 'backdrop',
    color: '#29483f',
    size: 2.8,
    price: 250,
  },

  // ---------- Lighting ----------
  {
    id: 'string-lights',
    name: 'String lights',
    category: 'Lighting',
    model: 'stringLights',
    color: '#ffd9a0',
    size: 3.4,
    price: 150,
  },
  {
    id: 'lantern',
    name: 'Lantern',
    category: 'Lighting',
    model: 'lantern',
    color: '#ffca7a',
    size: 0.7,
    price: 25,
  },
  {
    id: 'uplight',
    name: 'Ground uplight',
    category: 'Lighting',
    model: 'uplight',
    color: '#ffd9a0',
    size: 0.6,
    price: 45,
  },
];

export const findItem = (id: string) => CATALOG.find((item) => item.id === id);

export const formatPrice = (amount: number) =>
  `${CURRENCY}${amount.toLocaleString('en-US')}`;
