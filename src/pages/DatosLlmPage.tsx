import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";

const SUPABASE_LIVE = "https://bcokciysbyuaeodnsxas.supabase.co/functions/v1";

const FILES = [
  {
    title: "Índice del proyecto",
    href: "/llm/index.md",
    live: `${SUPABASE_LIVE}/llm-index`,
    desc: "Descripción curada de 3D para Decidir: qué es, para qué sirve, páginas públicas y links a los demás archivos.",
  },
  {
    title: "Estadísticas agregadas",
    href: "/llm/stats.md",
    live: `${SUPABASE_LIVE}/llm-stats`,
    desc: "Promedios globales y desglose por país, sector y rango etario (sólo grupos con N≥5).",
  },
  {
    title: "Comentarios anónimos",
    href: "/llm/comentarios.md",
    live: `${SUPABASE_LIVE}/llm-comments`,
    desc: "Últimos 500 comentarios públicos enviados por personas, junto a sus 3D. Sin email, IP ni identificadores.",
  },
];

const DatosLlmPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Datos abiertos para LLMs — 3D para Decidir"
        description="Archivos en Markdown con estadísticas y comentarios anónimos del proyecto 3D para Decidir, pensados para humanos, Google y LLMs."
        path="/datos-llm"
      />
      <main className="max-w-2xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Datos abiertos para LLMs</h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          <strong>3D para Decidir</strong> publica sus datos agregados y comentarios anónimos como
          archivos Markdown estáticos, fáciles de leer por humanos, motores de búsqueda y modelos
          de lenguaje. Cada archivo incluye fecha de última actualización, fuente, qué contiene y
          limitaciones.
        </p>

        <section className="space-y-6 mb-10">
          {FILES.map((f) => (
            <article key={f.href} className="border border-border rounded-lg p-5">
              <h2 className="text-lg font-semibold mb-1">{f.title}</h2>
              <p className="text-sm text-muted-foreground mb-3">{f.desc}</p>
              <div className="flex flex-col sm:flex-row gap-2 text-sm">
                <a
                  href={f.href}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90"
                >
                  Snapshot canónico
                </a>
                <a
                  href={f.live}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-border hover:bg-secondary"
                  rel="noopener"
                >
                  Versión en vivo
                </a>
              </div>
            </article>
          ))}
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-2">Privacidad</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Los comentarios son anónimos: no se publica email, IP ni ningún identificador. En el
            texto libre se eliminan automáticamente emails, URLs, teléfonos y @handles, pero
            nombres propios u otros datos identificables pueden no detectarse. Para estadísticas
            por país, sector o edad sólo se incluyen grupos con al menos 5 mediciones.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-2">Cómo se actualizan</h2>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
            <li><strong>Snapshot canónico</strong> (<code>/llm/*.md</code>): regenerado en cada deploy.</li>
            <li><strong>Versión en vivo</strong> (Supabase Functions): consultas en tiempo real, cache 5–10 min.</li>
            <li>Discoverable vía <Link to="/llms.txt" className="underline">/llms.txt</Link> y <a href="/sitemap.xml" className="underline">/sitemap.xml</a>.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Uso</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Podés citar, indexar o entrenar modelos con estos archivos, mencionando la fuente
            (<a href="https://3d.ceoencamiseta.com" className="underline">3d.ceoencamiseta.com</a>,
            de CEO en Camiseta).
          </p>
        </section>
      </main>
    </div>
  );
};

export default DatosLlmPage;
