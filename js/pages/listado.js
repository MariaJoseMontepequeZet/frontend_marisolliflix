import { getPeliculas, getCategorias } from '../api/client.js';
import { escapeHTML, renderCard, mostrarCarga, mostrarVacio, mostrarError } from '../utils/ui.js';
import { CONFIG } from '../utils/config.js';

const grid = document.getElementById('grid');
const filtro = document.getElementById('filtro-categoria');
const orden = document.getElementById('orden');
const paginacion = document.getElementById('paginacion');
const titulo = document.getElementById('titulo-listado');
const aviso = document.getElementById('aviso-orden');
const buscador = document.querySelector('.buscador');
const campoBusqueda = document.getElementById('buscar');

let pagina = 1;
let peticion = 0; // evita que una respuesta lenta pise a una más reciente
let espera = null; // temporizador para no pedir al backend en cada tecla

const textoBuscado = () => campoBusqueda.value.trim();

// La búsqueda queda en la dirección (listado.html?q=...) para poder compartirla o recargar
function actualizarUrl() {
  const url = new URL(location.href);
  if (textoBuscado()) url.searchParams.set('q', textoBuscado());
  else url.searchParams.delete('q');
  history.replaceState(null, '', url);
  titulo.textContent = textoBuscado() ? `Resultados para “${textoBuscado()}”` : 'Películas';
}

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
  aviso.hidden = true;
  paginacion.innerHTML = '';
  try {
    const { peliculas, paginacion: pag } = await getPeliculas({
      sort: orden.value,
      page: pagina,
      categoriaId: filtro.value || undefined,
      q: textoBuscado() || undefined,
    });
    if (actual !== peticion) return;

    if (!peliculas.length) {
      mostrarVacio(grid, textoBuscado()
        ? `No encontramos nada para “${textoBuscado()}”. Prueba con otro título o quita los filtros.`
        : undefined);
      return;
    }
    // Sin reseñas todas empatan en ranking y popularidad: se avisa por qué el orden parece alfabético
    const porResenas = ['ranking', 'popularidad'].includes(orden.value);
    aviso.hidden = !(porResenas && peliculas.every((p) => p.resenas === 0));
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
  actualizarUrl();
  cargar();
}

// Mientras se escribe se espera un momento antes de buscar; Enter busca de inmediato
campoBusqueda.addEventListener('input', () => {
  clearTimeout(espera);
  espera = setTimeout(() => { pagina = 1; actualizarUrl(); cargar(); }, 350);
});
buscador.addEventListener('submit', (e) => {
  e.preventDefault();
  clearTimeout(espera);
  pagina = 1;
  actualizarUrl();
  cargar();
});

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
