import { getPeliculas, getCategorias } from '../api/client.js';
import { CONFIG } from '../utils/config.js';
import { escapeHTML, renderCard, mostrarCarga, mostrarVacio, mostrarError } from '../utils/ui.js';

const grid = document.getElementById('grid');
const filtro = document.getElementById('filtro-categoria');
const orden = document.getElementById('orden');
const paginacion = document.getElementById('paginacion');

const ORDENES = {
  ranking: (a, b) => b.ranking - a.ranking || b.resenas - a.resenas,
  popularidad: (a, b) => b.resenas - a.resenas || b.ranking - a.ranking,
  titulo: (a, b) => a.titulo.localeCompare(b.titulo, 'es'),
  anio: (a, b) => b.anio - a.anio,
  reciente: (a, b) => new Date(b.creada) - new Date(a.creada),
};

let peliculas = [];
let pagina = 1;

function render() {
  const lista = peliculas
    .filter((p) => !filtro.value || p.categoriaId === Number(filtro.value))
    .sort(ORDENES[orden.value]);

  const totalPaginas = Math.max(1, Math.ceil(lista.length / CONFIG.PAGE_SIZE));
  pagina = Math.min(pagina, totalPaginas);

  if (!lista.length) {
    mostrarVacio(grid);
    paginacion.innerHTML = '';
    return;
  }

  const inicio = (pagina - 1) * CONFIG.PAGE_SIZE;
  grid.innerHTML = lista.slice(inicio, inicio + CONFIG.PAGE_SIZE).map(renderCard).join('');
  grid.removeAttribute('aria-busy');

  paginacion.innerHTML = `
    <button class="btn" data-dir="-1" ${pagina === 1 ? 'disabled' : ''}>Anterior</button>
    <span>Página ${pagina} de ${totalPaginas}</span>
    <button class="btn" data-dir="1" ${pagina === totalPaginas ? 'disabled' : ''}>Siguiente</button>`;
}

async function init() {
  mostrarCarga(grid, CONFIG.PAGE_SIZE);
  try {
    const [lista, categorias] = await Promise.all([getPeliculas(), getCategorias()]);
    peliculas = lista;
    filtro.innerHTML =
      '<option value="">Todas</option>' +
      categorias.map((c) => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('');
    render();
  } catch (e) {
    mostrarError(grid);
  }
}

filtro.addEventListener('change', () => { pagina = 1; render(); });
orden.addEventListener('change', () => { pagina = 1; render(); });
paginacion.addEventListener('click', (e) => {
  const dir = e.target.dataset.dir;
  if (!dir) return;
  pagina += Number(dir);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

init();
