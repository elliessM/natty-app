// Injecte les meta tags PWA / Apple dans le HTML généré par Expo web,
// que Expo SDK 54 ne fournit pas nativement.
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
if (!fs.existsSync(indexPath)) {
  console.warn('[inject-meta] dist/index.html introuvable');
  process.exit(0);
}

let html = fs.readFileSync(indexPath, 'utf8');

if (html.includes('apple-touch-icon')) {
  console.log('[inject-meta] tags déjà présents, skip');
  process.exit(0);
}

const tags = `
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
  <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
  <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
  <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Natty" />
  <meta name="theme-color" content="#00412f" />
  <style>
    html, body, #root {
      width: 100%;
      max-width: 100vw;
      overflow-x: hidden;
      overscroll-behavior-x: none;
      overscroll-behavior-y: contain;
      -webkit-overflow-scrolling: touch;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    html, body {
      position: fixed;
      inset: 0;
      margin: 0;
      padding: 0;
    }
    #root {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }
  </style>
`;

// On veut aussi un viewport qui empêche le pinch-zoom horizontal accidentel.
const viewportFix = `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />`;
html = html.replace(/<meta name="viewport"[^>]*>/i, viewportFix);
if (!html.includes('name="viewport"')) {
  html = html.replace('<head>', `<head>\n  ${viewportFix}`);
}

html = html.replace('</head>', `${tags}</head>`);

// ─── DEBUG TEMPORAIRE : overlay de mesures viewport (PWA standalone uniquement) ───
// À retirer une fois le bug « barre blanche en bas » diagnostiqué.
const vpDebug = `
<script>
(function () {
  if (!window.matchMedia || !matchMedia('(display-mode: standalone)').matches) return;
  var probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);';
  document.documentElement.appendChild(probe);
  var box = document.createElement('pre');
  box.style.cssText = 'position:fixed;top:80px;left:8px;right:8px;z-index:99999;background:rgba(0,0,0,0.85);color:#0f0;font:11px/1.5 monospace;padding:10px;border-radius:8px;pointer-events:none;white-space:pre-wrap;';
  function fmt() {
    var cs = getComputedStyle(probe);
    var vv = window.visualViewport;
    var de = document.documentElement.getBoundingClientRect();
    var bd = document.body.getBoundingClientRect();
    return [
      'screen: ' + screen.width + 'x' + screen.height + ' dpr:' + devicePixelRatio,
      'innerH: ' + innerHeight + '  outerH: ' + outerHeight,
      'visualVp: h=' + (vv ? Math.round(vv.height) : '?') + ' offTop=' + (vv ? vv.offsetTop : '?') + ' scale=' + (vv ? vv.scale : '?'),
      'safe-area top: ' + cs.paddingTop + '  bottom: ' + cs.paddingBottom,
      'html rect: y=' + Math.round(de.y) + ' h=' + Math.round(de.height),
      'body rect: y=' + Math.round(bd.y) + ' h=' + Math.round(bd.height),
      'scrollY: ' + Math.round(scrollY),
      'ua: ' + navigator.userAgent.slice(0, 80),
    ].join('\\n');
  }
  function tick() { box.textContent = fmt(); }
  document.addEventListener('DOMContentLoaded', function () {
    document.body.appendChild(box);
    tick();
    setInterval(tick, 1000);
  });
})();
</script>
`;
html = html.replace('</body>', `${vpDebug}</body>`);

fs.writeFileSync(indexPath, html);
console.log('[inject-meta] meta tags injectés (+ overlay debug viewport)');
