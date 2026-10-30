import { getUsuario, cerrarSesion } from './utils/auth.js';

// Las páginas dentro de /pages/ enlazan entre sí sin prefijo; el inicio necesita "pages/".
const enPages = location.pathname.includes('/pages/');
const base = enPages ? '' : 'pages/';
const nav = document.querySelector('.nav');
const usuario = getUsuario();

// Enlaces según la sesión: proponer (logueado), admin (solo admin) y entrar/salir.
const enlaces = [];
if (usuario) enlaces.push(`<a href="${base}proponer.html">Proponer</a>`);
if (usuario?.role === 'admin') enlaces.push(`<a href="${base}admin.html">Administración</a>`);
enlaces.push(usuario
  ? `<button type="button" class="nav__salir" id="salir">Salir (${usuario.username.replace(/[<>&"']/g, '')})</button>`
  : `<a href="${base}login.html">Entrar</a>`);
nav.insertAdjacentHTML('beforeend', enlaces.join(''));

document.getElementById('salir')?.addEventListener('click', () => {
  cerrarSesion();
  location.href = enPages ? '../index.html' : 'index.html';
});

// Marca el enlace activo de la navegación según la página actual.
const actual = location.pathname.split('/').pop() || 'index.html';
nav.querySelectorAll('a').forEach((a) => {
  if (a.getAttribute('href').split('/').pop() === actual) a.classList.add('active');
});

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
