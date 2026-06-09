/**
 * 3D para Decidir — widget embebible
 *
 * Uso básico:
 *   <div id="tres-d-embed"></div>
 *   <script async src="https://3d.ceoencamiseta.com/embed.js"
 *           data-target="tres-d-embed"
 *           data-context="burnout"
 *           data-source="ceoencamiseta"></script>
 *
 * data-target  (opcional)  id del contenedor
 * data-context (opcional)  burnout | change | improve | compare | check
 * data-source  (opcional)  utm_source (default "embed")
 * data-height  (opcional)  alto fijo en px; si falta, autoresize
 * data-theme   (opcional)  "auto" para heredar colores/fuente del sitio host
 */
(function () {
  var ORIGIN = 'https://3d.ceoencamiseta.com';
  var script = document.currentScript;
  if (!script) return;

  var targetId = script.getAttribute('data-target');
  var ctx = script.getAttribute('data-context');
  var source = script.getAttribute('data-source') || 'embed';
  var fixedHeight = parseInt(script.getAttribute('data-height') || '', 10);
  var theme = script.getAttribute('data-theme');
  var email = script.getAttribute('data-email');

  var container = targetId ? document.getElementById(targetId) : null;
  if (!container) {
    container = document.createElement('div');
    container.style.maxWidth = '560px';
    container.style.margin = '0 auto';
    script.parentNode.insertBefore(container, script);
  }

  var params = [
    'utm_source=' + encodeURIComponent(source),
    'utm_medium=embed',
    'utm_campaign=widget',
  ];
  if (ctx) params.push('ctx=' + encodeURIComponent(ctx));

  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    params.push('email=' + encodeURIComponent(email));
  }

  if (theme === 'auto') {
    try {
      var detected = detectHostTheme();
      params.push('theme=auto');
      if (detected.bg) params.push('bg=' + encodeURIComponent(detected.bg));
      if (detected.fg) params.push('fg=' + encodeURIComponent(detected.fg));
      if (detected.accent) params.push('accent=' + encodeURIComponent(detected.accent));
      if (detected.font) params.push('font=' + encodeURIComponent(detected.font));
    } catch (e) {
      // ignore detection errors, fall back to default theme
    }
  }

  var url = ORIGIN + '/embed?' + params.join('&');

  var iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.title = '3D para Decidir';
  iframe.loading = 'lazy';
  iframe.setAttribute('allow', 'clipboard-write');
  iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  iframe.style.width = '100%';
  iframe.style.border = '0';
  iframe.style.display = 'block';
  iframe.style.height = (fixedHeight > 0 ? fixedHeight : 720) + 'px';
  container.appendChild(iframe);

  if (fixedHeight > 0) return;

  window.addEventListener('message', function (e) {
    if (e.origin !== ORIGIN) return;
    if (e.source !== iframe.contentWindow) return;
    var data = e.data;
    if (!data || data.type !== '3d:resize') return;
    var h = parseInt(data.height, 10);
    if (h > 0) iframe.style.height = h + 'px';
  });

  function isTransparent(c) {
    if (!c) return true;
    c = c.replace(/\s+/g, '');
    if (c === 'transparent') return true;
    var m = c.match(/rgba?\((\d+),(\d+),(\d+)(?:,([\d.]+))?\)/);
    if (m && m[4] !== undefined && parseFloat(m[4]) === 0) return true;
    return false;
  }

  function firstOpaqueBg(el) {
    var node = el;
    while (node && node !== document.documentElement) {
      var bg = getComputedStyle(node).backgroundColor;
      if (!isTransparent(bg)) return bg;
      node = node.parentElement;
    }
    var docBg = getComputedStyle(document.documentElement).backgroundColor;
    if (!isTransparent(docBg)) return docBg;
    return '#ffffff';
  }

  function detectHostTheme() {
    var body = document.body || document.documentElement;
    var cs = getComputedStyle(body);
    var bg = firstOpaqueBg(body);
    var fg = cs.color;
    var font = cs.fontFamily;
    var accent = null;
    var link = document.querySelector('a[href]');
    if (link) {
      var lc = getComputedStyle(link).color;
      if (!isTransparent(lc) && lc !== fg) accent = lc;
    }
    return { bg: bg, fg: fg, accent: accent, font: font };
  }
})();
