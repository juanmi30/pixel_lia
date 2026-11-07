/**
 * Todos los textos del juego.
 *
 * - `tap`: frases que dice cada personaje al tocarlo (se elige una al azar,
 *   evitando repetir la anterior).
 * - `interactions`: frases de las interacciones espontáneas. La clave es el `id`
 *   definido en interactions.js; `actor` es quien se acerca y `target` quien
 *   recibe la visita. Una lista vacía significa "no dice nada".
 *
 * Para añadir un diálogo basta con agregar otra cadena a la lista.
 */
export const DIALOGUES = {
  tap: {
    miguel: [
      '¡Hola, mi amor!',
      '¿Damos una vuelta?',
      'Qué bonito está el día.',
      'Te quiero muchísimo.',
      '¿Ya viste las flores?',
      'Este es nuestro lugarcito.',
    ],
    lia: [
      '¡Hola!',
      'Me encanta este lugarcito.',
      '¿Y Miguelito dónde anda?',
      'Qué rico el solecito.',
      '¡Ratencio, ven acá!',
      'Hoy es un buen día.',
    ],
    miguelito: [
      '¡Uuh uuh!',
      '*abrazo de peluche*',
      'Soy un mono muy suavecito.',
      '¿Jugamos?',
      '¡Aquí estoy!',
    ],
    ratencio: [
      'Squeak.',
      'Tengo hambre de queso...',
      'Estoy gordito de amor.',
      '¿Siestita?',
      '*se acomoda la pancita*',
    ],
  },

  /** Lo que dice un personaje al despertarlo de la siesta con un toque. */
  wake: {
    ratencio: ['¡Cinco minuticos más!', '*bosteza* ¿Ya es de día?', 'Estaba soñando con queso...'],
  },

  interactions: {
    'miguel-busca-lia': {
      actor: ['Te encontré.', '¿Me das un abrazo?', 'Hola, preciosa.'],
      target: ['¡Miguel!', 'Hola, tú.', '¡Sí!'],
    },
    'lia-busca-miguel': {
      actor: ['¡Te extrañé!', 'Ven, mira esto.', '¿Un besito?'],
      target: ['¡Lía!', 'Aquí estoy.', 'Siempre.'],
    },
    'peluches-juegan': {
      actor: ['¡Ratencio!', '¿Jugamos?'],
      target: ['Squeak squeak.', '¡Vamos!'],
    },
    'ratencio-visita-miguelito': {
      actor: ['Squeak.', '*olfatea*'],
      target: ['¡Uuh!', 'Hola, gordito.'],
    },
    'lia-abraza-ratencio': {
      actor: ['¡Mi gordito!', 'Qué suavecito eres.'],
      target: ['*se sonroja*', 'Squeak.'],
    },
    'miguel-y-miguelito': {
      actor: ['¿Qué haces, campeón?', '¡Choca esos cinco!'],
      target: ['¡Uuh uuh!'],
    },
  },
};
