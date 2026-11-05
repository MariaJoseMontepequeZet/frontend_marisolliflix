import { api } from '../api/client.js';
import { Dialogos } from '../utils/Dialogos.js';
import { FormularioPelicula } from '../utils/FormularioPelicula.js';
import { PanelListaPeliculas } from './PanelListaPeliculas.js';

const BOTONES = [['ver-peli', 'Ver', 'btn--sec'], ['editar-peli', 'Editar', 'btn--sec'], ['borrar-peli', 'Eliminar', 'btn--peligro']];

// Pestaña "Películas": todas, con filtro por estado; crear, editar y eliminar
export class PanelPeliculas extends PanelListaPeliculas {
  #filtroEstado = document.getElementById('filtro-estado');

  constructor(opciones) {
    super('tab-peliculas', 'lista-peliculas', opciones);
    this.#filtroEstado.addEventListener('change', () => {
      this.volverAlPrincipio();
      this.pintar();
    });
  }

  acciones() {
    return {
      ...super.acciones(),
      'nueva-peli': () => this.#nueva(),
      'editar-peli': (id) => this.#editar(id),
      'borrar-peli': (id) => this.#borrar(id),
    };
  }

  pintar() {
    return this.pintarPeliculas({
      pedir: () => api.peliculas.listarAdmin({ page: this.pagina, status: this.#filtroEstado.value || undefined }),
      botones: BOTONES,
      vacio: 'No hay películas con ese estado.',
    });
  }

  async #nueva() {
    const categorias = await api.categorias.listar();
    const guardado = await Dialogos.formulario({
      titulo: 'Nueva película o serie',
      cuerpo: FormularioPelicula.campos(categorias),
      alEnviar: (d) => api.peliculas.proponer(FormularioPelicula.datos(d)),
    });
    if (guardado) {
      Dialogos.avisar('Película creada y aprobada.');
      await this.refrescar();
    }
  }

  async #editar(id) {
    const categorias = await api.categorias.listar();
    const guardado = await Dialogos.formulario({
      titulo: 'Editar película',
      cuerpo: FormularioPelicula.campos(categorias, this.peliculaCargada(id), { conEstado: true }),
      alEnviar: (d) => api.peliculas.editar(id, FormularioPelicula.datos(d)),
    });
    if (guardado) {
      Dialogos.avisar('Película actualizada.');
      await this.refrescar();
    }
  }

  async #borrar(id) {
    const { titulo } = this.peliculaCargada(id);
    if (await Dialogos.confirmar(`¿Eliminar "${titulo}"? Se borrarán también sus reseñas.`, { textoBoton: 'Eliminar', peligro: true })) {
      await this.ejecutar(() => api.peliculas.borrar(id), 'Película eliminada.');
    }
  }
}
