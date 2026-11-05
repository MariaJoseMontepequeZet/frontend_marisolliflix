import { api } from '../api/client.js';
import { sesion } from '../utils/Sesion.js';

// Pantalla de entrar y crear cuenta
class PaginaLogin {
  #formLogin = document.getElementById('form-login');
  #formRegistro = document.getElementById('form-registro');
  #tabs = document.querySelectorAll('.tab');
  #destinoVolver = PaginaLogin.#leerDestino();

  // ?volver=/ruta lleva de vuelta a la página donde se pidió iniciar sesión.
  // Solo se aceptan rutas del propio sitio (empiezan con una sola "/"), nunca otra dirección.
  static #leerDestino() {
    const volver = new URLSearchParams(location.search).get('volver');
    const esRutaPropia = typeof volver === 'string' && volver.startsWith('/') && !volver.startsWith('//')
      && !volver.includes('\\') && !volver.includes(':');
    return esRutaPropia ? volver : null;
  }

  iniciar() {
    this.#tabs.forEach((tab) => tab.addEventListener('click', () => this.#cambiarModo(tab)));
    this.#manejar(this.#formLogin, (datos) => this.#entrar(datos));
    this.#manejar(this.#formRegistro, (datos) => this.#registrar(datos));
  }

  #cambiarModo(tab) {
    const esLogin = tab.dataset.modo === 'login';
    this.#formLogin.hidden = !esLogin;
    this.#formRegistro.hidden = esLogin;
    this.#tabs.forEach((t) => {
      t.classList.toggle('active', t === tab);
      t.setAttribute('aria-selected', String(t === tab));
    });
  }

  #mostrarError(form, mensaje) {
    const p = form.querySelector('.form__error');
    p.textContent = mensaje;
    p.hidden = !mensaje;
  }

  // Envía el formulario y muestra el error del backend sin recargar la página
  #manejar(form, accion) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.#mostrarError(form, '');
      const boton = form.querySelector('button[type="submit"]');
      boton.disabled = true;
      try {
        await accion(Object.fromEntries(new FormData(form)));
      } catch (err) {
        this.#mostrarError(form, err.message);
        boton.disabled = false;
      }
    });
  }

  async #entrar(datos) {
    const { token, user } = await api.auth.login(datos.email, datos.password);
    sesion.guardar(token, user);
    location.href = this.#destinoVolver ?? (user.role === 'admin' ? 'admin.html' : '../index.html');
  }

  async #registrar(datos) {
    // Mismas reglas que el backend: se avisa sin enviar nada si no se cumplen
    if (!datos.username.trim() || !datos.email.trim() || !datos.password) {
      throw new Error('Todos los campos son obligatorios.');
    }
    if (datos.password.length < 8 || datos.password.length > 72) {
      throw new Error('La contraseña debe tener entre 8 y 72 caracteres.');
    }
    await api.auth.registrar({ ...datos, username: datos.username.trim(), email: datos.email.trim() });
    // Después de crear la cuenta se inicia sesión sola
    const { token, user } = await api.auth.login(datos.email, datos.password);
    sesion.guardar(token, user);
    location.href = this.#destinoVolver ?? '../index.html';
  }
}

new PaginaLogin().iniciar();
