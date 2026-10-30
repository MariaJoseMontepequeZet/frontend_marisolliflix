import { getUsuario, cerrarSesion, CLAVE_SESION } from './utils/auth.js';
import { CONFIG } from './utils/config.js';
import { escapeHTML } from './utils/ui.js';

// Las páginas dentro de /pages/ enlazan entre sí sin prefijo; el inicio necesita "pages/".
const enPages = location.pathname.includes('/pages/');
const base = enPages ? '' : 'pages/';
const actual = location.pathname.split('/').pop() || 'index.html';
const header = document.querySelector('.header');
const nav = document.querySelector('.nav');

// ---------- Menú de navegación ----------

// Enlaces según la sesión: proponer (logueado), admin (solo admin) y entrar/salir.
// Se pueden volver a pintar: lo que cambia con la sesión lleva data-sesion.
function pintarNav() {
  nav.querySelectorAll('[data-sesion]').forEach((el) => el.remove());
  const usuario = getUsuario();
  const enlaces = [];
  if (usuario) enlaces.push(`<a data-sesion href="${base}proponer.html">Proponer</a>`);
  if (usuario?.role === 'admin') enlaces.push(`<a data-sesion href="${base}admin.html">Administración</a>`);
  enlaces.push(usuario
    ? `<button data-sesion type="button" class="nav__salir" id="salir">Salir (${escapeHTML(usuario.username)})</button>`
    : `<a data-sesion href="${base}login.html">Entrar</a>`);
  nav.insertAdjacentHTML('beforeend', enlaces.join(''));

  // Marca el enlace activo de la navegación según la página actual.
  nav.querySelectorAll('a').forEach((a) => {
    a.classList.toggle('active', a.getAttribute('href').split('/').pop().split('?')[0] === actual);
  });
}

// Botón de menú para pantallas angostas (el CSS lo muestra solo en móvil)
nav.id = nav.id || 'menu-principal';
const toggle = document.createElement('button');
toggle.type = 'button';
toggle.className = 'nav__toggle';
toggle.setAttribute('aria-label', 'Abrir el menú');
toggle.setAttribute('aria-expanded', 'false');
toggle.setAttribute('aria-controls', nav.id);
toggle.textContent = '☰';
header.insertBefore(toggle, nav);

function alternarMenu(abrir) {
  const abierto = abrir ?? !nav.classList.contains('nav--abierto');
  nav.classList.toggle('nav--abierto', abierto);
  toggle.setAttribute('aria-expanded', String(abierto));
  toggle.setAttribute('aria-label', abierto ? 'Cerrar el menú' : 'Abrir el menú');
  toggle.textContent = abierto ? '✕' : '☰';
}
toggle.addEventListener('click', () => alternarMenu());
nav.addEventListener('click', (e) => { if (e.target.closest('a')) alternarMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') alternarMenu(false); });

// Salir pide confirmación para evitar cerrar la sesión sin querer
nav.addEventListener('click', async (e) => {
  if (!e.target.closest('#salir')) return;
  const { confirmar } = await import('./utils/modal.js');
  if (await confirmar('¿Quieres cerrar tu sesión?', { textoBoton: 'Cerrar sesión' })) {
    cerrarSesion();
    location.href = enPages ? '../index.html' : 'index.html';
  }
});

pintarNav();

// Si la sesión cambia en otra pestaña (inicio, cierre o cambio de usuario), esta se entera:
// se repinta el menú, se avisa al resto de la página y las pantallas que exigen sesión se recargan.
window.addEventListener('storage', (e) => {
  if (e.key !== null && e.key !== CLAVE_SESION) return; // null = se vació todo el almacenamiento
  pintarNav();
  document.dispatchEvent(new CustomEvent('sesion-cambiada'));
  if (['admin.html', 'proponer.html'].includes(actual)) location.reload();
});

// ---------- Pie de página ----------

if (!document.querySelector('.footer')) {
  document.body.insertAdjacentHTML('beforeend', `
    <footer class="footer">
      <p><strong>MarisolliFlix</strong> · Proyecto académico para calificar y rankear películas, series y animes.</p>
      <p class="footer__enlaces">
        <a href="https://github.com/MariaJoseMontepequeZet/frontend_marisolliflix">Frontend</a>
        <a href="https://github.com/MariaJoseMontepequeZet/backend_marisolliflix">Backend</a>
        <a href="${escapeHTML(CONFIG.API_URL)}/docs/">Documentación de la API</a>
      </p>
      <p class="footer__creditos">Sinopsis: Wikipedia en español (CC BY-SA 4.0) · Portadas: TMDB</p>
    </footer>`);
}

// ---------- Información de una película ----------

// Clic en una película (card o botón "Ver"): se abre su información en una ventana emergente.
// Con Ctrl, Cmd, Shift o clic central se respeta el enlace normal (abrir en otra pestaña).
document.addEventListener('click', async (e) => {
  const enlace = e.target.closest('[data-pelicula]');
  if (!enlace || e.defaultPrevented) return;
  if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  const { abrirPelicula } = await import('./utils/ventanaPelicula.js');
  abrirPelicula(enlace.dataset.pelicula);
});
