// Umbral mínimo de respuestas para mostrar datos de un país
export const MIN_RESPONSES_THRESHOLD = 30;

// Paleta de colores para cuartiles (de mayor a menor)
export const QUARTILE_COLORS = {
  q4: '#252525',  // Top quartile (más oscuro)
  q3: '#555555',
  q2: '#858585',
  q1: '#b5b5b5',  // Bottom quartile (más claro)
  noData: '#fcd34d',        // Amarillo - sin datos
  insufficient: '#e5e5e5',  // Gris claro - datos insuficientes
} as const;
