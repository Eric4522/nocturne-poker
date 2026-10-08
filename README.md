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

Los logos de los 12 partidos se sirven localmente desde `dist/party-logos/`. Las fuentes, autores y licencias de los archivos originales están en `content/party-logo-sources.json`. Se conservan los colores y las proporciones originales.

La portada presenta los vídeos originales a 60 fps como una animación decorativa sin controles ni interacción: versión vertical hasta 767 px y horizontal desde 768 px. Los MP4 se alojan en `dist/videos/` y se reproducen en bucle, siempre silenciados, al entrar en pantalla. Al salir de pantalla o empezar un test se pausan; al volver se reanudan. Con movimiento reducido se muestra únicamente la imagen de presentación.

## Indexación en Google

La web publica contenido estático sin JavaScript, títulos y descripciones propios, canonical HTTPS, datos `WebSite` con el nombre Conexión Política y el sitemap accesible en `/sitemap.xml`. La portada da prioridad al nombre de la marca en su título y presenta el test político de España en el contenido visible. Esto facilita el rastreo y la identificación del sitio; no garantiza una posición en Google.

Para solicitar la indexación desde la cuenta del propietario:

1. Abrir https://search.google.com/search-console/welcome y añadir una propiedad de **prefijo de URL**: `https://conexion-politica.onrender.com/`. No usar la opción de dominio para `onrender.com`, cuyo DNS administra Render.
2. Elegir **Etiqueta HTML** entre los métodos de verificación y proporcionar la etiqueta exacta para incorporarla al `<head>` de `content/home.html`. Regenerar y publicar antes de pulsar **Verificar**. Mantener la etiqueta en futuros despliegues.
3. En **Sitemaps**, enviar `sitemap.xml`.
4. En **Inspección de URLs**, inspeccionar `https://conexion-politica.onrender.com/` y solicitar su indexación. Revisar después el estado real de indexación y las consultas de búsqueda en Search Console.

La etiqueta de verificación proporcionada por el propietario está incorporada a `content/home.html` y se conserva al regenerar el sitio. El propietario debe pulsar **Verificar** en Search Console y enviar después el sitemap; estas acciones necesitan su sesión de Google. La disponibilidad pública y una consulta `site:` no acreditan por sí solas el estado de indexación de Google.
