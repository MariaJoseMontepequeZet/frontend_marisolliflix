import { api } from '../api/client.js';
import { sesion } from '../utils/Sesion.js';
import { FormularioPelicula } from '../utils/FormularioPelicula.js';
import { Dialogos } from '../utils/Dialogos.js';
import { Estados } from '../utils/ui.js';

// Formulario para proponer una película (queda pendiente hasta que un admin la apruebe)
class PaginaProponer {
  #form = document.getElementById('form-proponer');

  async iniciar() {
    if (!sesion.usuario) {
      location.href = 'login.html';
      return;
    }
    this.#form.addEventListener('submit', (e) => this.#enviar(e));
    try {
      const categorias = await api.categorias.listar();
      this.#form.innerHTML = `${FormularioPelicula.campos(categorias)}
        <p class="form__error" role="alert" hidden></p>
        <button class="btn" type="submit">Enviar propuesta</button>`;
    } catch (e) {
      Estados.error(this.#form, e.message);
    }
  }

  async #enviar(e) {
    e.preventDefault();
    const error = this.#form.querySelector('.form__error');
    const boton = this.#form.querySelector('[type="submit"]');
    if (!error) return;
    error.hidden = true;
    boton.disabled = true;
    try {
      await api.peliculas.proponer(FormularioPelicula.datos(Object.fromEntries(new FormData(this.#form))));
      this.#form.reset();
      Dialogos.avisar('Propuesta enviada. Un administrador la revisará.');
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
    } finally {
      boton.disabled = false;
    }
  }
}

new PaginaProponer().iniciar();
