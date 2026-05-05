import { C } from '../tokens';
import type { Product } from '../types';

// glu / lip added for journal tracking (grams)
export const PRODUCTS: Product[] = [
  { id: 'bowl', e: '🍗', t: 'Chicken Bowl', cat: 'Repas', kcal: 420, prot: 38, glu: 48, lip: 12, price: 8.9, color: C.orange },
  { id: 'bar', e: '🍫', t: 'Energy Bar', cat: 'Snack', kcal: 190, prot: 12, glu: 22, lip: 6, price: 3.2, color: C.lime },
  { id: 'wrap', e: '🥗', t: 'Veggie Wrap', cat: 'Végé', kcal: 340, prot: 18, glu: 32, lip: 10, price: 7.5, color: C.green },
  { id: 'shake', e: '🥤', t: 'Protein Shake', cat: 'Boisson', kcal: 280, prot: 25, glu: 15, lip: 4, price: 4.5, color: C.orange },
];

export const formatPrice = (n: number) => n.toFixed(2).replace('.', ',');
