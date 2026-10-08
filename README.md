# Conexión Política

Web publicada: https://conexion-politica.onrender.com/

Sitio estático de afinidad política para España, con cuestionarios de 12 y 36 preguntas. Los perfiles son editoriales e ilustrativos; los valores y la fórmula se publican en la metodología.

## Generar las páginas

```
SITE_URL=http://localhost:4173 node scripts/build-seo.cjs
python -m http.server 4173 --directory dist
```

No necesita instalación de dependencias. Node genera las páginas informativas, el mapa del sitio y los metadatos desde los mismos datos del test. El diseño y la aplicación están en `dist/styles.css` y `dist/app.js`; la portada fuente está en `content/home.html`.

## Render

- Servicio: Static Site.
- Rama: conexion-politica.
- Build Command: `node scripts/build-seo.cjs`.
- Publish Directory: `dist`.
- Render proporciona `RENDER_EXTERNAL_URL` automáticamente; el generador la usa para canonical, sitemap y datos estructurados. Para un dominio propio, configurar `SITE_URL` con su dirección HTTPS exacta.

Después de cambiar de dominio, regenerar y desplegar con el nuevo `SITE_URL` para actualizar conjuntamente canonical, sitemap y datos estructurados. Las respuestas se calculan en el navegador y no se guardan.

La tipografía DM Sans se aloja localmente bajo licencia OFL (`dist/fonts/OFL.txt`).
