# Las 3D del Trabajo

> Medí tu trabajo en 20 segundos. Tres dimensiones, un número, una decisión más clara.
>
> [Embeber en tu sitio](#embeber-en-tu-sitio) · [Ver estadísticas](#estadísticas-y-datos-abiertos) · [Probar ahora](https://3d.ceoencamiseta.com)

**URL en vivo:** [https://3d.ceoencamiseta.com](https://3d.ceoencamiseta.com)

**Las 3D del Trabajo** es una mini-app web gratuita y anónima creada por [CEO en Camiseta](https://ceoencamiseta.com). Te ayuda a puntuar tu trabajo actual (o una opción que estés evaluando) en tres dimensiones, cada una de 1 a 10:

- **Dinero** — cuánto te paga, incluyendo sueldo, beneficios y estabilidad.
- **Desarrollo** — cuánto aprendés y crecés profesionalmente.
- **Diversión** — cuánto disfrutás del día a día, el equipo y la cultura.

El resultado se compara con el promedio global de la comunidad y, opcionalmente, con promedios por país, sector o rango etario. La herramienta no te dice qué hacer: te da los datos para que vos decidas.

---

## ¿Por qué medir las 3D?

La idea de las tres D está planteada en el capítulo 14 de *Sé tu propio CEO*.

El capítulo parte de una tensión clásica: ¿elegir lo que paga bien o lo que nos gusta? La historia del libro sugiere que elegir por encima del dinero lo que realmente nos interesa suele traducirse en más desarrollo y más diversión. Y que invertir solo en una de las tres D —por ejemplo, aceptar un trabajo aburrido por un buen salario— puede terminar en frustración a largo plazo.

Las tres D funcionan como variables que evolucian con el tiempo:

- **Dinero** cubre las necesidades de hoy.
- **Desarrollo** es una inversión en el trabajo que vas a poder hacer mañana.
- **Diversión** reconoce que pasamos más del 57 % de nuestras horas despiertas trabajando; no tiene sentido resignar todo ese tiempo.

Medirlas de forma simple hace visible lo que antes era solo una sensación. Por eso la app no interpreta: muestra tus números junto a los de la comunidad, para que la conversación sea con vos mismo y no con un algoritmo.

---

## Páginas públicas

### Medición y contextos

- **[Inicio](https://3d.ceoencamiseta.com/)** — medí tu trabajo en 3D.
- **[Test de burnout](https://3d.ceoencamiseta.com/test-burnout)** — versión orientada a detectar agotamiento.
- **[Cambiar de trabajo](https://3d.ceoencamiseta.com/cambiar-de-trabajo)** — para quien está evaluando un cambio.
- **[Cambiar de trabajo a los 40](https://3d.ceoencamiseta.com/cambiar-de-trabajo-a-los-40)**
- **[Cambiar de trabajo a los 50](https://3d.ceoencamiseta.com/cambiar-de-trabajo-a-los-50)**

### Estadísticas y datos abiertos

- **[Estadísticas por país](https://3d.ceoencamiseta.com/por-pais)**
- **[Estadísticas por sector](https://3d.ceoencamiseta.com/por-sector)**
- **[Estadísticas por edad](https://3d.ceoencamiseta.com/por-edad)**
- **[Muro de los lamentos](https://3d.ceoencamiseta.com/comentarios)** — comentarios anónimos de la comunidad junto a sus 3D.
- **[Datos abiertos para LLMs](https://3d.ceoencamiseta.com/datos-llm)** — archivos Markdown con estadísticas agregadas y comentarios anónimos.

### Embeber en otro sitio

- **[Documentación del widget](https://3d.ceoencamiseta.com/embed-docs)** — código para incrustar el formulario 3D en tu sitio vía iframe.

---

## Stack y desarrollo local

```text
Frontend: Vite + React + TypeScript + Tailwind CSS + shadcn/ui
Backend:  Supabase Edge Functions (Lovable Cloud)
Datos:    Supabase Postgres + datos abiertos en Markdown
```

### Scripts

```bash
# Instalar dependencias
npm i

# Levantar en desarrollo (genera snapshots LLM y levanta Vite)
npm run dev

# Build de producción
npm run build

# Tests
npm run test
```

---

## Privacidad

Las respuestas son anónimas. El email se pide solo de forma opcional, para guardar el resultado o recibir recordatorios. Los comentarios públicos en el Muro de los lamentos se publican sin email ni identificadores.

---

## Creado por

**CEO en Camiseta** — comunidad y newsletter sobre liderazgo y trabajo.  
[https://ceoencamiseta.com](https://ceoencamiseta.com)
