# Nocturne Poker

Texas Hold’em con fichas virtuales, salas privadas para 2-6 amigos y modo individual contra cinco bots. Diseño claro inspirado en Apple.

## Jugar con amigos

Todos abren la misma dirección del servicio. Una persona crea la sala y comparte el código; los demás eligen Unirse con código. El organizador empieza y avanza a la siguiente mano. 1.000 fichas iniciales, ciegas 10/20 y 30 segundos por turno.

El servidor valida cada acción, reparte y decide los botes. Cada cliente recibe únicamente sus cartas hasta el showdown. Recargar la misma pestaña recupera el asiento. La sala sigue activa al cambiar de pestaña. Salas en memoria: reiniciar el servicio elimina las partidas.

## Ejecutar

Node.js 22 o superior. Sin dependencias de ejecución. `npm start`, puerto PORT o 4173. `render.yaml` prepara una instancia gratuita en Frankfurt con healthcheck `/health`.

## Estructura

Estos archivos constituyen la edición de despliegue del proyecto. Los módulos públicos y servidor están en la raíz para subirlos juntos desde GitHub; el servidor sirve las rutas `/js/`, `/css/` y `/assets/` usadas por index.html desde esos archivos. `rooms.cjs` contiene las salas y `rooms.js` su cliente. `engine.js`, `cards.js` y `ai.js` conservan el motor, evaluador y bots. `app.js` renderiza la mesa.

El proyecto de desarrollo verificado incluye 48 pruebas de reglas/API/salas y regresiones de respuestas atrasadas, y 103 comprobaciones de navegador (dos contextos de amigos, modo individual, torneo y adaptación 320-1440 px). No hay dinero real, pagos ni retiradas. Las fuentes y sonidos son nativos del navegador; cartas y fichas se dibujan con CSS.
