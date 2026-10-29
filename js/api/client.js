import { CONFIG } from '../utils/config.js';
import { PELICULAS_MOCK } from '../mock/peliculas.js';

async function request(path, options = {}) {
  const res = await fetch(`${CONFIG.API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`Error ${res.status} al consultar ${path}`);
  return res.json();
}

// Normaliza los campos para que la UI no dependa del formato exacto del backend.
function normalizar(p) {
  return {
    id: p.id,
    titulo: p.titulo ?? p.title ?? 'Sin título',
    categoria: p.categoria ?? p.genero ?? 'Sin categoría',
    anio: p.anio ?? p.year ?? '',
    rating: Number(p.rating ?? p.ranking ?? 0),
    popularidad: Number(p.popularidad ?? p.vistas ?? 0),
    descripcion: p.descripcion ?? p.sinopsis ?? '',
    imagen: p.imagen ?? p.poster ?? '',
  };
}

export async function getPeliculas() {
  const data = CONFIG.USE_MOCK
    ? await new Promise((r) => setTimeout(() => r(PELICULAS_MOCK), 400))
    : await request('/peliculas');
  const lista = Array.isArray(data) ? data : data.items ?? data.data ?? [];
  return lista.map(normalizar);
}
