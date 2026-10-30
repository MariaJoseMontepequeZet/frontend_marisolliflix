import { CONFIG } from '../utils/config.js';
import { getToken, cerrarSesion } from '../utils/auth.js';

// auth: true envía el token de la sesión y exige tenerla; auth: 'opcional' lo envía solo
// si hay sesión (así el backend sabe quién mira). Si el backend responde 401 con sesión
// iniciada, el token venció o ya no sirve: se cierra la sesión.
async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = auth ? getToken() : null;
  if (auth === true && !token) throw new Error('Debes iniciar sesión.');
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${CONFIG.API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (res.status === 204) return null;
  if (!res.ok) {
    // El backend responde { status: 'error', message, errors? }
    const cuerpo = await res.json().catch(() => ({}));
    if (res.status === 401 && token) {
      cerrarSesion();
      throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
    }
    const detalle = (cuerpo.errors ?? []).map((e) => e.message).join(' · ');
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

// Convierte una película de la API al formato del frontend
function aPelicula(m, nombres) {
  return {
    id: m.id,
    titulo: m.title,
    descripcion: m.description,
    categoriaId: m.categoryId,
    categoria: nombres.get(m.categoryId) ?? 'Sin categoría',
    tipo: m.type,
    estado: m.status,
    anio: m.year,
    imagen: m.imageUrl ?? '',
    resenas: m.stats.reviewCount,
    rating: m.stats.avgRating,
    ranking: m.stats.rankingScore,
    creada: m.createdAt,
  };
}

async function conNombres(lista) {
  const categorias = await getCategorias();
  const nombres = new Map(categorias.map((c) => [c.id, c.name]));
  return lista.map((m) => aPelicula(m, nombres));
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

  const peliculas = data.map((m) => aPelicula(m, nombres));
  return { peliculas, paginacion: pagination };
}

// ---- Detalle y reseñas ----
// Detalle de una película con sus reseñas. Si hay sesión se envía el token: así llegan
// `myVote` (tu voto en cada reseña) y se pueden ver las películas propias aún pendientes.
export async function getPelicula(id) {
  const [{ data }, categorias] = await Promise.all([
    request(`/movies/${encodeURIComponent(id)}`, { auth: 'opcional' }),
    getCategorias(),
  ]);
  const nombres = new Map(categorias.map((c) => [c.id, c.name]));
  return {
    pelicula: { ...aPelicula(data, nombres), likes: data.stats.likes, dislikes: data.stats.dislikes, creadaPor: data.createdBy },
    resenas: data.reviews.map((r) => ({
      id: r.id,
      titulo: r.title,
      rating: r.rating,
      comentario: r.comment,
      autor: r.author,
      likes: r.likes,
      dislikes: r.dislikes,
      miVoto: r.myVote,
      creada: r.createdAt,
      editada: r.updatedAt,
    })),
  };
}

export const crearResena = (peliculaId, { title, rating, comment }) =>
  request(`/movies/${peliculaId}/reviews`, { method: 'POST', body: { title, rating, comment }, auth: true });
export const editarResena = (id, { title, rating, comment }) =>
  request(`/reviews/${id}`, { method: 'PUT', body: { title, rating, comment }, auth: true });
export const borrarResena = (id) => request(`/reviews/${id}`, { method: 'DELETE', auth: true });
// type: 'like' | 'dislike'. Repetir el mismo tipo quita el voto.
export const reaccionar = (id, type) => request(`/reviews/${id}/reaction`, { method: 'POST', body: { type }, auth: true });

// ---- Sesión ----
export const login = (email, password) => request('/auth/login', { method: 'POST', body: { email, password } });
export const registrar = ({ username, email, password }) =>
  request('/auth/register', { method: 'POST', body: { username, email, password } });

// ---- Películas (usuario y admin) ----
export function proponerPelicula(datos) {
  return request('/movies', { method: 'POST', body: datos, auth: true });
}

// Solo admin: todas las películas, con filtro opcional por estado
export async function getPeliculasAdmin({ page = 1, limit = 10, status } = {}) {
  const params = new URLSearchParams({ page, limit, sort: 'recientes' });
  if (status) params.set('status', status);
  const { data, pagination } = await request(`/movies?${params}`, { auth: true });
  return { peliculas: await conNombres(data), paginacion: pagination };
}

// Solo admin: propuestas por revisar, las más viejas primero
export async function getPendientes({ page = 1, limit = 10 } = {}) {
  const { data, pagination } = await request(`/movies/pending?page=${page}&limit=${limit}`, { auth: true });
  return { peliculas: await conNombres(data), paginacion: pagination };
}

export const editarPelicula = (id, datos) => request(`/movies/${id}`, { method: 'PUT', body: datos, auth: true });
export const cambiarEstado = (id, status) => request(`/movies/${id}/status`, { method: 'PATCH', body: { status }, auth: true });
export const borrarPelicula = (id) => request(`/movies/${id}`, { method: 'DELETE', auth: true });

// ---- Categorías (solo admin) ----
// Después de cambiarlas se descarta la copia guardada para que la lista se vuelva a pedir.
async function cambiarCategoria(path, opciones) {
  const respuesta = await request(path, { ...opciones, auth: true });
  categoriasPendientes = null;
  return respuesta;
}
export const crearCategoria = (name) => cambiarCategoria('/categories', { method: 'POST', body: { name } });
export const editarCategoria = (id, name) => cambiarCategoria(`/categories/${id}`, { method: 'PUT', body: { name } });
export const borrarCategoria = (id) => cambiarCategoria(`/categories/${id}`, { method: 'DELETE' });
