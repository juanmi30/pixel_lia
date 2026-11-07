# Prototipos de personajes

Sprites **estáticos** para validar la identidad visual antes de animar. El juego no los usa: los sprites de `public/assets/sprites/` siguen siendo los provisionales.

## Etapa 2B (vigente)

| Archivo | Contenido |
|---|---|
| `miguel-prototype.png` | Miguel, frame 20×28 (28 px dibujados) |
| `lia-prototype-v2.png` | Lía, frame 20×28 (27 px dibujados) |
| `miguelito-prototype.png` | Miguelito, frame 18×20 |
| `ratencio-prototype-v2.png` | Ratencio, frame 22×20 (17 px dibujados) |
| `all-characters-comparison.png` | Provisionales (arriba) y prototipos (abajo) sobre la misma línea de suelo, ×8 |
| `all-characters-park-preview.png` | El parque actual con los cuatro prototipos, ×4 |

Todos tienen fondo transparente, sin píxeles semitransparentes, y los pies en la última fila del frame (el punto de apoyo del juego). Las ampliaciones usan vecino más cercano.

```bash
node docs/art/prototypes/build-prototypes.mjs
```

El arte de cada personaje está en `characters/<id>.mjs`, con su paleta (`PALETTE`) y su dibujo: ASCII (`ART`) o, en Ratencio, la forma calculada (`SHAPE`) más los detalles a mano. Para cambiar un color basta con editar su valor en la paleta.

### Cambios y decisiones

**Lía v2.** Solo cambia la chaqueta: pasa a un negro azulado (`#3e3b52`) algo más claro y frío que el pelo, que sigue siendo negro cálido (`#2a1f24`), con un filo de luz (`#5c5878`) en el borde que toca el pelo. Rostro y piel sin cambios.

**Ratencio v2.** Se revisó la foto del peluche para que no se parezca a un gato:
- Cúpula redondeada arriba y cuerpo de pera, sin cuello.
- Orejas pequeñas y redondas a los costados de la cabeza (en la v1 estaban en las esquinas).
- Ojos pequeños y tranquilos con la esquina caída, en vez de la "v" felina.
- El rosado es ahora el **gran óvalo del hocico**, justo debajo de los ojos, con la naricita arriba y un brillo suave. Ya no es una barriga aparte.
- Patitas diminutas. La cola no se ve de frente: una puntita suelta parecía un guion despegado. Su color se guarda para las vistas de perfil.

**Miguel.**
- Piel clara cálida (`#f0c6a0`), claramente distinta de la de Lía.
- Pelo castaño muy oscuro con volumen, mechones con luz y flequillo irregular.
- Ojos oscuros y sonrisa abierta, como en la foto.
- Hoodie negro frío con cordones (no se confunde con el pelo) y jeans azules. Complexión delgada.

**Miguelito.** Todavía **sin foto de referencia**: está hecho a partir de la descripción.
- Café oscuro, con antifaz beige y ojos negros grandes con brillo.
- Hocico beige más claro, que sobresale, con naricita y sonrisa.
- Orejas redondas a los lados; manos, barriga y pies beige; cuerpo rechoncho.

### Validación conjunta

1. **Miguel y Lía comparten escala:** misma cabeza, piernas y línea de suelo. Miguel es 1 px más alto por el volumen del pelo.
2. **Pieles y rasgos distinguibles:** clara cálida frente a tostada; pelo despeinado con flequillo frente a liso con raya; sonrisa abierta frente a delineado y rubor.
3. **Peluches:** formas redondeadas, sin anatomía realista, y más bajos que los humanos (unos 70 %).
4. **Estilo común:** contorno oscuro de 1 px, 2 o 3 tonos por material, entre 10 y 17 colores por personaje y paleta cálida.
5. **Proporciones:** frente a los árboles (44 px) y el banco, ninguno queda desproporcionado.

### Para integrar más adelante (no en esta etapa)

- `src/config/assets.js`: `frameWidth`/`frameHeight` de 20×28 (humanos), 18×20 (Miguelito) y 22×20 (Ratencio).
- `src/config/characters.js`: `height` de 28 para Miguel, 27 para Lía, 20 para Miguelito y 17 para Ratencio.
- `src/config/interactions.js`: `distance` de unos 15 en los encuentros de Miguel y Lía.

Se mantienen los 9 frames por hoja y el volteo horizontal.

## Etapa 2A (histórico)

`lia-prototype.png`, `ratencio-prototype.png`, `comparison.png`, `park-preview.png` y `park-preview-before.png` son los primeros prototipos. Se conservan como referencia y el script actual ya no los regenera.
