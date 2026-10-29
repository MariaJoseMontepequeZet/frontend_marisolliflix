// Datos de ejemplo mientras el backend no esté disponible (CONFIG.USE_MOCK).
const base = [
  ['Noche en la ciudad', 'Drama', 2022, 8.7, 950],
  ['Rumbo al norte', 'Aventura', 2021, 8.2, 1200],
  ['El último latido', 'Drama', 2023, 9.1, 800],
  ['Risas y enredos', 'Comedia', 2020, 7.4, 1500],
  ['Sombras del pasado', 'Suspenso', 2019, 8.0, 700],
  ['Galaxia Perdida', 'Ciencia ficción', 2024, 8.9, 1800],
  ['Amor de verano', 'Romance', 2018, 6.9, 600],
  ['La casa vacía', 'Terror', 2022, 7.6, 1100],
  ['Código rojo', 'Acción', 2023, 7.9, 1700],
  ['Colores del mundo', 'Animación', 2021, 8.4, 1400],
  ['Cazadores de tormentas', 'Aventura', 2020, 7.7, 900],
  ['Entre risas', 'Comedia', 2024, 7.1, 1000],
  ['Misión imposible 9', 'Acción', 2019, 7.3, 1900],
  ['Susurros', 'Terror', 2023, 6.8, 650],
  ['Horizonte', 'Ciencia ficción', 2022, 8.5, 1300],
  ['Corazón de papel', 'Romance', 2024, 7.8, 750],
];

export const PELICULAS_MOCK = base.map(([titulo, categoria, anio, rating, popularidad], i) => ({
  id: i + 1,
  titulo,
  categoria,
  anio,
  rating,
  popularidad,
  descripcion: `${titulo}: una historia de ${categoria.toLowerCase()} que no te puedes perder.`,
  imagen: '',
}));
