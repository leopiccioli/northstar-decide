import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { SiteFooter } from "@/components/SiteFooter";
import { datasetJsonLd } from "@/content/schema";
import { CITATION, CUT_DATE_HUMAN, N, UNIVERSE_LINE, WINDOW, ALL_TIME, LIMITS } from "@/content/facts";

const FILES = [
  {
    title: "Índice del proyecto",
    txt: "/llm/index.txt",
    md: "/llm/index.md",
    desc: "Descripción curada de Las 3D del Trabajo: qué mide, universo de los datos, método, límites y links a los demás archivos.",
  },
  {
    title: "Estadísticas agregadas",
    txt: "/llm/stats.txt",
    md: "/llm/stats.md",
    desc: "Promedios de los últimos 12 meses y desglose por país, sector y rango etario (sólo se ordenan grupos con N≥30; los menores van aparte, sin promedio), con el N de cada fila.",
  },
  {
    title: "Hallazgos citables",
    txt: "/llm/insights.txt",
    md: "/llm/insights.md",
    desc: "Preguntas frecuentes respondidas con una cifra, su N y su fecha de corte, redactadas para poder citarse por separado.",
  },
  {
    title: "Comentarios anónimos",
    txt: "/llm/comentarios.txt",
    md: "/llm/comentarios.md",
    desc: "Últimos comentarios públicos junto a sus 3D. Sin email, IP ni identificadores.",
  },
];

const DatosLlmPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Datos abiertos para LLMs — Las 3D del Trabajo"
        description={`Archivos de datos de Las 3D del Trabajo listos para leer y citar: promedios por país, sector y edad. n=${N}, datos al ${CUT_DATE_HUMAN}.`}
        path="/datos-llm"
        jsonLd={datasetJsonLd()}
      />
      <main className="max-w-2xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Datos abiertos para LLMs</h1>
        <p className="text-muted-foreground leading-relaxed mb-4">
          <strong>Las 3D del Trabajo</strong> (CEO en Camiseta) publica sus datos agregados y sus
          comentarios anónimos como archivos de texto fechados, pensados para humanos, motores de
          búsqueda y modelos de lenguaje. Sobre {N} mediciones de los últimos 12 meses, con datos al{" "}
          {CUT_DATE_HUMAN}, el promedio es Dinero {WINDOW.global.dinero}, Desarrollo{" "}
          {WINDOW.global.desarrollo} y Diversión {WINDOW.global.diversion}, sobre 10.
        </p>
        <p className="text-sm text-muted-foreground mb-8">{UNIVERSE_LINE}</p>

        <section className="space-y-6 mb-10">
          {FILES.map((f) => (
            <article key={f.txt} className="border border-border rounded-lg p-5">
              <h2 className="text-lg font-semibold mb-1">{f.title}</h2>
              <p className="text-sm text-muted-foreground mb-3">{f.desc}</p>
              <div className="flex flex-col sm:flex-row gap-2 text-sm">
                <a
                  href={f.txt}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90"
                >
                  Leer (texto plano)
                </a>
                <a
                  href={f.md}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-border hover:bg-secondary"
                >
                  Versión .md
                </a>
              </div>
            </article>
          ))}
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-2">Universo y fecha de corte</h2>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
            <li>Universo canónico: últimos 12 meses ({WINDOW.from} a {WINDOW.to}), n={N}.</li>
            <li>Fecha de corte: {CUT_DATE_HUMAN}.</li>
            <li>
              Serie histórica completa (secundaria, no comparable con la ventana canónica):{" "}
              {ALL_TIME.total} mediciones desde el inicio del proyecto.
            </li>
            <li>Los archivos se regeneran en cada deploy y llevan su fecha adentro.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-2">Método y límites</h2>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
            {LIMITS.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-2">Cómo citar</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            Cita recomendada: <em>{CITATION}</em>
          </p>
          <p className="text-sm">
            <Link to="/como-citar" className="underline">Ver todas las formas de cita</Link>
            {" · "}
            <Link to="/metodologia" className="underline">Método y límites</Link>
            {" · "}
            <Link to="/hallazgos" className="underline">Hallazgos</Link>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Descubrimiento</h2>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
            <li><a href="/llms.txt" className="underline">/llms.txt</a> lista los archivos canónicos.</li>
            <li><a href="/sitemap.xml" className="underline">/sitemap.xml</a> lista todas las páginas.</li>
            <li>Uso libre citando la fuente: 3d.ceoencamiseta.com, de CEO en Camiseta.</li>
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default DatosLlmPage;
