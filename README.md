# FAIRWAY CLUB

Minigolf 3D original para navegador. Ocho mundos, 72 recorridos y partidas por código con hasta ocho jugadores. Inspirado en los juegos de minigolf con obstáculos; los nombres, campos, gráficos e interfaz son propios.

## Jugar en Windows

Abre `JUGAR.cmd` con Node.js instalado. Instala las dependencias, prepara la versión web si hace falta y abre `http://localhost:3017`. Deja la consola abierta mientras juegas. También puedes ejecutar:

```powershell
cd "C:\Users\ericb\Documents\ChatGPT\Mi canal\fairway-club"
npm install
npm run build
npm start
```

Para jugar con otra persona en la misma red local, ambos dispositivos deben acceder a la IP del ordenador que ejecuta el servidor, por ejemplo `http://192.168.1.20:3017`, y permitir el puerto en el firewall. No uses `localhost` en el segundo dispositivo: apunta al dispositivo desde el que navegas. La versión publicada sirve HTTPS y WebSocket seguro desde Render.

## Controles

- Arrastra sobre el campo y suelta para golpear. Arrastrar hacia atrás prepara el golpe en dirección contraria.
- También puedes ajustar la barra de potencia y pulsar Golpear. Las flechas del panel giran el tiro.
- Botón derecho o Mayús + arrastrar: cámara. Rueda: zoom.
- A/D o flechas izquierda/derecha: dirección. W/S o flechas arriba/abajo: potencia.
- Espacio: golpear. V: vista aérea. R: rescatar con un golpe de penalización. Esc: menú de pausa.
- En móvil, usa el arrastre sobre el campo o la barra, flechas y botón de golpeo. La vista aérea permite ver el recorrido.

## Mundos y juego

Clover Valley, Coral Coast, Sakura Gardens, Golden Dunes, Aurora Peaks, Sugar Heights, Moonlight Club y Ember Islands. Cada mundo tiene nueve rutas distintas generadas con semillas fijas y reproducibles. Hay paredes de rebote, postes, barras giratorias, puertas móviles, rampas, arena y aceleradores. El hielo ofrece menos resistencia al rodar.

Cada ronda tiene nueve hoyos. Límite de 16 golpes y tres minutos por hoyo; agotar el tiempo anota 16 golpes. Caer o rescatar añade un golpe y devuelve la bola al último origen de tiro. Las partidas online son simultáneas y las bolas no colisionan entre sí. El anfitrión avanza cuando todos terminan. La tarjeta guarda los nueve resultados y el navegador conserva el mejor total de cada mundo.

## Multijugador

Con amigos → Crear sala → compartir código. Los demás abren la misma dirección, eligen Con amigos y escriben el código antes de comenzar la ronda. El servidor valida los golpes y simula todas las bolas a 60 pasos por segundo. Envía estados a los clientes a 20 Hz y el navegador interpola los movimientos.

Una desconexión tiene una ventana de recuperación de 30 segundos con token privado. Si sale el anfitrión, otro jugador conectado asume ese papel. Las salas y sesiones residen en memoria: un reinicio del servidor las elimina. Las preferencias y récords son locales al navegador. No hay registro de usuarios, matchmaking global ni editor de niveles.

## Desarrollo y verificación

`npm test` prueba los 72 recorridos, la física real de las bolas, golpes inválidos, rebotes, captura, caídas, pausa lógica de fases, límite temporal, resultado de nueve hoyos, un tiro real hasta el primer hoyo y el protocolo de salas con clientes WebSocket reales. Incluye máximo de ocho jugadores, restricciones del anfitrión y recuperación de sesión sin exponer tokens a otros jugadores.

El informe `docs/VERIFICACION.md` registra las pruebas adicionales realizadas en Chrome en escritorio, tablet y móvil. La comprobación automática de conexión usa dos páginas aisladas; no equivale a una prueba de carga de ocho navegadores ni a jugar manualmente los 72 hoyos.

Tecnología: Three.js, Rapier, Vite, Node.js y ws. Fuentes DM Sans y DM Serif Display bajo SIL Open Font License, incluidas en `public/fonts` con sus licencias. No se han utilizado recursos de Golf It.

## Despliegue

Render, plan gratuito, región Frankfurt, `npm ci --include=dev && npm run build` y `npm start`. El servidor escucha en `0.0.0.0:$PORT` y expone `/health`. La suspensión por inactividad del plan gratuito puede retrasar la primera carga. La disponibilidad y latencia dependen de ese servicio; no se han medido bajo carga de producción.
