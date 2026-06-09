/**
 * 3D para Decidir — widget embebible
 *
 * Uso:
 *   <div id="tres-d-embed"></div>
 *   <script async src="https://3d.ceoencamiseta.com/embed.js"
 *           data-target="tres-d-embed"
 *           data-context="burnout"
 *           data-source="ceoencamiseta"></script>
 *
 * data-target  (opcional)  id del contenedor; si falta, se inserta al lado del <script>
 * data-context (opcional)  burnout | change | improve | compare | check
 * data-source  (opcional)  utm_source (default "embed")
 * data-height  (opcional)  alto fijo en px; si falta, autoresize
 */
(function () {
  var ORIGIN = 'https://3d.ceoencamiseta.com';
  var script = document.currentScript;
  if (!script) return;

  var targetId = script.getAttribute('data-target');
  var ctx = script.getAttribute('data-context');
  var source = script.getAttribute('data-source') || 'embed';
  var fixedHeight = parseInt(script.getAttribute('data-height') || '', 10);

  var container = targetId ? document.getElementById(targetId) : null;
  if (!container) {
    container = document.createElement('div');
    container.style.maxWidth = '560px';
    container.style.margin = '0 auto';
    script.parentNode.insertBefore(container, script);
  }

  var url = ORIGIN + '/embed?utm_source=' + encodeURIComponent(source) +
            '&utm_medium=embed&utm_campaign=widget';
  if (ctx) url += '&ctx=' + encodeURIComponent(ctx);

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

  if (fixedHeight > 0) return; // no autoresize

  window.addEventListener('message', function (e) {
    if (e.origin !== ORIGIN) return;
    if (e.source !== iframe.contentWindow) return;
    var data = e.data;
    if (!data || data.type !== '3d:resize') return;
    var h = parseInt(data.height, 10);
    if (h > 0) iframe.style.height = h + 'px';
  });
})();
