# Conexión Política

Web publicada: https://conexion-politica.onrender.com/

Sitio estático de afinidad política para España, con cuestionarios de 52 y 62 preguntas. Los perfiles son editoriales e ilustrativos; los valores y la fórmula se publican en la metodología.

## Generar las páginas

```
SITE_URL=http://localhost:4173 node scripts/build-seo.cjs
python -m http.server 4173 --directory dist
```

No necesita instalación de dependencias. Node genera las páginas informativas, el mapa del sitio y los metadatos desde los mismos datos del test. El modelo fuente está en `content/model.json`, los textos de las páginas en `content/site-pages.cjs` y los canales públicos en `content/site-config.json`. Las variables `CONTACT_EMAIL`, `SUPPORT_URL` y `NEWSLETTER_URL` permiten sustituir estos últimos desde Render. El diseño y la aplicación están en `dist/styles.css` y `dist/app.js`; la portada fuente está en `content/home.html`.

## Render

- Servicio: Static Site.
- Rama: conexion-politica.
- Build Command: `node scripts/build-seo.cjs`.
- Publish Directory: `dist`.
- Render proporciona `RENDER_EXTERNAL_URL` automáticamente; el generador la usa para canonical, sitemap y datos estructurados. Para un dominio propio, configurar `SITE_URL` con su dirección HTTPS exacta.

Después de cambiar de dominio, regenerar y desplegar con el nuevo `SITE_URL` para actualizar conjuntamente canonical, sitemap y datos estructurados. Las respuestas se calculan en el navegador y no se guardan.

La tipografía DM Sans se aloja localmente bajo licencia OFL (`dist/fonts/OFL.txt`).

Los logos de los 15 partidos se sirven localmente desde `dist/party-logos/`. Las fuentes, autores y licencias de los archivos originales están en `content/party-logo-sources.json`. Se conservan los colores y las proporciones originales.

La portada presenta los vídeos originales a 60 fps como una animación decorativa sin controles ni interacción: versión vertical hasta 767 px y horizontal desde 768 px. Los MP4 se alojan en `dist/videos/` y se reproducen en bucle, siempre silenciados, al entrar en pantalla. Al salir de pantalla o empezar un test se pausan; al volver se reanudan. Con movimiento reducido se muestra únicamente la imagen de presentación.

## Indexación en Google

La web publica contenido estático sin JavaScript, títulos y descripciones propios, canonical HTTPS, datos `WebSite` con el nombre Conexión Política y el sitemap accesible en `/sitemap.xml`. La portada da prioridad al nombre de la marca en su título y presenta el test político de España en el contenido visible. Esto facilita el rastreo y la identificación del sitio; no garantiza una posición en Google.

Para solicitar la indexación desde la cuenta del propietario:

1. Abrir https://search.google.com/search-console/welcome y añadir una propiedad de **prefijo de URL**: `https://conexion-politica.onrender.com/`. No usar la opción de dominio para `onrender.com`, cuyo DNS administra Render.
2. Elegir **Etiqueta HTML** entre los métodos de verificación y proporcionar la etiqueta exacta para incorporarla al `<head>` de `content/home.html`. Regenerar y publicar antes de pulsar **Verificar**. Mantener la etiqueta en futuros despliegues.
3. En **Sitemaps**, enviar `sitemap.xml`.
4. En **Inspección de URLs**, inspeccionar `https://conexion-politica.onrender.com/` y solicitar su indexación. Revisar después el estado real de indexación y las consultas de búsqueda en Search Console.

La etiqueta de verificación proporcionada por el propietario está incorporada a `content/home.html` y se conserva al regenerar el sitio. El propietario ya confirmó la verificación. Tras esta ampliación, puede enviar `sitemap.xml` actualizado y revisar la indexación desde su sesión de Google. La disponibilidad pública y una consulta `site:` no acreditan por sí solas el estado de indexación de Google.

## Ampliación de octubre de 2026

59 páginas estáticas: fichas de 15 partidos, 14 temas, 7 análisis, guías electorales, metodología, FAQ, proyecto, transparencia y páginas legales. Test rápido de 52 preguntas y completo de 62 con prioridad 1–5, omisión explícita, cobertura, comparación por temas, brújula y exportación local. Democracia21 solo puntúa en 9 afirmaciones con propuestas identificadas en su web; el resto queda sin datos. Los demás perfiles siguen siendo estimaciones editoriales pendientes de validación por afirmación. Ocho objetivos generales nuevos quedan sin datos para esas formaciones, en lugar de derivar su postura de la orientación ideológica.

El barómetro describe valores del modelo y no inventa datos de usuarios. Informes gratuitos CSV/JSON e informe personal CSV/impresión PDF. La calculadora D’Hondt aplica el umbral del 3 % y señala empates sujetos a sorteo. Novedades por RSS (`/feed.xml`); contacto prepara un correo en el dispositivo y no envía por backend. No hay recogida de respuestas, newsletter por email, estadísticas poblacionales ni pagos. Los datos legales completos del titular deben incorporarse cuando sean facilitados.

## Tarjetas y guías de octubre de 2026

64 páginas estáticas. La sección `/guias/` reúne cuatro guías originales con fuentes, índice, ejemplos y metadatos Article. El sitemap incluye sus fechas y el RSS también enlaza a las guías. El ejemplo interactivo de afinidad utiliza tres afirmaciones ficticias y funciona sin recopilar respuestas.

`dist/share.js` genera tarjetas PNG localmente: Stories 1080 × 1920 y cuadrado 1080 × 1080. Incluyen hasta tres perfiles, cobertura y el aviso editorial. La opción de privacidad oculta partidos y porcentajes en la imagen y en el resumen de WhatsApp. El enlace compartido lleva al test y no codifica resultados. Se utiliza Web Share con archivos cuando el navegador lo admite; en los demás, se descarga el PNG. Los informes CSV siguen incluyendo respuestas. No se guarda el test ni la tarjeta en un backend.

Los resultados explican coincidencias y diferencias concretas del perfil elegido. La nueva portada y las guías mantienen tipografía y recursos locales; las animaciones respetan movimiento reducido. Atajos del cuestionario: 1–5 para responder y Enter desde el enunciado para continuar.

## Contexto adicional de Democracia21

La ficha de D21 incorpora la referencia de Política Electoral aportada por el propietario y un resumen original de economía, educación, vivienda, inmigración y justicia. Se identifica como fuente secundaria, con fecha de consulta y un apartado por tema que explica su correspondencia con el test. Su anuncio territorial se atribuye a la fuente y no se presenta como proclamación de candidaturas.

Se mantienen las 9 posiciones de D21 (5 en el rápido). La simplificación de trámites y los órganos especializados contra la corrupción quedan corroborados por esta segunda referencia. Objetivos de alquiler, financiación de vivienda protegida o grados flexibles no se extrapolan a control legal de precios, titularidad pública o becas. Los demás partidos y la fórmula no cambian.
