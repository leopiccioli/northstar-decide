import { SEO } from '@/components/SEO';
import { SITE_CONFIG } from '@/config/urls';

const SNIPPET = `<div id="tres-d-embed"></div>
<script async src="${SITE_CONFIG.baseUrl}/embed.js"
        data-target="tres-d-embed"
        data-context="burnout"
        data-source="ceoencamiseta"></script>`;

export default function EmbedDocsPage() {
  return (
    <>
      <SEO
        title="Embeber el 3D en tu sitio"
        description="Pegá este snippet en cualquier página para que tus lectores hagan las 3D sin salir de tu sitio."
        path="/embed-docs"
        noIndex
      />
      <main className="min-h-screen bg-background px-6 py-12 max-w-2xl mx-auto space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold">Embeber el 3D</h1>
          <p className="text-foreground/70">
            Pegá este código en cualquier página HTML (tu sitio, blog, Notion, Substack, WordPress…)
            y tus lectores podrán hacer las 3D sin abandonar la página.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Snippet</h2>
          <pre className="bg-secondary p-4 rounded-sm text-xs overflow-x-auto">
            <code>{SNIPPET}</code>
          </pre>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Opciones</h2>
          <ul className="text-sm space-y-2 text-foreground/80">
            <li><code>data-target</code> — id del <code>&lt;div&gt;</code> contenedor. Si falta, el widget se inserta al lado del script.</li>
            <li><code>data-context</code> — pantalla inicial: <code>burnout</code>, <code>change</code>, <code>improve</code>, <code>compare</code>, <code>check</code>. Si falta, muestra la pantalla de contexto.</li>
            <li><code>data-source</code> — se mapea a <code>utm_source</code> para atribución. Default <code>embed</code>.</li>
            <li><code>data-height</code> — alto fijo en px. Si falta, el iframe se ajusta solo al contenido.</li>
            <li><code>data-email</code> — opcional. Email del usuario logueado en tu sitio. Llega pre-cargado al guardar el resultado (el usuario lo puede editar).</li>
            <li><code>data-theme</code> — opcional. <code>"auto"</code> hereda colores y fuente del sitio host. Si se omite, se usa la identidad visual del 3D (recomendado).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Heredar el look del sitio (opcional)</h2>
          <p className="text-sm text-foreground/70">
            Agregá <code>data-theme="auto"</code> y el widget detecta el color de fondo, color de texto, color de link (accent) y la fuente del sitio host. Los colores de las 3D (Dinero, Desarrollo, Diversión) se mantienen siempre — son identidad del producto.
          </p>
          <pre className="bg-secondary p-4 rounded-sm text-xs overflow-x-auto">
            <code>{`<div id="tres-d-embed"></div>
<script async src="${SITE_CONFIG.baseUrl}/embed.js"
        data-target="tres-d-embed"
        data-context="burnout"
        data-theme="auto"></script>`}</code>
          </pre>
          <ul className="text-xs space-y-1 text-foreground/60 list-disc pl-5">
            <li>Best-effort: si tu sitio usa fondos con imagen/gradiente o transparencia total, conviene no usar <code>auto</code>.</li>
            <li>No cargamos fuentes externas — si la familia no está disponible globalmente, el navegador hace fallback.</li>
            <li>Si el contraste detectado es bajo, forzamos texto negro o blanco para garantizar legibilidad.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Pre-cargar el email (opcional)</h2>
          <p className="text-sm text-foreground/70">
            Si en tu sitio el usuario está logueado, podés pasar su email para que llegue pre-cargado al formulario de guardado. El usuario lo puede editar antes de confirmar.
          </p>
          <pre className="bg-secondary p-4 rounded-sm text-xs overflow-x-auto">
            <code>{`<div id="tres-d-embed"></div>
<script async src="${SITE_CONFIG.baseUrl}/embed.js"
        data-target="tres-d-embed"
        data-context="burnout"
        data-email="usuario@ejemplo.com"></script>`}</code>
          </pre>
          <ul className="text-xs space-y-1 text-foreground/60 list-disc pl-5">
            <li>Renderizá el atributo server-side con el email del usuario logueado. Si no hay usuario, omití el atributo.</li>
            <li>Validamos formato básico en el cliente; valores inválidos se ignoran.</li>
            <li>El email se usa solo para guardar el resultado y enviar la medición por mail.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Preview</h2>
          <div className="border border-border rounded-sm overflow-hidden">
            <iframe
              src={`${SITE_CONFIG.baseUrl}/embed?ctx=burnout&utm_source=docs&utm_medium=embed`}
              title="Preview del widget 3D"
              loading="lazy"
              className="w-full block"
              style={{ height: 720, border: 0 }}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Notas</h2>
          <ul className="text-sm space-y-2 text-foreground/70 list-disc pl-5">
            <li>Los datos se guardan en Las 3D del Trabajo (no en tu sitio); cuentan para las stats globales.</li>
            <li>El widget no setea cookies de terceros más allá de las del propio 3D.</li>
            <li>Si tu CMS sanitiza <code>&lt;script&gt;</code>, usá un iframe directo: <code>&lt;iframe src="{SITE_CONFIG.baseUrl}/embed?ctx=burnout"&gt;&lt;/iframe&gt;</code>.</li>
          </ul>
        </section>
      </main>
    </>
  );
}
