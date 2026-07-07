// Visuels bundlés en local (photos Unsplash, licence libre, pas d'attribution requise).
// Plus aucune dépendance réseau : chargement instantané, fiable hors ligne et en démo.
import type { ImageSourcePropType } from 'react-native';

/** Product id → asset local. Fallback emoji géré par SmartImage. */
export const PRODUCT_IMAGES: Record<string, ImageSourcePropType> = {
  bowl: require('../../assets/images/product-bowl.jpg'),
  bar: require('../../assets/images/product-bar.jpg'),
  wrap: require('../../assets/images/product-wrap.jpg'),
  shake: require('../../assets/images/product-shake.jpg'),
};

/** Repas du Dashboard — indexés par libellé. */
export const MEAL_IMAGES: Record<string, ImageSourcePropType> = {
  'Chicken Bowl': PRODUCT_IMAGES.bowl,
  'Protein Shake': PRODUCT_IMAGES.shake,
  'Energy Bar': PRODUCT_IMAGES.bar,
  'Veggie Wrap': PRODUCT_IMAGES.wrap,
};

/**
 * Correspondance tolérante : « Chicken Bowl · 1 unité » matche la clé « Chicken Bowl ».
 * Retourne undefined si aucun visuel ne correspond (SmartImage affiche l'emoji).
 */
export function mealImageFor(food: string): ImageSourcePropType | undefined {
  if (MEAL_IMAGES[food]) return MEAL_IMAGES[food];
  const key = Object.keys(MEAL_IMAGES).find((k) => food.startsWith(k));
  return key ? MEAL_IMAGES[key] : undefined;
}

/** Photo du plat identifié par le scanner. */
export const SCANNER_DEFAULT_IMAGE: ImageSourcePropType = require('../../assets/images/scanner-meal.jpg');
