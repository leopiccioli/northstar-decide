# Plan: agregar los 3 archivos `/llm/*.md` al sitemap

## Cambio

Agregar 3 entradas a `public/sitemap.xml`:

```xml
<url>
  <loc>https://3d.ceoencamiseta.com/llm/index.md</loc>
  <changefreq>weekly</changefreq>
  <priority>0.4</priority>
</url>
<url>
  <loc>https://3d.ceoencamiseta.com/llm/stats.md</loc>
  <changefreq>weekly</changefreq>
  <priority>0.4</priority>
</url>
<url>
  <loc>https://3d.ceoencamiseta.com/llm/comentarios.md</loc>
  <changefreq>daily</changefreq>
  <priority>0.4</priority>
</url>
```

Eso completa los 6 checks. No se toca nada más.
