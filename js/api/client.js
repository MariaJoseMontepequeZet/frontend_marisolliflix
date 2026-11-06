import { CONFIG } from '../utils/config.js';
import { sesion } from '../utils/Sesion.js';
import { HttpClient } from './HttpClient.js';

// Cada clase de este archivo habla con un grupo de rutas del backend.
// Todas reciben el HttpClient por el constructor, así ninguna sabe cómo se hace la petición.

class AuthApi {
  #http;

  constructor(http) {
    this.#http = http;
  }

  login(email, password) {
    return this.#http.pedir('/auth/login', { method: 'POST', body: { email, password } });
  }

  registrar({ username, email, password }) {
    return this.#http.pedir('/auth/register', { method: 'POST', body: { username, email, password } });
  }
}

class CategoriasApi {
  #http;
  // Las categorías casi no cambian: se piden una sola vez por página.
  #pendientes = null;

  constructor(http) {
    this.#http = http;
  }

  listar() {
    if (!this.#pendientes) {
      this.#pendientes = this.#http.pedir('/categories')
        .then(({ data }) => data)
        .catch((error) => {
          this.#pendientes = null; // permite reintentar si falló
          throw error;
        });
    }
    return this.#pendientes;
  }

  crear(name) {
    return this.#cambiar('/categories', { method: 'POST', body: { name } });
  }

  editar(id, name) {
    return this.#cambiar(`/categories/${id}`, { method: 'PUT', body: { name } });
  }

  borrar(id) {
    return this.#cambiar(`/categories/${id}`, { method: 'DELETE' });
  }

  // Después de cambiarlas se descarta la copia guardada para que la lista se vuelva a pedir.
  async #cambiar(ruta, opciones) {
    const respuesta = await this.#http.pedir(ruta, { ...opciones, auth: true });
    this.#pendientes = null;
    return respuesta;
  }
}

class PeliculasApi {
  #http;
  #categorias;

  constructor(http, categorias) {
    this.#http = http;
    this.#categorias = categorias;
  }

  // Pide al backend las películas aprobadas ya filtradas, ordenadas y paginadas.
  // sort: ranking | popularidad | recientes | titulo | anio | internet
  // Devuelve { peliculas, paginacion } con el nombre de la categoría ya resuelto.
  async listar({ sort = 'recientes', page = 1, limit = CONFIG.PAGE_SIZE, categoriaId, q } = {}) {
    const params = new URLSearchParams({ sort, page, limit });
    if (categoriaId) params.set('categoryId', categoriaId);
    if (q) params.set('q', q);
    const { data, pagination } = await this.#http.pedir(`/movies?${params}`);
    return { peliculas: await this.conNombres(data), paginacion: pagination };
  }

  // Detalle de una película con sus reseñas. Si hay sesión se envía el token: así llega
  // `myVote` y se pueden ver las películas propias aún pendientes.
  async obtener(id) {
    const [{ data }, nombres] = await Promise.all([
      this.#http.pedir(`/movies/${encodeURIComponent(id)}`, { auth: 'opcional' }),
      this.#nombresDeCategorias(),
    ]);
    return {
      pelicula: {
        ...this.#aPelicula(data, nombres),
        dislikes: data.stats.dislikes,
        creadaPor: data.createdBy,
        enLista: Boolean(data.inWatchlist),
      },
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

  // Buscador avanzado: devuelve [{ id, titulo, anio, categoria, calificacion }].
  // filtros: categoria, minRating, maxRating (estrellas de 0 a 5), anioDesde y anioHasta
  async buscar(filtros = {}) {
    const params = new URLSearchParams(filtros);
    const { data } = await this.#http.pedir(`/movies/search?${params}`);
    return data;
  }

  proponer(datos) {
    return this.#http.pedir('/movies', { method: 'POST', body: datos, auth: true });
  }

  // Solo admin: todas las películas, con filtro opcional por estado
  async listarAdmin({ page = 1, limit = 10, status } = {}) {
    const params = new URLSearchParams({ page, limit, sort: 'recientes' });
    if (status) params.set('status', status);
    const { data, pagination } = await this.#http.pedir(`/movies?${params}`, { auth: true });
    return { peliculas: await this.conNombres(data), paginacion: pagination };
  }

  // Solo admin: propuestas por revisar, las más viejas primero
  async pendientes({ page = 1, limit = 10 } = {}) {
    const { data, pagination } = await this.#http.pedir(`/movies/pending?page=${page}&limit=${limit}`, { auth: true });
    return { peliculas: await this.conNombres(data), paginacion: pagination };
  }

  editar(id, datos) {
    return this.#http.pedir(`/movies/${id}`, { method: 'PUT', body: datos, auth: true });
  }

  cambiarEstado(id, status) {
    return this.#http.pedir(`/movies/${id}/status`, { method: 'PATCH', body: { status }, auth: true });
  }

  borrar(id) {
    return this.#http.pedir(`/movies/${id}`, { method: 'DELETE', auth: true });
  }

  // Convierte una lista de películas de la API al formato del frontend
  async conNombres(lista) {
    const nombres = await this.#nombresDeCategorias();
    return lista.map((m) => this.#aPelicula(m, nombres));
  }

  async #nombresDeCategorias() {
    const categorias = await this.#categorias.listar();
    return new Map(categorias.map((c) => [c.id, c.name]));
  }

  #aPelicula(m, nombres) {
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
      trailer: m.trailerUrl ?? '',
      streaming: m.streaming ?? [], // [{ platform, url }]
      imdb: m.imdbRating ?? null, // calificación pública de IMDb (referencia externa)
      resenas: m.stats.reviewCount,
      rating: m.stats.avgRating,
      ranking: m.stats.rankingScore,
      likes: m.stats.likes,
      creada: m.createdAt,
    };
  }
}

class ResenasApi {
  #http;

  constructor(http) {
    this.#http = http;
  }

  crear(peliculaId, { title, rating, comment }) {
    return this.#http.pedir(`/movies/${peliculaId}/reviews`, { method: 'POST', body: { title, rating, comment }, auth: true });
  }

  editar(id, { title, rating, comment }) {
    return this.#http.pedir(`/reviews/${id}`, { method: 'PUT', body: { title, rating, comment }, auth: true });
  }

  borrar(id) {
    return this.#http.pedir(`/reviews/${id}`, { method: 'DELETE', auth: true });
  }

  // type: 'like' | 'dislike'. Repetir el mismo tipo quita el voto.
  reaccionar(id, type) {
    return this.#http.pedir(`/reviews/${id}/reaction`, { method: 'POST', body: { type }, auth: true });
  }
}

class ListaApi {
  #http;
  #peliculas;

  constructor(http, peliculas) {
    this.#http = http;
    this.#peliculas = peliculas;
  }

  async listar({ page = 1, limit = CONFIG.PAGE_SIZE } = {}) {
    const { data, pagination } = await this.#http.pedir(`/watchlist?page=${page}&limit=${limit}`, { auth: true });
    return { peliculas: await this.#peliculas.conNombres(data), paginacion: pagination };
  }

  agregar(id) {
    return this.#http.pedir(`/watchlist/${encodeURIComponent(id)}`, { method: 'POST', auth: true });
  }

  quitar(id) {
    return this.#http.pedir(`/watchlist/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true });
  }
}

// Solo admin: usuarios normales y administradores
class UsuariosApi {
  #http;

  constructor(http) {
    this.#http = http;
  }

  // Devuelve { usuarios, paginacion }; q busca en nombre y correo, role filtra por rol
  async listar({ page = 1, limit = 10, q, role } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (q) params.set('q', q);
    if (role) params.set('role', role);
    const { data, pagination } = await this.#http.pedir(`/users?${params}`, { auth: true });
    return { usuarios: data, paginacion: pagination };
  }

  crear({ username, email, password, role }) {
    return this.#http.pedir('/users', { method: 'POST', body: { username, email, password, role }, auth: true });
  }

  editar(id, cambios) {
    return this.#http.pedir(`/users/${id}`, { method: 'PUT', body: cambios, auth: true });
  }

  borrar(id) {
    return this.#http.pedir(`/users/${id}`, { method: 'DELETE', auth: true });
  }
}

// Se arma una sola vez: las páginas importan `api` y usan el grupo que necesitan
const http = new HttpClient(CONFIG.API_URL, sesion);
const categorias = new CategoriasApi(http);
const peliculas = new PeliculasApi(http, categorias);

export const api = {
  auth: new AuthApi(http),
  categorias,
  peliculas,
  resenas: new ResenasApi(http),
  lista: new ListaApi(http, peliculas),
  usuarios: new UsuariosApi(http),
};
