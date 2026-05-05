// LoremFlickr returns CC-licensed Flickr photos matched by tags.
// `lock=N` makes each URL return the same image every time (enables caching).
// Phase 6 : remplacer les URL par des require('../../assets/images/xxx.jpg') quand Elliess aura ses propres visuels.

const flickr = (keywords: string, lock: number, w = 600, h = 400) =>
  `https://loremflickr.com/${w}/${h}/${encodeURIComponent(keywords)}?lock=${lock}`;

/** Product id → URL. Fallback to emoji handled by SmartImage. */
export const PRODUCT_IMAGES: Record<string, string> = {
  bowl: flickr('chicken,bowl,rice,healthy,food', 101),
  bar: flickr('energy,bar,protein,chocolate,snack', 102),
  wrap: flickr('wrap,vegetable,fresh,salad,healthy', 103),
  shake: flickr('smoothie,protein,shake,green,drink', 104),
};

/** Dashboard "Cette semaine" meals — keyed by label. */
export const MEAL_IMAGES: Record<string, string> = {
  'Chicken Bowl': flickr('chicken,bowl,rice,healthy,food', 101),
  'Protein Shake': flickr('smoothie,protein,shake,green,drink', 104),
  'Energy Bar': flickr('energy,bar,protein,chocolate,snack', 102),
};

/** Scanner result food photo (matches the identified dish name). */
export const SCANNER_DEFAULT_IMAGE = flickr('chicken,rice,plate,grilled,healthy', 201);

/** Fridge / location hero photos (keyed by fridge id). */
export const FRIDGE_IMAGES: Record<string, string> = {
  fcnation: flickr('gym,fitness,club,paris,interior', 301),
  szconfluence: flickr('sport,gym,modern,fitness,studio', 302),
  urbrepub: flickr('workout,gym,urban,fitness,club', 303),
};

/** Closest fridge hero on Dashboard. */
export const CLOSEST_FRIDGE_BG = flickr('gym,fitness,interior,modern,warm', 304);
