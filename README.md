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

## Personajes y sprites

Los cuatro personajes son definitivos. Su arte aprobado está en `docs/art/prototypes/characters/<id>.mjs` (paleta y dibujo), y las hojas animadas se generan a partir de él:

```bash
npm run sprites   # escribe public/assets/sprites/*.png y las vistas de docs/art/sprites/
```

El script (`docs/art/sprites/build-sprites.mjs`) define cada fotograma como un pequeño cambio sobre el reposo y comprueba al generar que el fotograma 0 sea idéntico al prototipo aprobado y que los pies toquen siempre la última fila. Para retocar una animación se edita ese script; para cambiar un color, la paleta del personaje.

### Formato de los personajes

`public/assets/sprites/<id>.png`: una sola fila de **9 frames**, con fondo transparente, de frente. Al caminar a la izquierda el juego los voltea solos.

| Personaje | Frame | Alto visible (`height`) |
|---|---|---|
| Miguel | 20×28 | 28 |
| Lía | 20×28 | 27 |
| Miguelito | 20×20 | 20 |
| Ratencio | 22×20 | 17 |

| Frame | Uso |
|---|---|
| 0 | Reposo |
| 1 | Respiración |
| 2–5 | Caminar: paso, intermedio, paso, intermedio |
| 6–7 | Reacción alegre (el saltito lo añade el juego) |
| 8 | Parpadeo |

Los pies tocan siempre el borde inferior del frame, que es el punto de apoyo del juego.

**Otro tamaño o número de frames:** cambia `frameWidth`/`frameHeight` en `config/assets.js`, los índices de `animations` en `config/characters.js` (o `DEFAULT_ANIMATIONS` para todos) y `height`. Si los personajes cambian de ancho, revisa `distance` en `config/interactions.js`.

Vistas para revisar: `docs/art/sprites/<id>-frames.png` (los 9 fotogramas ×8), `animations-preview.gif` y `en-el-parque.gif` (grabación del juego).

### Otros recursos (provisionales)

| Archivo | Formato |
|---|---|
| `background/park.png` | 320×180 |
| `props/tree.png` | 2 frames de 32×44 (verde, florecido), base del tronco abajo |
| `props/bush.png`, `props/bench.png` | imagen única, base abajo |
| `props/flowers.png` | 4 colores × 2 frames (normal, balanceo) de 7×8 |
| `fx/emotes.png` | 4 frames de 9×9: corazón, nota, brillo, corazoncito |
| `fx/shadow.png` | sombra bajo los personajes, 12×4 |

Si cambias el fondo, revisa `config/world.js` para que la zona caminable, los árboles y las flores coincidan con el nuevo dibujo.

```bash
npm run placeholders              # crea los recursos del escenario que falten
npm run placeholders -- --force   # los regenera todos (ya no toca a los personajes)
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
