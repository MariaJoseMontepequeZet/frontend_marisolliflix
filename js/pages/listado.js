import { api } from '../api/client.js';
import { escapeHTML, Tarjetas, Estados } from '../utils/ui.js';
import { Paginador } from '../utils/Paginador.js';
import { CONFIG } from '../utils/config.js';

// Listado de películas: búsqueda, filtro por categoría, orden y paginación
class PaginaListado {
  #grid = document.getElementById('grid');
  #filtro = document.getElementById('filtro-categoria');
  #orden = document.getElementById('orden');
  #paginacion = document.getElementById('paginacion');
  #titulo = document.getElementById('titulo-listado');
  #aviso = document.getElementById('aviso-orden');
  #buscador = document.querySelector('.buscador');
  #campoBusqueda = document.getElementById('buscar');
  #pagina = 1;
  #peticion = 0; // evita que una respuesta lenta pise a una más reciente
  #espera = null; // temporizador para no pedir al backend en cada tecla

  async iniciar() {
    this.#conectarEventos();
    await this.#cargarCategorias();
    this.#actualizarUrl();
    this.#cargar();
  }

  #textoBuscado() {
    return this.#campoBusqueda.value.trim();
  }

  async #cargarCategorias() {
    try {
      const categorias = await api.categorias.listar();
      this.#filtro.innerHTML =
        '<option value="">Todas</option>' +
        categorias.map((c) => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('');
    } catch {
      // Sin categorías el listado igual funciona, solo sin filtro
    }
  }

  #conectarEventos() {
    // Mientras se escribe se espera un momento antes de buscar; Enter busca de inmediato
    this.#campoBusqueda.addEventListener('input', () => {
      clearTimeout(this.#espera);
      this.#espera = setTimeout(() => this.#buscar(), 350);
    });
    this.#buscador.addEventListener('submit', (e) => {
      e.preventDefault();
      clearTimeout(this.#espera);
      this.#buscar();
    });

    this.#filtro.addEventListener('change', () => this.#volverAlPrincipio());
    this.#orden.addEventListener('change', () => this.#volverAlPrincipio());
    new Paginador(this.#paginacion, (dir) => {
      this.#pagina += dir;
      this.#cargar();
      const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: sinMovimiento ? 'auto' : 'smooth' });
    });
    document.addEventListener('pelicula-cambiada', () => this.#cargar());
  }

  #buscar() {
    this.#pagina = 1;
    this.#actualizarUrl();
    this.#cargar();
  }

  #volverAlPrincipio() {
    this.#pagina = 1;
    this.#cargar();
  }

  // La búsqueda queda en la dirección (listado.html?q=...) para poder compartirla o recargar
  #actualizarUrl() {
    const url = new URL(location.href);
    if (this.#textoBuscado()) url.searchParams.set('q', this.#textoBuscado());
    else url.searchParams.delete('q');
    history.replaceState(null, '', url);
    this.#titulo.textContent = this.#textoBuscado() ? `Resultados para “${this.#textoBuscado()}”` : 'Películas';
  }

  // Pide al backend la página actual con el filtro y el orden elegidos
  async #cargar() {
    const actual = ++this.#peticion;
    Estados.cargando(this.#grid, CONFIG.PAGE_SIZE);
    this.#aviso.hidden = true;
    this.#paginacion.innerHTML = '';
    try {
      const { peliculas, paginacion } = await api.peliculas.listar({
        sort: this.#orden.value,
        page: this.#pagina,
        categoriaId: this.#filtro.value || undefined,
        q: this.#textoBuscado() || undefined,
      });
      if (actual !== this.#peticion) return;

      if (!peliculas.length) {
        Estados.vacio(this.#grid, this.#textoBuscado()
          ? `No encontramos nada para “${this.#textoBuscado()}”. Prueba con otro título o quita los filtros.`
          : undefined);
        return;
      }
      // Sin reseñas todas empatan en ranking y popularidad: se avisa por qué el orden parece alfabético
      const porResenas = ['ranking', 'popularidad'].includes(this.#orden.value);
      this.#aviso.hidden = !(porResenas && peliculas.every((p) => p.resenas === 0));
      this.#grid.innerHTML = peliculas.map(Tarjetas.card).join('');
      this.#grid.removeAttribute('aria-busy');
      this.#paginacion.innerHTML = Paginador.html(paginacion);
    } catch (e) {
      if (actual === this.#peticion) Estados.error(this.#grid, e.message);
    }
  }
}

new PaginaListado().iniciar();
