# Nuestro lugarcito

Un pequeño parque pixel art donde conviven **Miguel**, **Lía**, **Miguelito** (mono de peluche) y **Ratencio** (ratón de peluche gordito). Pasean solos, se acercan entre ellos y reaccionan cuando los tocas.

Hecho con **Phaser 4.2.1**, JavaScript y **Vite**. Sin backend ni servicios externos.

## Uso

Necesitas Node.js 20.19 o superior (probado con 22).

```bash
npm install       # instala dependencias
npm run dev       # servidor de desarrollo → http://localhost:5173
npm run build     # versión final en dist/
npm run preview   # sirve dist/ localmente para revisarla
npm test          # pruebas de la lógica del mundo (node --test, sin dependencias)
```

### Publicar en Netlify

El repositorio ya incluye `netlify.toml` (`npm run build`, carpeta `dist`, Node 22). Basta con conectar el repo en Netlify, o arrastrar la carpeta `dist/` a https://app.netlify.com/drop.

## Estructura

```
public/assets/          Recursos visuales (se pueden sustituir sin tocar código)
  background/park.png   Fondo 320x180
  sprites/*.png         Hojas de los personajes
  props/                Árbol, arbusto, banco, flores
  fx/                   Emotes (corazón, nota, brillo…) y sombra
  fonts/                Pixelify Sans (licencia OFL)
scripts/
  generate-placeholders.mjs   Genera los sprites provisionales
src/
  main.js               Arranque y configuración de Phaser
  config/               ← Todo lo ajustable está aquí
    game.js             Resolución, título, fuente
    assets.js           Rutas y tamaños de frame de cada imagen
    characters.js       Personajes: velocidad, tiempos, animaciones
    dialogues.js        Todas las frases
    interactions.js     Encuentros espontáneos entre personajes
    behavior.js         Tiempos y parámetros generales
    world.js            Zona caminable, árboles, banco, flores
  entities/Character.js        Estados idle / walking / interacting
  systems/World.js             Límites y obstáculos (lógica pura)
  systems/InteractionDirector.js  Toques y encuentros espontáneos
  ui/SpeechBubbles.js          Globos de diálogo
  fx/Emotes.js                 Corazones y demás iconos
  scenes/BootScene.js          Carga de recursos y animaciones
  scenes/ParkScene.js          La escena del parque
```

El motor de interacciones (`Character`, `World`, `InteractionDirector`) no conoce ningún archivo de imagen: solo usa los nombres de textura definidos en `config/`.

## Reemplazar sprites

Los sprites actuales son **provisionales** y genéricos. Para poner el arte definitivo, sustituye el PNG manteniendo su formato (o cambia ruta y tamaño en `src/config/assets.js`).

### Formato de los personajes

`public/assets/sprites/<id>.png`: una sola fila de **9 frames**, cada uno de **16×20 px**, con fondo transparente, mirando hacia la **derecha** (o de frente). Al caminar a la izquierda el juego lo voltea solo.

| Frame | Uso |
|---|---|
| 0 | Quieto |
| 1 | Quieto (respiración) |
| 2–5 | Caminar (4 pasos) |
| 6–7 | Reacción (contento, saltito) |
| 8 | Parpadeo |

Los pies deben tocar el borde inferior del frame.

**Otro tamaño o número de frames:** cambia `frameWidth`/`frameHeight` en `config/assets.js` y los índices de `animations` del personaje en `config/characters.js` (o `DEFAULT_ANIMATIONS` para todos). Ajusta también `height` (alto visible, para colocar los globos encima de la cabeza).

### Otros recursos

| Archivo | Formato |
|---|---|
| `background/park.png` | 320×180 |
| `props/tree.png` | 2 frames de 32×44 (verde, florecido), base del tronco abajo |
| `props/bush.png`, `props/bench.png` | imagen única, base abajo |
| `props/flowers.png` | 4 colores × 2 frames (normal, balanceo) de 7×8 |
| `fx/emotes.png` | 4 frames de 9×9: corazón, nota, brillo, corazoncito |
| `fx/shadow.png` | sombra bajo los personajes, 12×4 |

Si cambias el fondo, revisa `config/world.js` para que la zona caminable, los árboles y las flores coincidan con el nuevo dibujo.

### Regenerar los provisionales

```bash
npm run placeholders              # crea solo los que falten
npm run placeholders -- --force   # ¡sobrescribe todos, incluido el arte definitivo!
```

## Añadir diálogos

Edita `src/config/dialogues.js`:

- **Al tocar a un personaje:** agrega frases a `tap.<id>`, por ejemplo `tap.lia`.
- **En un encuentro:** agrega frases a `interactions.<id del encuentro>.actor` (quien se acerca) o `.target` (quien recibe).

Se elige una frase al azar cada vez. Los globos duran más si la frase es más larga (`config/behavior.js → bubble`).

## Añadir un encuentro espontáneo

En `src/config/interactions.js` agrega una entrada, por ejemplo:

```js
{ id: 'ratencio-busca-lia', actor: 'ratencio', target: 'lia', weight: 2, distance: 12,
  emote: 'heart', emoteCount: 2, durationMs: 3000, cooldownMs: 20000 },
```

y sus frases en `dialogues.js → interactions['ratencio-busca-lia']`.

## Música

El juego empieza en una pantalla de bienvenida. La música solo suena después de tocar **"Entrar a nuestro lugarcito"**, porque los navegadores bloquean el audio que empieza solo. Se repite en bucle al 25 % de volumen y el botón de arriba a la derecha la silencia o reactiva. La preferencia se recuerda en el navegador.

- Archivo: `public/assets/audio/nuestro-lugarcito-musica-optimizada.mp3` (MP3 de 160 kbps, unos 108,7 s, recortado sin silencios).
- Ruta: `src/config/assets.js → audio.music`. Admite varios formatos en la lista, por ejemplo `.ogg` y `.mp3`, y Phaser usa el primero que el navegador pueda reproducir.
- Volumen: `src/config/game.js → audio.musicVolume`.
- Si el archivo falta, el juego funciona igual, sin música y sin el botón de sonido.
- Los originales pesados (WAV) se guardan fuera de `public/`; `docs/art/*.wav` y `docs/art/*.mp3` están en `.gitignore`.

## Ajustar el comportamiento

- Velocidad, pausas entre paseos y radio de paseo de cada uno: `config/characters.js`.
- Frecuencia de los encuentros, duración de la pausa al tocar, globos y emotes: `config/behavior.js`.

## Notas técnicas

- El mundo mide 320×180 píxeles de arte. Al iniciar se elige un factor entero (2–6) según la pantalla. La cámara amplía el mundo con ese zoom y `render.pixelArt: true` desactiva el suavizado, siguiendo la *Phaser 4 Pixel Art Guide* incluida en `node_modules/phaser/docs`. Los textos se dibujan a resolución completa para que se lean bien.
- `Scale.FIT` adapta el juego a cualquier ventana. En celulares en vertical aparece una sugerencia para girar el teléfono.
- En modo desarrollo, el juego está en `window.game` para depurar desde la consola.
