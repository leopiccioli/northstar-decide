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
            <li>Los datos se guardan en 3D para Decidir (no en tu sitio); cuentan para las stats globales.</li>
            <li>El widget no setea cookies de terceros más allá de las del propio 3D.</li>
            <li>Si tu CMS sanitiza <code>&lt;script&gt;</code>, usá un iframe directo: <code>&lt;iframe src="{SITE_CONFIG.baseUrl}/embed?ctx=burnout"&gt;&lt;/iframe&gt;</code>.</li>
          </ul>
        </section>
      </main>
    </>
  );
}
