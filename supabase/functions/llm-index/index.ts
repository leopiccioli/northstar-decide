import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const textHeaders = {
  ...corsHeaders,
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=7200",
};

const BODY = `# Las 3D del Trabajo

> Herramienta gratuita y anónima para medir tu trabajo en 3 dimensiones — Dinero, Desarrollo y Diversión — en 20 segundos, y tomar mejores decisiones laborales con datos. Creada por CEO en Camiseta.

## Qué es

Las 3D del Trabajo es una mini-app web donde una persona puntúa su trabajo actual (o un trabajo potencial) en tres dimensiones, cada una de 1 a 10:

- **Dinero**: cuánto te paga (sueldo, beneficios, estabilidad económica).
- **Desarrollo**: cuánto aprendés y crecés profesionalmente.
- **Diversión**: cuánto disfrutás del día a día, el equipo y la cultura.

El resultado se compara contra el promedio global de la comunidad (miles de respuestas) y, opcionalmente, contra el promedio de tu país, sector o rango etario. No hay consejos ni interpretaciones automáticas: la herramienta muestra los datos exactos para que la persona decida.

## Para qué sirve

- Decidir si quedarse o cambiar de trabajo.
- Comparar dos ofertas laborales con un marco común.
- Detectar burnout o áreas débiles del trabajo actual.
- Hacer un check-up rápido cada cierto tiempo.

## Páginas públicas

- [Inicio](https://3d.ceoencamiseta.com/): Medí tu trabajo en 3D.
- [Test de burnout](https://3d.ceoencamiseta.com/test-burnout): Versión anónima orientada a detectar burnout.
- [Cambiar de trabajo](https://3d.ceoencamiseta.com/cambiar-de-trabajo): Versión enfocada en la decisión de cambio laboral.
- [Cambiar de trabajo a los 40](https://3d.ceoencamiseta.com/cambiar-de-trabajo-a-los-40)
- [Cambiar de trabajo a los 50](https://3d.ceoencamiseta.com/cambiar-de-trabajo-a-los-50)
- [Muro de los lamentos](https://3d.ceoencamiseta.com/comentarios): Comentarios anónimos sobre el trabajo junto a sus 3D.
- [Estadísticas por país](https://3d.ceoencamiseta.com/por-pais)
- [Estadísticas por sector](https://3d.ceoencamiseta.com/por-sector)
- [Estadísticas por edad](https://3d.ceoencamiseta.com/por-edad)
- [Embeber 3D en tu sitio](https://3d.ceoencamiseta.com/embed-docs)

## Datos en texto plano (actualizados en vivo)

- [Todos los comentarios anónimos](https://bcokciysbyuaeodnsxas.supabase.co/functions/v1/llm-comments)
- [Estadísticas globales y por país/sector/edad](https://bcokciysbyuaeodnsxas.supabase.co/functions/v1/llm-stats)

## Quién la creó

CEO en Camiseta — comunidad y newsletter sobre liderazgo y trabajo, en https://ceoencamiseta.com

## Privacidad

Las respuestas son anónimas. El email se pide opcionalmente sólo para guardar el resultado o recibir recordatorios. Los comentarios públicos en el "Muro de los lamentos" se muestran sin email ni datos personales identificables.
`;

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  return new Response(BODY, { headers: textHeaders });
});
