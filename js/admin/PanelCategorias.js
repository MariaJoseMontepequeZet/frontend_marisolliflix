import { api } from '../api/client.js';
import { Dialogos } from '../utils/Dialogos.js';
import { escapeHTML } from '../utils/ui.js';
import { Panel } from './Panel.js';

// Pestaña "Categorías": crear, editar y borrar
export class PanelCategorias extends Panel {
  constructor() {
    super('tab-categorias', 'lista-categorias');
  }

  acciones() {
    return {
      'nueva-cat': () => this.#nueva(),
      'editar-cat': (id, boton) => this.#editar(id, boton.dataset.nombre),
      'borrar-cat': (id, boton) => this.#borrar(id, boton.dataset.nombre),
    };
  }

  pintar() {
    return this.cargar(async () => {
      const categorias = await api.categorias.listar();
      this.lista.innerHTML = categorias.length
        ? `<ul class="lista">${categorias.map((c) => this.#fila(c)).join('')}</ul>`
        : '<p class="state">Aún no hay categorías.</p>';
    });
  }

  #fila(c) {
    return `<li class="fila">
      <strong class="fila__titulo">${escapeHTML(c.name)}</strong>
      <div class="fila__acciones">
        <button class="btn btn--sec" data-accion="editar-cat" data-id="${c.id}" data-nombre="${escapeHTML(c.name)}">Editar</button>
        <button class="btn btn--peligro" data-accion="borrar-cat" data-id="${c.id}" data-nombre="${escapeHTML(c.name)}">Eliminar</button>
      </div></li>`;
  }

  #campoNombre(valor = '') {
    return `<label>Nombre <input type="text" name="name" maxlength="100" value="${escapeHTML(valor)}" required></label>`;
  }

  async #nueva() {
    const guardado = await Dialogos.formulario({
      titulo: 'Nueva categoría',
      cuerpo: this.#campoNombre(),
      alEnviar: (d) => api.categorias.crear(d.name.trim()),
    });
    if (guardado) {
      Dialogos.avisar('Categoría creada.');
      await this.pintar();
    }
  }

  async #editar(id, nombre) {
    const guardado = await Dialogos.formulario({
      titulo: 'Editar categoría',
      cuerpo: this.#campoNombre(nombre),
      alEnviar: (d) => api.categorias.editar(id, d.name.trim()),
    });
    if (guardado) {
      Dialogos.avisar('Categoría actualizada.');
      await this.pintar();
    }
  }

  async #borrar(id, nombre) {
    if (await Dialogos.confirmar(`¿Eliminar la categoría "${nombre}"?`, { textoBoton: 'Eliminar', peligro: true })) {
      await this.ejecutar(() => api.categorias.borrar(id), 'Categoría eliminada.');
    }
  }
}
