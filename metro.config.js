const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Sur le web, certains packages tiers (notamment @supabase/supabase-js) ont
// un champ `exports` ESM qui contient `import.meta` ou pointe vers des fichiers
// inexistants dans certains builds. On force Metro à n'utiliser que le champ
// `main` (CommonJS) en désactivant la résolution via `exports`.
//
// Côté natif on garde la résolution moderne (plus rapide, plus à jour).
const originalResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    const webContext = { ...context, unstable_enablePackageExports: false };
    if (originalResolve) return originalResolve(webContext, moduleName, platform);
    return webContext.resolveRequest(webContext, moduleName, platform);
  }
  if (originalResolve) return originalResolve(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
