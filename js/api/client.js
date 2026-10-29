import { CONFIG } from '../utils/config.js';

async function request(path) {
  let res;
  try {
    res = await fetch(`${CONFIG.API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) {
    // El backend responde { status: 'error', message, errors? }
    const cuerpo = await res.json().catch(() => ({}));
    const detalle = (cuerpo.errors ?? []).map((e) => e.message).join(' ');
    throw new Error([cuerpo.message ?? `Error ${res.status}`, detalle].filter(Boolean).join(': '));
  }
  return res.json();
}

export async function getCategorias() {
  const { data } = await request('/categories');
  return data;
}

// Devuelve las películas aprobadas con el nombre de su categoría ya resuelto.
export async function getPeliculas() {
  const [{ data }, categorias] = await Promise.all([
    request(`/movies?limit=${CONFIG.API_LIMIT}`),
    getCategorias(),
  ]);
  const nombres = new Map(categorias.map((c) => [c.id, c.name]));

  return data.map((m) => ({
    id: m.id,
    titulo: m.title,
    descripcion: m.description,
    categoriaId: m.categoryId,
    categoria: nombres.get(m.categoryId) ?? 'Sin categoría',
    tipo: m.type,
    anio: m.year,
    imagen: m.imageUrl ?? '',
    resenas: m.stats.reviewCount,
    rating: m.stats.avgRating,
    ranking: m.stats.rankingScore,
    creada: m.createdAt,
  }));
}
