# Verificación · FAIRWAY CLUB 2

11 de octubre de 2026.

## Código y servidor

Build correcto y 29 pruebas, cero fallos. Se comprueban 144 composiciones únicas, conectividad de ruta y plazas, tees estables, copas planas/hondas, transferencia de movimiento al chocar bolas, puntuación sin golpes extra, captura y retirada de bola terminada, caídas, rebotes, golpes inválidos y resultados.

Una bola sobre la ladera de un cuenco rueda por gravedad y entra. Un tiro desde el tee del primer hoyo llega a la copa en un golpe. Estabilidad del tee y contactos de relieve en los 144 recorridos. Render y física comparten superficies.

Servidor: nombre antes de crear sala, mapa 16 admitido, aforo ocho y noveno rechazado, acciones reservadas al anfitrión, token privado, relevo, nueve hoyos y siguiente mapa conservando IDs y sala.

## Chrome local

Escritorio 1440×900, tablet 1024×768 y móvil 390×844. Doce comprobaciones de interfaz, cero errores JavaScript. Nombre vacío bloqueado; elegir bola conserva nombre; Enter inicia. Material real de línea y etiquetas coinciden en 20/50/85 %. Carga de 16 escenarios y disparo en mapa 16.

Dos contextos aislados: disparo del anfitrión choca y mueve al invitado, que conserva cero golpes. El invitado vuelve a disparar y sincroniza puntuación. Móvil permite mapa, nombre, slider, botón y arrastre.

Regresión de avance: nueve hoyos individuales y nueve online usando la acción explícita Pasar hoyo. El nodo del botón permanece estable más de 350 ms; clic mantenido 250 ms avanza. Resultados → Siguiente mapa funciona en ambos modos y conserva los dos participantes online.

Rendimiento: escena larga con dos navegadores usa 48 llamadas, 15 lotes estáticos y unas 80 900 caras en calidad alta. La escena inicial anterior rondaba las 400 llamadas. Agrupación de geometría estática y simplificación de suelo/agua reducen trabajo de dibujo. Son mediciones de escenas concretas, no garantía de FPS en cualquier equipo.

Resultados: output/browser-v2-local.json, output/progression-v2-local.json y capturas output/playwright-v2. QA no se sirve al público.

## Producción

https://fairway-club.onrender.com. Preparado para actualizar el mismo servicio gratuito. Se registra estado live y repetición de pruebas públicas al terminar publicación.

## Alcance

No se han completado manualmente los 144 hoyos ni medido carga de ocho navegadores simultáneos. Aforo probado con ocho sockets. Nueve hoyos en navegador verifican flujo mediante Pasar hoyo, no una ronda ganada a golpes. Primer hoyo e impactos sí usan tiros reales. Gráficos 3D estilizados y física de minigolf; no se afirma equivalencia exacta con Golf It.

Las salas se pierden si reinicia el servidor gratuito. GPU, red y arranque después de inactividad afectan la experiencia.
