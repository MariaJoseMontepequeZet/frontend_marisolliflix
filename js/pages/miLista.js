import { api } from '../api/client.js';
import { sesion } from '../utils/Sesion.js';
import { Dialogos } from '../utils/Dialogos.js';
import { Paginador } from '../utils/Paginador.js';
import { Tarjetas, Estados } from '../utils/ui.js';

// "Mi lista": las películas que el usuario guardó para ver después
class PaginaMiLista {
  #grid = document.getElementById('mi-lista');
  #paginacion = document.getElementById('paginacion');
  #pagina = 1;

  iniciar() {
    if (!sesion.usuario) {
      location.href = `login.html?volver=${encodeURIComponent(location.pathname)}`;
      return;
    }
    this.#grid.addEventListener('click', (e) => this.#quitar(e));
    new Paginador(this.#paginacion, (dir) => {
      this.#pagina += dir;
      this.#cargar();
      window.scrollTo({ top: 0 });
    });
    document.addEventListener('pelicula-cambiada', () => this.#cargar());
    this.#cargar();
  }

  #tarjeta(p) {
    return `
      <div class="lista-item">
        ${Tarjetas.card(p)}
        <button type="button" class="btn btn--sec btn--chico" data-quitar="${p.id}">Quitar de mi lista</button>
      </div>`;
  }

  async #cargar() {
    Estados.cargando(this.#grid, 6);
    this.#paginacion.innerHTML = '';
    try {
      const { peliculas, paginacion } = await api.lista.listar({ page: this.#pagina });
      // Si se quitó la última de la página, se retrocede una
      if (!peliculas.length && this.#pagina > 1) {
        this.#pagina -= 1;
        await this.#cargar();
        return;
      }
      if (!peliculas.length) {
        Estados.vacio(this.#grid, 'Todavía no guardas películas. Abre una del catálogo y pulsa "+ Mi lista".');
        return;
      }
      this.#grid.innerHTML = peliculas.map((p) => this.#tarjeta(p)).join('');
      this.#grid.removeAttribute('aria-busy');
      this.#paginacion.innerHTML = Paginador.html(paginacion);
    } catch (e) {
      Estados.error(this.#grid, e.message);
    }
  }

  async #quitar(e) {
    const boton = e.target.closest('[data-quitar]');
    if (!boton) return;
    boton.disabled = true;
    try {
      await api.lista.quitar(boton.dataset.quitar);
      Dialogos.avisar('Quitada de tu lista.');
      this.#cargar();
    } catch (err) {
      Dialogos.avisar(err.message, 'error');
      boton.disabled = false;
    }
  }
}

new PaginaMiLista().iniciar();
