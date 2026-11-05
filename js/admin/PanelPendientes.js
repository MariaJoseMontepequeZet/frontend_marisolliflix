import { api } from '../api/client.js';
import { Dialogos } from '../utils/Dialogos.js';
import { PanelListaPeliculas } from './PanelListaPeliculas.js';

const BOTONES = [['ver-peli', 'Ver', 'btn--sec'], ['aprobar', 'Aprobar', ''], ['rechazar', 'Rechazar', 'btn--peligro']];

// Pestaña "Pendientes": propuestas de los usuarios por aprobar o rechazar
export class PanelPendientes extends PanelListaPeliculas {
  #contador = document.getElementById('contador-pendientes');

  constructor(opciones) {
    super('tab-pendientes', 'lista-pendientes', opciones);
  }

  acciones() {
    return {
      ...super.acciones(),
      aprobar: (id) => this.#cambiarEstado(id, 'approved'),
      rechazar: (id) => this.#cambiarEstado(id, 'rejected'),
    };
  }

  pintar() {
    return this.pintarPeliculas({
      pedir: () => api.peliculas.pendientes({ page: this.pagina }),
      botones: BOTONES,
      vacio: 'No hay propuestas por revisar.',
      alPintar: ({ total }) => {
        this.#contador.textContent = total;
        this.#contador.hidden = !total;
      },
    });
  }

  async #cambiarEstado(id, estado) {
    const { titulo } = this.peliculaCargada(id);
    const aprobar = estado === 'approved';
    const pregunta = aprobar ? `¿Aprobar "${titulo}"? Aparecerá en el catálogo.` : `¿Rechazar "${titulo}"?`;
    const confirmado = await Dialogos.confirmar(pregunta, {
      textoBoton: aprobar ? 'Aprobar' : 'Rechazar',
      peligro: !aprobar,
    });
    if (confirmado) {
      await this.ejecutar(() => api.peliculas.cambiarEstado(id, estado), aprobar ? 'Película aprobada.' : 'Película rechazada.');
    }
  }
}
