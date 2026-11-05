import { escapeHTML } from '../utils/ui.js';
import { FormularioPelicula } from '../utils/FormularioPelicula.js';
import { VentanaPelicula } from '../utils/VentanaPelicula.js';
import { Paginador } from '../utils/Paginador.js';
import { Panel } from './Panel.js';

// Base de las pestañas que listan películas (Películas y Pendientes):
// dibuja las filas, recuerda las películas cargadas y sabe abrir su ventana de detalle.
export class PanelListaPeliculas extends Panel {
  #cargadas = new Map();

  peliculaCargada(id) {
    return this.#cargadas.get(id);
  }

  acciones() {
    return { 'ver-peli': (id) => VentanaPelicula.abrir(id) };
  }

  // pedir: función que trae { peliculas, paginacion }; botones: [[accion, texto, clase]]
  async pintarPeliculas({ pedir, botones, vacio, alPintar = () => {} }) {
    await this.cargar(async () => {
      const { peliculas, paginacion } = await pedir();
      if (this.retrocederSiHaceFalta(peliculas.length)) {
        await this.pintarPeliculas({ pedir, botones, vacio, alPintar });
        return;
      }
      alPintar(paginacion);
      this.lista.innerHTML = peliculas.length
        ? `<ul class="lista">${peliculas.map((p) => this.#fila(p, botones)).join('')}</ul>
           <div class="paginacion">${Paginador.html(paginacion, 'btn btn--sec')}</div>`
        : `<p class="state">${vacio}</p>`;
    });
  }

  #fila(p, botones) {
    this.#cargadas.set(p.id, p);
    const acciones = botones
      .map(([accion, texto, clase]) => `<button class="btn ${clase}" data-accion="${accion}" data-id="${p.id}">${texto}</button>`)
      .join('');
    return `<li class="fila">
      <div class="fila__info">
        <strong class="fila__titulo">${escapeHTML(p.titulo)}</strong>
        <span class="fila__meta">${escapeHTML(p.categoria)} · ${escapeHTML(FormularioPelicula.NOMBRE_TIPO[p.tipo] ?? p.tipo)} · ${escapeHTML(String(p.anio))}
          <span class="badge badge--${escapeHTML(p.estado)}">${escapeHTML(FormularioPelicula.NOMBRE_ESTADO[p.estado] ?? p.estado)}</span></span>
        <p class="fila__desc">${escapeHTML(p.descripcion)}</p>
      </div>
      <div class="fila__acciones">${acciones}</div>
    </li>`;
  }
}
