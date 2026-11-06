import { sesion, Sesion } from '../utils/Sesion.js';
import { escapeHTML } from '../utils/ui.js';
import { Dialogos } from '../utils/Dialogos.js';

// Encabezado de todas las páginas: menú según la sesión, buscador y botón de menú en móvil.
export class Encabezado {
  #header = document.querySelector('.header');
  #nav = document.querySelector('.nav');
  #toggle = document.createElement('button');
  // Las páginas dentro de /pages/ enlazan entre sí sin prefijo; el inicio necesita "pages/".
  #enPages = location.pathname.includes('/pages/');
  #base = this.#enPages ? '' : 'pages/';
  #actual = location.pathname.split('/').pop() || 'index.html';

  iniciar() {
    this.#crearBuscador();
    this.#crearEnlaceBuscadorAvanzado();
    this.#crearBotonMenu();
    this.#conectarSalir();
    this.#conectarCambioDeSesion();
    this.#pintarNav();
  }

  // Enlaces según la sesión: proponer (logueado), admin (solo admin) y entrar/salir.
  // Se pueden volver a pintar: lo que cambia con la sesión lleva data-sesion.
  #pintarNav() {
    this.#nav.querySelectorAll('[data-sesion]').forEach((el) => el.remove());
    const usuario = sesion.usuario;
    const enlaces = [];
    if (usuario) {
      enlaces.push(`<a data-sesion href="${this.#base}mi-lista.html">Mi lista</a>`);
      enlaces.push(`<a data-sesion href="${this.#base}proponer.html">Proponer</a>`);
    }
    if (sesion.esAdmin) enlaces.push(`<a data-sesion href="${this.#base}admin.html">Administración</a>`);
    enlaces.push(usuario
      ? `<button data-sesion type="button" class="nav__salir" id="salir">Salir (${escapeHTML(usuario.username)})</button>`
      : `<a data-sesion href="${this.#base}login.html">Entrar</a>`);
    this.#nav.insertAdjacentHTML('beforeend', enlaces.join(''));

    // Marca el enlace activo de la navegación según la página actual.
    this.#nav.querySelectorAll('a').forEach((a) => {
      a.classList.toggle('active', a.getAttribute('href').split('/').pop().split('?')[0] === this.#actual);
    });
  }

  // Está en el encabezado de todas las páginas. Fuera del catálogo, al enviar lleva a
  // listado.html?q=...; dentro del catálogo, la página del listado filtra mientras se escribe.
  #crearBuscador() {
    const buscador = document.createElement('form');
    buscador.className = 'buscador';
    buscador.setAttribute('role', 'search');
    buscador.action = `${this.#base}listado.html`;
    buscador.innerHTML = `
      <label class="sr-only" for="buscar">Buscar películas</label>
      <svg class="buscador__icono" aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input id="buscar" name="q" type="search" placeholder="Buscar películas…" maxlength="100" autocomplete="off">`;
    buscador.querySelector('input').value = new URLSearchParams(location.search).get('q') ?? '';
    this.#header.insertBefore(buscador, this.#nav);
  }

  // Enlace al buscador avanzado, junto a "Películas"
  #crearEnlaceBuscadorAvanzado() {
    this.#nav.querySelector('a[href$="listado.html"]')
      ?.insertAdjacentHTML('afterend', `<a href="${this.#base}buscador.html">Buscador</a>`);
  }

  // Botón de menú para pantallas angostas (el CSS lo muestra solo en móvil)
  #crearBotonMenu() {
    this.#nav.id = this.#nav.id || 'menu-principal';
    this.#toggle.type = 'button';
    this.#toggle.className = 'nav__toggle';
    this.#toggle.setAttribute('aria-label', 'Abrir el menú');
    this.#toggle.setAttribute('aria-expanded', 'false');
    this.#toggle.setAttribute('aria-controls', this.#nav.id);
    this.#toggle.textContent = '☰';
    this.#header.insertBefore(this.#toggle, this.#nav);

    this.#toggle.addEventListener('click', () => this.#alternarMenu());
    this.#nav.addEventListener('click', (e) => { if (e.target.closest('a')) this.#alternarMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.#alternarMenu(false); });
  }

  #alternarMenu(abrir) {
    const abierto = abrir ?? !this.#nav.classList.contains('nav--abierto');
    this.#nav.classList.toggle('nav--abierto', abierto);
    this.#toggle.setAttribute('aria-expanded', String(abierto));
    this.#toggle.setAttribute('aria-label', abierto ? 'Cerrar el menú' : 'Abrir el menú');
    this.#toggle.textContent = abierto ? '✕' : '☰';
  }

  // Salir pide confirmación para evitar cerrar la sesión sin querer
  #conectarSalir() {
    this.#nav.addEventListener('click', async (e) => {
      if (!e.target.closest('#salir')) return;
      if (await Dialogos.confirmar('¿Quieres cerrar tu sesión?', { textoBoton: 'Cerrar sesión' })) {
        sesion.cerrar();
        location.href = this.#enPages ? '../index.html' : 'index.html';
      }
    });
  }

  // Si la sesión cambia en otra pestaña (inicio, cierre o cambio de usuario), esta se entera:
  // se repinta el menú, se avisa al resto de la página y las pantallas que exigen sesión se recargan.
  #conectarCambioDeSesion() {
    window.addEventListener('storage', (e) => {
      if (e.key !== null && e.key !== Sesion.CLAVE) return; // null = se vació todo el almacenamiento
      this.#pintarNav();
      document.dispatchEvent(new CustomEvent('sesion-cambiada'));
      if (['admin.html', 'proponer.html', 'mi-lista.html'].includes(this.#actual)) location.reload();
    });
  }
}
