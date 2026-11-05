import { sesion } from '../utils/Sesion.js';
import { PanelCategorias } from '../admin/PanelCategorias.js';
import { PanelPeliculas } from '../admin/PanelPeliculas.js';
import { PanelPendientes } from '../admin/PanelPendientes.js';
import { PanelUsuarios } from '../admin/PanelUsuarios.js';

// Panel de administración: controla el acceso y las pestañas.
// Cada pestaña es un Panel que sabe dibujarse y manejar sus propios botones.
class PaginaAdmin {
  #panelAdmin = document.getElementById('panel-admin');
  #aviso = document.getElementById('aviso-acceso');
  #tabs = document.querySelectorAll('.tab');
  #paneles = {};

  iniciar() {
    if (!sesion.usuario) {
      location.href = 'login.html';
      return;
    }
    if (!sesion.esAdmin) {
      this.#aviso.textContent = 'Solo los administradores pueden entrar aquí.';
      this.#aviso.hidden = false;
      return;
    }
    this.#panelAdmin.hidden = false;
    this.#crearPaneles();
    this.#conectarTabs();
    Object.values(this.#paneles).forEach((panel) => panel.pintar());
  }

  #crearPaneles() {
    // Un cambio en una película puede afectar a las dos listas (Películas y Pendientes)
    const alCambiar = () => Promise.all([this.#paneles.peliculas.pintar(), this.#paneles.pendientes.pintar()]);
    this.#paneles = {
      categorias: new PanelCategorias(),
      peliculas: new PanelPeliculas({ alCambiar }),
      pendientes: new PanelPendientes({ alCambiar }),
      usuarios: new PanelUsuarios(),
    };
  }

  #conectarTabs() {
    this.#tabs.forEach((tab) => tab.addEventListener('click', () => {
      this.#tabs.forEach((t) => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });
      Object.keys(this.#paneles).forEach((nombre) => {
        document.getElementById(`tab-${nombre}`).hidden = nombre !== tab.dataset.tab;
      });
    }));
  }
}

new PaginaAdmin().iniciar();
