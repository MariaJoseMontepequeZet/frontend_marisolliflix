import { getPeliculas, getCategorias } from '../api/client.js';
import { escapeHTML, renderCard, mostrarCarga, mostrarVacio, mostrarError } from '../utils/ui.js';
import { CONFIG } from '../utils/config.js';

const grid = document.getElementById('grid');
const filtro = document.getElementById('filtro-categoria');
const orden = document.getElementById('orden');
const paginacion = document.getElementById('paginacion');

let pagina = 1;
let peticion = 0; // evita que una respuesta lenta pise a una más reciente

function renderPaginacion({ page, pages }) {
  paginacion.innerHTML = pages <= 1 ? '' : `
    <button class="btn" data-dir="-1" ${page === 1 ? 'disabled' : ''}>Anterior</button>
    <span>Página ${page} de ${pages}</span>
    <button class="btn" data-dir="1" ${page === pages ? 'disabled' : ''}>Siguiente</button>`;
}

// Pide al backend la página actual con el filtro y el orden elegidos
async function cargar() {
  const actual = ++peticion;
  mostrarCarga(grid, CONFIG.PAGE_SIZE);
  paginacion.innerHTML = '';
  try {
    const { peliculas, paginacion: pag } = await getPeliculas({
      sort: orden.value,
      page: pagina,
      categoriaId: filtro.value || undefined,
    });
    if (actual !== peticion) return;

    if (!peliculas.length) {
      mostrarVacio(grid);
      return;
    }
    grid.innerHTML = peliculas.map(renderCard).join('');
    grid.removeAttribute('aria-busy');
    renderPaginacion(pag);
  } catch (e) {
    if (actual === peticion) mostrarError(grid, e.message);
  }
}

async function init() {
  try {
    const categorias = await getCategorias();
    filtro.innerHTML =
      '<option value="">Todas</option>' +
      categorias.map((c) => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('');
  } catch (e) {
    // Sin categorías el listado igual funciona, solo sin filtro
  }
  cargar();
}

filtro.addEventListener('change', () => { pagina = 1; cargar(); });
orden.addEventListener('change', () => { pagina = 1; cargar(); });
paginacion.addEventListener('click', (e) => {
  const dir = e.target.dataset.dir;
  if (!dir) return;
  pagina += Number(dir);
  cargar();
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: sinMovimiento ? 'auto' : 'smooth' });
});

init();
document.addEventListener('pelicula-cambiada', cargar);
