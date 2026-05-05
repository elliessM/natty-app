# Natty — App Mobile

Implementation React Native / Expo du prototype Natty (nutrition sportive phygitale).

## Lancer

```bash
cd "~/Desktop/projet natty/app"
npm install
npx expo start -c
```

## Phase 1 — architecture (fait)

- **Navigation** : `react-navigation` v7, 4 stacks + 1 tab bar natifs
  - Root (NativeStack) : switch Onboarding → Main selon `hasOnboarded`
  - Onboarding : Welcome → Objectifs → Restrictions → Ready
  - Main (BottomTabs) : Accueil / Frigos / Scan (bouton central) / Club / Profil
  - MapStack (imbrique dans l'onglet Frigos) : SmartMap → AchatS1 → S2 → S3 → S4 → S5
  - ScannerModal : ScannerCapture → ScannerResult (presentation: modal, slide-from-bottom)
- **State global** : `zustand` avec persistence AsyncStorage
  - `useUserStore` : nom, goal, restrictions, macroPct, hasOnboarded
  - `useCartStore` : items, addItem, incrementItem, decrementItem, clear, subtotal
  - `useScanStore` : lastResult (pas persiste, ephemere)
- **Safe area** : `SafeAreaProvider` + `GestureHandlerRootView` + `expo-status-bar`
- **Back gesture iOS** : activee par defaut, desactivee sur S4/S5 (flow force)
- **Tab bar** : cachee automatiquement sur les ecrans Achat (reste visible sur SmartMap)

## Structure

```
app/
  App.tsx                       # Shell: fonts + SafeAreaProvider + RootNavigator
  index.ts                      # Gesture handler import + entry
  src/
    tokens.ts                   # Palette Natty, typo, shadows
    types.ts                    # Types metier (Goal, Product, CartItem, ScanResult)
    data/products.ts            # PRODUCTS hardcode + formatPrice
    store/
      useUserStore.ts           # zustand + persist
      useCartStore.ts
      useScanStore.ts
    navigation/
      types.ts                  # ParamList pour chaque stack
      RootNavigator.tsx         # Switch onboarding/main
      OnboardingStack.tsx
      MainTabs.tsx              # 5 onglets, bouton scan custom
      MapStack.tsx              # SmartMap + Achat
      ScannerStack.tsx          # Modal
    screens/
      OnbWelcome/Objectifs/Restrictions/Ready.tsx
      Dashboard.tsx
      SmartMap.tsx
      AchatS1..S5.tsx
      ScannerCapture/Result.tsx
      Social.tsx
      ProfileStub.tsx           # Ecran Profil placeholder + reset dev
    shared/
      StatusBar.tsx             # no-op (OS status bar gere par expo-status-bar)
      HomeIndicator.tsx         # no-op
      Ambience.tsx              # Glows radiales
      MacroRings.tsx            # 3 rings animes
      Icons.tsx
      BottomNav.tsx             # SUPPRIME (tab bar native le remplace)
      TopNav.tsx                # Back + step chip
      ProgressBar.tsx           # 1/4, 2/4 ...
      Buttons.ts                # btnPrimary, btnDark, btnSkip styles
  assets/
    fonts/ObviouslyDemo-Black.otf
    logos/*.png
```

## Ce qui reste (phase 2+)

- **Responsive** : l'app render natif au 390x844 du design. Sur iPhone SE (375) clip leger, sur Pro Max (430) legere marge. Refactor flex prevu phase 2.
- Camera reelle (expo-camera), map reelle (react-native-maps)
- Auth + backend (Supabase)
- Paiement reel (Stripe)
- BLE (react-native-ble-plx)
- Animations de transition custom (reanimated)
- A11y complete, tests (jest + maestro)

## Tips dev

- Pour reset l'onboarding : aller dans l'onglet **Profil** → bouton "Reinitialiser onboarding".
- La persistance utilise 2 cles AsyncStorage : `natty.user` et `natty.cart`.
