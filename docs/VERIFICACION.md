# Verificación de FAIRWAY CLUB

Fecha: 11 de octubre de 2026.

## Código y servidor

`npm run build`: correcto. Three.js y Rapier se empaquetan en módulos separados; assets comprimidos por gzip desde el servidor. Fuentes incluidas localmente con sus licencias.

`npm test`: 16 pruebas correctas, cero fallos. Comprobaciones de 72 rutas únicas, conectadas y sin tiles repetidos; física real de movimiento, reflexión y parada; captura de bola, caída y penalización; bloqueo de golpes inválidos o mientras la bola se mueve; avance de nueve hoyos, puntuación y resultados; penalización de 16 para timeout. Un tiro físico completo desde el tee hasta el primer hoyo finaliza en un golpe sin mover artificialmente la bola.

Pruebas de servidor con sockets reales: dos participantes, validación de anfitrión, sincronización de golpes y posiciones, rechazo de sala inexistente o partida comenzada, entrada de ocho jugadores y rechazo del noveno, transferencia de anfitrión y recuperación con token privado. El ID público de un jugador no permite recuperar su sesión.

## Navegador local

Chrome real, resoluciones 1440×900, 1024×768 y 390×844. Dos contextos aislados crean y comparten una sala. Se comprueban golpes de los dos jugadores y cambios de posición/puntuación recibidos por el otro navegador.

Menú, partida individual, pausa, salida, lobby, inicio online, tarjeta completa, selección de ocho mundos y gameplay en hielo en móvil. Botón, barra de potencia y arrastre sobre el canvas ejercitados. Entrada al primer hoyo con un golpe real y botón Siguiente hoyo con comprobación del número y nombre visible. Sin errores de JavaScript.

Capturas y resultados de las ejecuciones están en `output/playwright` y `output/browser-results.json` en la carpeta de trabajo. Estos archivos de QA no se incluyen en el servidor de producción.

## Alcance de la evidencia

La geometría de los 72 recorridos se comprueba automáticamente. No se han completado manualmente los 72 hoyos ni se ha medido una carga de ocho navegadores simultáneos. Las pruebas de ocho jugadores verifican sockets y reglas de sala. La ronda completa de nueve hoyos tiene pruebas de física/reglas con posiciones de captura preparadas; el recorrido completo del primer hoyo también se valida por tiro desde el tee.

La calidad visual es 3D estilizada con sombras, texturas generadas, agua animada, partículas, elementos móviles y ambientaciones distintas. La simulación de rodadura y captura está ajustada para minigolf, y no pretende equivalencia física exacta con Golf It.

## Producción

La publicación requiere que el despliegue de Render esté en estado live y que respondan el frontend, `/health` y la sala por WebSocket seguro. Los resultados de esa comprobación se añaden tras publicar.
