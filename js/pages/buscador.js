import { api } from '../api/client.js';
import { escapeHTML } from '../utils/ui.js';

// Buscador avanzado: filtra por categoría, calificación en estrellas (0 a 5) y año de estreno.
// El backend hace la búsqueda; aquí solo se arman los parámetros y se muestran los resultados.
class PaginaBuscador {
  static CAMPOS = ['categoria', 'minRating', 'maxRating', 'anioDesde', 'anioHasta'];

  #form = document.getElementById('formBuscar');
  #resultados = document.getElementById('resultados');
  #mensaje = document.getElementById('mensaje');

  iniciar() {
    this.#form.addEventListener('submit', (e) => this.#buscar(e));
    this.#cargarCategorias();
  }

  // Llena el select con las categorías existentes
  async #cargarCategorias() {
    try {
      const categorias = await api.categorias.listar();
      const select = document.getElementById('categoria');
      select.insertAdjacentHTML('beforeend', categorias
        .map((c) => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`)
        .join(''));
    } catch {
      // Sin categorías el buscador igual funciona, solo sin ese filtro
    }
  }

  // Solo se mandan los filtros que tienen valor
  #leerFiltros() {
    const filtros = {};
    PaginaBuscador.CAMPOS.forEach((id) => {
      const valor = document.getElementById(id).value.trim();
      if (valor) filtros[id] = valor;
    });
    return filtros;
  }

  async #buscar(e) {
    e.preventDefault();
    this.#mensaje.textContent = 'Buscando…';
    try {
      const peliculas = await api.peliculas.buscar(this.#leerFiltros());
      this.#pintar(peliculas);
    } catch (err) {
      this.#resultados.innerHTML = '';
      this.#mensaje.textContent = err.message;
    }
  }

  // Cada película muestra título, categoría, año y calificación
  #pintar(peliculas) {
    if (!peliculas.length) {
      this.#resultados.innerHTML = '';
      this.#mensaje.textContent = 'No se encontraron películas con esos filtros.';
      return;
    }
    this.#mensaje.textContent = `${peliculas.length} resultado(s)`;
    this.#resultados.innerHTML = peliculas.map((p) => `
      <article class="card-pelicula">
        <h2>${escapeHTML(p.titulo)}</h2>
        <p>${escapeHTML(p.categoria)} · ${escapeHTML(String(p.anio))}</p>
        <p>${this.#estrellas(p.calificacion)}</p>
      </article>`).join('');
  }

  // 0 significa que todavía no tiene reseñas
  #estrellas(calificacion) {
    if (!calificacion) return 'Sin reseñas';
    const llenas = Math.round(calificacion);
    return `${'★'.repeat(llenas)}${'☆'.repeat(5 - llenas)} (${calificacion})`;
  }
}

new PaginaBuscador().iniciar();
