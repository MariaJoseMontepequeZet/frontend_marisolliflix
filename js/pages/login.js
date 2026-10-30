import { login, registrar } from '../api/client.js';
import { guardarSesion } from '../utils/auth.js';

const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');
const tabs = document.querySelectorAll('.tab');

// ?volver=/ruta lleva de vuelta a la página donde se pidió iniciar sesión.
// Solo se aceptan rutas del propio sitio (empiezan con una sola "/"), nunca otra dirección.
const volver = new URLSearchParams(location.search).get('volver');
const esRutaPropia = (ruta) =>
  typeof ruta === 'string' && ruta.startsWith('/') && !ruta.startsWith('//') && !ruta.includes('\\') && !ruta.includes(':');
const destinoVolver = esRutaPropia(volver) ? volver : null;

tabs.forEach((tab) => tab.addEventListener('click', () => {
  const esLogin = tab.dataset.modo === 'login';
  formLogin.hidden = !esLogin;
  formRegistro.hidden = esLogin;
  tabs.forEach((t) => {
    t.classList.toggle('active', t === tab);
    t.setAttribute('aria-selected', String(t === tab));
  });
}));

function mostrarError(form, mensaje) {
  const p = form.querySelector('.form__error');
  p.textContent = mensaje;
  p.hidden = !mensaje;
}

// Envía el formulario y muestra el error del backend sin recargar la página
function manejar(form, accion) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarError(form, '');
    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;
    try {
      await accion(Object.fromEntries(new FormData(form)));
    } catch (err) {
      mostrarError(form, err.message);
      boton.disabled = false;
    }
  });
}

manejar(formLogin, async (datos) => {
  const { token, user } = await login(datos.email, datos.password);
  guardarSesion(token, user);
  location.href = destinoVolver ?? (user.role === 'admin' ? 'admin.html' : '../index.html');
});

manejar(formRegistro, async (datos) => {
  await registrar(datos);
  // Después de crear la cuenta se inicia sesión sola
  const { token, user } = await login(datos.email, datos.password);
  guardarSesion(token, user);
  location.href = destinoVolver ?? '../index.html';
});
