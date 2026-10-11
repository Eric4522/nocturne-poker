# FAIRWAY CLUB · versión 2

Jugar online: https://fairway-club.onrender.com

Minigolf 3D original para navegador. 16 mapas temáticos, nueve hoyos por mapa y partidas por código de 1 a 8 jugadores. Nombres, recorridos, gráficos e interfaz propios.

## Novedades

- 144 recorridos. Los hoyos largos miden de 96 a 212 metros de ruta principal; el primero de Clover Valley es una introducción de 20 metros.
- Puentes elevados con subidas y bajadas reales, colinas, depresiones, plazas, caminos laterales y obstáculos móviles.
- Copas planas y copas hundidas en cuencos de 65 a 101 cm. Three.js y Rapier comparten la geometría del suelo.
- Colisiones entre bolas, ocho posiciones de salida separadas y bolas terminadas retiradas de la simulación.
- Línea 3D y panel: verde FLOJO, naranja NORMAL y rojo FUERTE. El largo representa potencia, no una predicción exacta de trayectoria.
- Nombre obligatorio de 2 a 20 caracteres y elección de bola. Validación en cliente y servidor.
- Avance estable entre hoyos. Siguiente mapa y Repetir mapa al terminar los nueve, manteniendo sala y jugadores.
- Geometría estática agrupada por materiales, suelo plano y agua simplificados, calidad media inicial en móvil. Ajustes Alta / Media / Ligera.

## Dieciséis escenarios

Clover Valley (bosque), Coral Coast (tropical), Sakura Gardens (japonés), Golden Dunes (desierto), Aurora Peaks (hielo), Sugar Heights (dulces), Moonlight Club (nocturno), Ember Islands (volcán), Lost Temple (ruinas), Neon District (neón), Amber Woods (otoño), Ghost Hollow (encantado), Orbit Station (espacio), Buccaneer Bay (piratas), Mystic Grove (setas) y Clockwork Port (steampunk).

Cada escenario combina recorrido, terreno, obstáculos, paleta, texturas, arquitectura y decoraciones. Nueve familias de rutas se componen con entradas, medidas y distribución propias de cada mapa. Orbit Station mantiene gravedad normal.

## Jugar en Windows

Abre JUGAR.cmd con Node.js instalado y mantén la consola abierta. O ejecuta npm ci, npm run build y npm start desde la carpeta fairway-club. Accede a http://localhost:3017.

En una red local los otros dispositivos deben usar la IP del ordenador servidor y tener permitido el puerto 3017 en el firewall. La versión publicada funciona con HTTPS y WebSocket seguro.

## Controles y reglas

Arrastra hacia atrás sobre el campo y suelta para golpear. También puedes usar barra, flechas y Golpear. A/D o flechas izquierda/derecha apuntan; W/S o flechas arriba/abajo ajustan fuerza. Espacio golpea. Botón derecho o Mayús + arrastrar mueve cámara; rueda hace zoom. V: vista aérea; R: rescatar con +1 golpe; Esc: pausa.

En móvil funcionan barra, botones y arrastre. Nombre, color y récords se conservan localmente.

32 golpes y ocho minutos por hoyo. Agotar tiempo o usar Pasar este hoyo desde pausa anota 32. Caer o rescatar añade un golpe y restaura el último origen de tiro. Un choque no suma golpes a la bola golpeada. El anfitrión avanza cuando todos terminan. El invitado ve cuándo espera a su grupo.

Resultados conserva nueve puntuaciones. Siguiente mapa o Repetir mapa inicia otra ronda sin expulsar al grupo. Pausa individual detiene la física; online el reloj sigue activo.

## Multijugador

Con amigos → escribir nombre → Crear una sala → compartir código. Los demás entran en la misma URL, escriben su nombre y el código antes de comenzar. Física autoritativa a 60 pasos/s y estados a 20 Hz, con interpolación visual.

Desconexión recuperable durante 30 segundos con token privado, y relevo de anfitrión. Salas en memoria: reiniciar el servidor las elimina. Preferencias y récords locales. No hay cuentas, matchmaking global ni editor de mapas.

## Verificación y despliegue

npm test: 29 comprobaciones de física, reglas y servidor. Incluyen geometría y estabilidad de los 144 recorridos, choques reales, bola rodando por gravedad a copa hundida, ronda completa, siguiente mapa conservando grupo y aforo de ocho sockets.

Chrome real en 1440×900, 1024×768 y 390×844: nombre, controles, línea coloreada, 16 escenarios, choque entre navegadores y avance completo. Las rondas completas de navegador usan Pasar hoyo; el primero se completa además con un golpe real desde el tee. No se han jugado manualmente los 144 hoyos ni probado ocho navegadores simultáneos. Más detalles en docs/VERIFICACION.md.

Render: servicio srv-db5rvvlckfvc73b8enp0, plan gratuito, Frankfurt. Rama codex/fairway-club de Eric4522/nocturne-poker. Build: npm ci --include=dev && npm run build. Inicio: npm start. Escucha en 0.0.0.0:$PORT; /health informa versión y mapas. El arranque tras inactividad puede tardar.

Three.js, Rapier, Vite, Node.js y ws. DM Sans y DM Serif Display incluidas con SIL Open Font License. No se utilizan recursos de Golf It.
