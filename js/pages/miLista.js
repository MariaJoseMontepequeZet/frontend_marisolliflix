import { getMiLista, quitarDeLista } from '../api/client.js';
import { getUsuario } from '../utils/auth.js';
import { avisar } from '../utils/modal.js';
import { renderCard, mostrarCarga, mostrarVacio, mostrarError } from '../utils/ui.js';

const grid = document.getElementById('mi-lista');
const paginacion = document.getElementById('paginacion');
let pagina = 1;

function renderPaginacion({ page, pages }) {
  paginacion.innerHTML = pages <= 1 ? '' : `
    <button class="btn" data-dir="-1" ${page === 1 ? 'disabled' : ''}>Anterior</button>
    <span>Página ${page} de ${pages}</span>
    <button class="btn" data-dir="1" ${page === pages ? 'disabled' : ''}>Siguiente</button>`;
}

const tarjeta = (p) => `
  <div class="lista-item">
    ${renderCard(p)}
    <button type="button" class="btn btn--sec btn--chico" data-quitar="${p.id}">Quitar de mi lista</button>
  </div>`;

async function cargar() {
  mostrarCarga(grid, 6);
  paginacion.innerHTML = '';
  try {
    const { peliculas, paginacion: pag } = await getMiLista({ page: pagina });
    if (!peliculas.length && pagina > 1) {
      pagina -= 1;
      return cargar();
    }
    if (!peliculas.length) {
      mostrarVacio(grid, 'Todavía no guardas películas. Abre una del catálogo y pulsa "+ Mi lista".');
      return undefined;
    }
    grid.innerHTML = peliculas.map(tarjeta).join('');
    grid.removeAttribute('aria-busy');
    renderPaginacion(pag);
  } catch (e) {
    mostrarError(grid, e.message);
  }
  return undefined;
}

grid.addEventListener('click', async (e) => {
  const boton = e.target.closest('[data-quitar]');
  if (!boton) return;
  boton.disabled = true;
  try {
    await quitarDeLista(boton.dataset.quitar);
    avisar('Quitada de tu lista.');
    cargar();
  } catch (err) {
    avisar(err.message, 'error');
    boton.disabled = false;
  }
});

paginacion.addEventListener('click', (e) => {
  const dir = e.target.dataset.dir;
  if (!dir) return;
  pagina += Number(dir);
  cargar();
  window.scrollTo({ top: 0 });
});

if (!getUsuario()) {
  location.href = `login.html?volver=${encodeURIComponent(location.pathname)}`;
} else {
  cargar();
  document.addEventListener('pelicula-cambiada', cargar);
}
