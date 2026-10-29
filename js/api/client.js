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

// Las categorías casi no cambian: se piden una sola vez por página.
let categoriasPendientes = null;

export function getCategorias() {
  if (!categoriasPendientes) {
    categoriasPendientes = request('/categories')
      .then(({ data }) => data)
      .catch((e) => {
        categoriasPendientes = null; // permite reintentar si falló
        throw e;
      });
  }
  return categoriasPendientes;
}

// Pide al backend las películas aprobadas ya filtradas, ordenadas y paginadas.
// sort: ranking | popularidad | recientes | titulo | anio
// Devuelve { peliculas, paginacion } con el nombre de la categoría ya resuelto.
export async function getPeliculas({ sort = 'recientes', page = 1, limit = CONFIG.PAGE_SIZE, categoriaId } = {}) {
  const params = new URLSearchParams({ sort, page, limit });
  if (categoriaId) params.set('categoryId', categoriaId);

  const [{ data, pagination }, categorias] = await Promise.all([
    request(`/movies?${params}`),
    getCategorias(),
  ]);
  const nombres = new Map(categorias.map((c) => [c.id, c.name]));

  const peliculas = data.map((m) => ({
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
  return { peliculas, paginacion: pagination };
}
