import { getCategorias, proponerPelicula } from '../api/client.js';
import { getUsuario } from '../utils/auth.js';
import { camposPelicula, datosPelicula } from '../utils/formPelicula.js';
import { avisar } from '../utils/modal.js';
import { mostrarError } from '../utils/ui.js';

const form = document.getElementById('form-proponer');

async function init() {
  if (!getUsuario()) {
    location.href = 'login.html';
    return;
  }
  try {
    const categorias = await getCategorias();
    form.innerHTML = `${camposPelicula(categorias)}
      <p class="form__error" role="alert" hidden></p>
      <button class="btn" type="submit">Enviar propuesta</button>`;
  } catch (e) {
    mostrarError(form, e.message);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const error = form.querySelector('.form__error');
  const boton = form.querySelector('[type="submit"]');
  if (!error) return;
  error.hidden = true;
  boton.disabled = true;
  try {
    await proponerPelicula(datosPelicula(Object.fromEntries(new FormData(form))));
    form.reset();
    avisar('Propuesta enviada. Un administrador la revisará.');
  } catch (err) {
    error.textContent = err.message;
    error.hidden = false;
  } finally {
    boton.disabled = false;
  }
});

init();
