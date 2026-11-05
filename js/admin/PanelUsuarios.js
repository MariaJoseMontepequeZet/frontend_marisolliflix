import { api } from '../api/client.js';
import { sesion } from '../utils/Sesion.js';
import { Dialogos } from '../utils/Dialogos.js';
import { Paginador } from '../utils/Paginador.js';
import { escapeHTML } from '../utils/ui.js';
import { FormularioUsuario } from './FormularioUsuario.js';
import { Panel } from './Panel.js';

// Pestaña "Usuarios": buscar, crear usuarios normales o administradores, editarlos,
// cambiar su rol y eliminarlos
export class PanelUsuarios extends Panel {
  #buscador = document.getElementById('buscar-usuario');
  #filtroRol = document.getElementById('filtro-rol');
  #espera = null; // temporizador para no pedir al backend en cada tecla
  #cargados = new Map();

  constructor() {
    super('tab-usuarios', 'lista-usuarios');
    // Mientras se escribe se espera un momento antes de buscar
    this.#buscador.addEventListener('input', () => {
      clearTimeout(this.#espera);
      this.#espera = setTimeout(() => this.#buscarDeNuevo(), 350);
    });
    this.#filtroRol.addEventListener('change', () => this.#buscarDeNuevo());
  }

  acciones() {
    return {
      'nuevo-user': () => this.#nuevo(),
      'editar-user': (id) => this.#editar(id),
      'borrar-user': (id) => this.#borrar(id),
    };
  }

  pintar() {
    return this.cargar(async () => {
      const { usuarios, paginacion } = await api.usuarios.listar({
        page: this.pagina,
        q: this.#buscador.value.trim() || undefined,
        role: this.#filtroRol.value || undefined,
      });
      if (this.retrocederSiHaceFalta(usuarios.length)) {
        await this.pintar();
        return;
      }
      this.lista.innerHTML = usuarios.length
        ? `<ul class="lista">${usuarios.map((u) => this.#fila(u)).join('')}</ul>
           <div class="paginacion">${Paginador.html(paginacion, 'btn btn--sec')}</div>`
        : '<p class="state">No hay usuarios con ese filtro.</p>';
    });
  }

  #buscarDeNuevo() {
    this.volverAlPrincipio();
    this.pintar();
  }

  #esYo(usuario) {
    return usuario.id === sesion.usuario?.id;
  }

  #fila(u) {
    this.#cargados.set(u.id, u);
    const yo = this.#esYo(u);
    const fecha = new Date(u.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
    // Nadie puede eliminar su propia cuenta
    const eliminar = yo
      ? ''
      : `<button class="btn btn--peligro" data-accion="borrar-user" data-id="${u.id}">Eliminar</button>`;
    return `<li class="fila">
      <div class="fila__info">
        <strong class="fila__titulo">${escapeHTML(u.username)}${yo ? ' <span class="badge">Tú</span>' : ''}</strong>
        <span class="fila__meta">${escapeHTML(u.email)}
          <span class="badge badge--${escapeHTML(u.role)}">${escapeHTML(FormularioUsuario.NOMBRE_ROL[u.role] ?? u.role)}</span>
          · Registrado el ${escapeHTML(fecha)}</span>
      </div>
      <div class="fila__acciones">
        <button class="btn btn--sec" data-accion="editar-user" data-id="${u.id}">Editar</button>
        ${eliminar}
      </div>
    </li>`;
  }

  async #nuevo() {
    const guardado = await Dialogos.formulario({
      titulo: 'Nuevo usuario',
      cuerpo: FormularioUsuario.campos(),
      alEnviar: (d) => api.usuarios.crear(FormularioUsuario.datos(d)),
    });
    if (guardado) {
      Dialogos.avisar('Usuario creado.');
      await this.pintar();
    }
  }

  async #editar(id) {
    const usuario = this.#cargados.get(id);
    const yo = this.#esYo(usuario);
    let cambiado = null;
    const guardado = await Dialogos.formulario({
      titulo: 'Editar usuario',
      cuerpo: FormularioUsuario.campos({ usuario, esYo: yo }),
      alEnviar: async (d) => {
        cambiado = (await api.usuarios.editar(id, FormularioUsuario.datos(d, { editando: true }))).data;
      },
    });
    if (!guardado) return;
    // Si el admin se editó a sí mismo, su sesión muestra los datos nuevos
    if (yo) sesion.actualizarUsuario({ username: cambiado.username, email: cambiado.email });
    Dialogos.avisar('Usuario actualizado.');
    await this.pintar();
  }

  async #borrar(id) {
    const { username } = this.#cargados.get(id);
    const mensaje = `¿Eliminar a "${username}"? Se borrarán sus reseñas y sus películas pasarán a tu cuenta.`;
    if (await Dialogos.confirmar(mensaje, { textoBoton: 'Eliminar', peligro: true })) {
      await this.ejecutar(() => api.usuarios.borrar(id), 'Usuario eliminado.');
    }
  }
}
