# Prototipos de personajes — Etapa 2A

Sprites **estáticos** de prueba para validar el parecido antes de animar. No los usa el juego: los sprites de `public/assets/sprites/` siguen siendo los provisionales.

| Archivo | Contenido |
|---|---|
| `lia-prototype.png` | Lía, 20×28, fondo transparente |
| `ratencio-prototype.png` | Ratencio, 22×20, fondo transparente |
| `comparison.png` | Provisional y prototipo sobre la misma línea de suelo, ×8 (vecino más cercano) |
| `park-preview.png` | El parque actual con los prototipos, ×4 |
| `park-preview-before.png` | El mismo encuadre con los sprites provisionales, ×4 |

Para regenerarlos:

```bash
node docs/art/prototypes/build-prototypes.mjs
```

El arte está en `build-prototypes.mjs`: Lía en ASCII con su paleta, y Ratencio con formas (huevo, barriga, orejas) más detalles a mano. Para retocar un color basta con cambiar su valor en la paleta.

## Rasgos conservados

**Lía**
- Piel tostada cálida (`#c68a62`), con la sombra del mismo tono en cuello y mentón y las manos del mismo color que la cara.
- Pelo negro cálido, liso y largo, con raya casi al centro y sin flequillo. Cae por delante de los hombros y tiene un brillo sutil.
- Ojos grandes (2×3) con iris café oscuro, brillo y **delineado con colita** hacia arriba en la esquina exterior, su rasgo más reconocible en las fotos.
- Rubor en las mejillas y sonrisa pequeña.
- Blusa rosada, chaqueta negra abierta, pantalón oscuro.

**Ratencio**
- Silueta de **pera o huevo**, como el peluche real (estrecho arriba, ancho abajo), en lugar de la bola ancha del concepto.
- Ojos cerrados en arco (adormilado), naricita y rubor rosados.
- Orejitas redondas pequeñas con el interior café.
- **Gran círculo rosado en la barriga**, bracitos cortos, patitas mínimas y cola fina curvada.

## Coherencia con el concepto

- Mantiene la proporción chibi (la cabeza ocupa cerca de la mitad de Lía), el contorno oscuro de 1 px, de 2 a 3 tonos por material y la paleta cálida del parque.
- El concepto está dibujado a más resolución de la que permite el juego (personajes de unos 40 px). A 20×28 se conservan la silueta, los colores y los rasgos clave, pero no detalles finos como mechones o pestañas individuales.
- Diferencias intencionadas con el concepto, para respetar las fotos: Lía sin flequillo y con ojos abiertos y delineados; Ratencio con forma de pera.

## Recomendación de dimensiones

| Personaje | Frame | Motivo |
|---|---|---|
| Lía | 20×28 | Validado: los ojos con delineado y el pelo largo se leen bien a escala de juego |
| Miguel | 20×28 | Misma base que Lía para que se vean como pareja; el volumen del pelo cabe en las 2–3 filas superiores |
| Miguelito | 18×20 | Peluche, más bajo que los humanos; necesita ancho para las orejas |
| Ratencio | 22×20 | Validado: 71 % de la altura de Lía, ancho extra para la cola |

Cuando se integren (en la siguiente etapa, no ahora) habrá que ajustar solo la configuración:

- `frameWidth` y `frameHeight` en `src/config/assets.js`.
- `height` de cada personaje en `src/config/characters.js` (27 para los humanos, 17 para Ratencio).
- `distance` en `src/config/interactions.js`: subir de 11 a unos 15 para que Miguel y Lía no se monten al encontrarse.
- Opcional: una sombra algo más ancha (`fx/shadow.png`).

El formato de 9 frames y el volteo horizontal se mantienen.
