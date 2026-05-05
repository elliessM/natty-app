export type ScreenId =
  | 'welcome'
  | 'objectifs'
  | 'restrictions'
  | 'pret'
  | 'dashboard'
  | 'map'
  | 'scanner'
  | 'scannerResult'
  | 'achat'
  | 'achat2'
  | 'achat3'
  | 'achat4'
  | 'achat5'
  | 'social';

export type Goal = 'energy' | 'muscle' | 'weight' | 'perf';
export type Sex = 'M' | 'F' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'active' | 'athlete';

export type OnbState = {
  name: string;
  goal: Goal;
  restrictions: string[];
  macroPct: number;
};

export type MacroTargets = {
  kcal: number;
  prot: number;
  glu: number;
  lip: number;
};

export type Product = {
  id: string;
  e: string;
  t: string;
  cat: string;
  kcal: number;
  prot: number;
  glu: number;
  lip: number;
  price: number;
  color: string;
};

export type CartItem = Product & { qty: number };

export type ScanResult = { food: string; kcal: number; prot: number; glu: number; lip: number };

export type GotoFn = (id: ScreenId) => void;
