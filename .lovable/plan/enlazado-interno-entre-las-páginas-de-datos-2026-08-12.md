# Enlazado interno entre las páginas de datos

Hoy cada corte de datos vive aislado: `/pais/argentina`, `/sector/tecnologia`, `/edad/35-44` y los hallazgos hablan del mismo dato pero casi no se enlazan entre sí. Las páginas de estadísticas (`/por-pais`, `/por-sector`, `/por-edad`) muestran las tablas pero no llevan a la página de detalle de cada fila.

El objetivo es que cualquier página de datos ofrezca los tres saltos naturales: a sus hermanas del mismo corte, al hub que la contiene, y al hallazgo que la menciona. Sin cambios de diseño: se reutilizan los bloques y estilos que ya existen.

## Qué se agrega

**1. Desde los hubs hacia el detalle.** En `/por-pais`, `/por-sector` y `/por-edad`, cada fila de la tabla de grupos comparables (N≥30) que tenga página propia pasa a ser un link a esa página. Las filas por debajo del umbral quedan como están, sin link.

**2. Entre páginas hermanas.** Cada página de país, sector y edad suma un bloque "links" al final —el mismo componente que ya usan otras páginas— con las demás del mismo corte, mostrando su N. Ejemplo en `/pais/argentina`: "Otros países medidos: México (n=78)".

**3. Del detalle al hub y al hallazgo relacionado.** Cada página de detalle enlaza a su hub (`/por-pais`, etc.) y a los hallazgos que la citan, resueltos automáticamente:

```text
/sector/tecnologia  -> /hallazgos/sector-que-mejor-paga        (si es el sector que mejor paga)
/sector/<x>         -> /hallazgos/sector-con-menos-diversion   (si aplica)
/pais/argentina     -> /hallazgos/como-puntua-argentina        (si existe hallazgo de ese país)
/edad/<x>           -> /hallazgos/el-trabajo-mejora-con-la-edad
```

**4. Del hallazgo al detalle.** Cada hallazgo suma un link a la página del corte que usa como evidencia (el hallazgo del sector que mejor paga enlaza a `/sector/<ese sector>`).

**5. Cruce entre cortes.** Las páginas de país, sector y edad suman un bloque corto que enlaza a los otros dos cortes del mismo dato ("También podés ver el mismo dato por sector / por edad").

## Detalles técnicos

- Todo el enlazado nuevo se genera en `src/content/pages.ts` con los datos ya presentes en `src/content/facts.ts` (`COUNTRY_PAGES`, `SECTOR_PAGES`, `AGE_PAGES` y los helpers `countrySlug` / `sectorSlug` / `ageSlug`), así que no puede quedar desincronizado ni apuntar a una página que no existe: si un grupo baja de N=30 desaparece la página y también su link.
- Los bloques usan el tipo `links` que `ContentPageView` ya renderiza. No se crean componentes ni estilos nuevos.
- La relación hallazgo ↔ corte se deriva de las mismas constantes que hoy calculan el hallazgo (`bestMoneySector`, `worstFunSector`, `mainCountry`), no de una lista escrita a mano.
- Los links de fila en las tablas de estadísticas se agregan en `src/pages/StatsPage.tsx`, `SectorStatsPage.tsx` y `AgeStatsPage.tsx`, usando el estilo de link que ya tiene el sitio.
- El prerender (`scripts/prerender.ts`) toma los bloques tal cual, así que los links nuevos aparecen también en el HTML estático que ven Google y los crawlers de IA, sin tocar el script.
