/**
 * Open Food Facts client.
 * Doc : https://wiki.openfoodfacts.org/API
 * Gratuit, sans auth, base CC-BY-SA 3M+ produits FR.
 */

const BASE = 'https://world.openfoodfacts.org';

// Champs minimaux pour réduire la bande passante.
const FIELDS = [
  'code',
  'product_name',
  'product_name_fr',
  'brands',
  'image_thumb_url',
  'image_small_url',
  'serving_size',
  'serving_quantity',
  'nutriments',
].join(',');

export type FoodHit = {
  code: string;
  name: string;
  brand?: string;
  image?: string;
  servingSize?: string; // libellé brut "30 g" ou "1 unité"
  servingGrams?: number; // poids serving en g (si dispo)
  // Nutriments par 100g (sources : nutriments.energy-kcal_100g etc.)
  per100: {
    kcal: number;
    prot: number;
    glu: number;
    lip: number;
  };
};

type RawProduct = {
  code: string;
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  image_thumb_url?: string;
  image_small_url?: string;
  serving_size?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string>;
};

function num(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

function normalize(p: RawProduct): FoodHit | null {
  const name = (p.product_name_fr || p.product_name || '').trim();
  if (!name) return null;
  const n = p.nutriments ?? {};
  const kcal = num(n['energy-kcal_100g'] ?? n['energy-kcal']);
  // Si pas de kcal renseigné, on tente depuis kJ.
  const kcalFromKj = kcal === 0 ? num(n['energy_100g']) / 4.184 : kcal;
  return {
    code: p.code,
    name,
    brand: (p.brands || '').split(',')[0]?.trim() || undefined,
    image: p.image_small_url || p.image_thumb_url || undefined,
    servingSize: p.serving_size || undefined,
    servingGrams: p.serving_quantity ? num(p.serving_quantity) : undefined,
    per100: {
      kcal: Math.round(kcalFromKj),
      prot: Math.round(num(n['proteins_100g']) * 10) / 10,
      glu: Math.round(num(n['carbohydrates_100g']) * 10) / 10,
      lip: Math.round(num(n['fat_100g']) * 10) / 10,
    },
  };
}

export async function searchFoods(query: string, signal?: AbortSignal): Promise<FoodHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const url = `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(
    trimmed
  )}&search_simple=1&action=process&json=1&page_size=20&fields=${FIELDS}&lc=fr`;
  const res = await fetch(url, { signal, headers: { 'User-Agent': 'Natty/0.1 (mobile)' } });
  if (!res.ok) throw new Error(`OFF search ${res.status}`);
  const json = (await res.json()) as { products?: RawProduct[] };
  return (json.products ?? [])
    .map(normalize)
    .filter((x): x is FoodHit => x !== null && x.per100.kcal > 0);
}

export async function getFoodByBarcode(code: string, signal?: AbortSignal): Promise<FoodHit | null> {
  const url = `${BASE}/api/v0/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`;
  const res = await fetch(url, { signal, headers: { 'User-Agent': 'Natty/0.1 (mobile)' } });
  if (!res.ok) return null;
  const json = (await res.json()) as { status?: number; product?: RawProduct };
  if (!json.product || json.status !== 1) return null;
  return normalize(json.product);
}

/** Calcule les macros pour une portion en grammes. */
export function macrosForPortion(food: FoodHit, grams: number) {
  const f = grams / 100;
  return {
    kcal: Math.round(food.per100.kcal * f),
    prot: Math.round(food.per100.prot * f * 10) / 10,
    glu: Math.round(food.per100.glu * f * 10) / 10,
    lip: Math.round(food.per100.lip * f * 10) / 10,
  };
}

/** Emoji deviné depuis le nom du plat — fallback générique. */
export function guessEmoji(name: string): string {
  const n = name.toLowerCase();
  if (/poulet|chicken|volaille/.test(n)) return '🍗';
  if (/poisson|saumon|thon|fish/.test(n)) return '🐟';
  if (/boeuf|steak|burger/.test(n)) return '🥩';
  if (/oeuf|egg/.test(n)) return '🥚';
  if (/pain|bread|sandwich|wrap/.test(n)) return '🥪';
  if (/pizza/.test(n)) return '🍕';
  if (/pasta|p[aâ]te|spaghet/.test(n)) return '🍝';
  if (/riz|rice|risotto/.test(n)) return '🍚';
  if (/salade|salad|crudit/.test(n)) return '🥗';
  if (/fruit|pomme|banane|apple|banana/.test(n)) return '🍎';
  if (/yaourt|yogurt|fromage|cheese/.test(n)) return '🧀';
  if (/chocolat|chocolate/.test(n)) return '🍫';
  if (/barre|bar(re)?/.test(n)) return '🍫';
  if (/shake|smoothie|prot[eé]ine/.test(n)) return '🥤';
  if (/soupe|soup/.test(n)) return '🍲';
  if (/g[aâ]teau|cake|p[aâ]tisserie/.test(n)) return '🍰';
  if (/caf[eé]|coffee/.test(n)) return '☕';
  if (/eau|water/.test(n)) return '💧';
  if (/bi[eè]re|beer|vin|wine/.test(n)) return '🍷';
  return '🍽️';
}
