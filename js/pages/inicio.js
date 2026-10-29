import { getPeliculas } from '../api/client.js';
import { CONFIG } from '../utils/config.js';
import { escapeHTML, textoRating, renderCard, mostrarCarga, mostrarVacio, mostrarError } from '../utils/ui.js';

const hero = document.getElementById('hero');
const top = document.getElementById('top-ranking');
const populares = document.getElementById('populares');

function renderHero(p) {
  hero.innerHTML = `
    <div class="hero__content">
      <span class="badge">${textoRating(p)}</span>
      <h1>${escapeHTML(p.titulo)}</h1>
      <p>${escapeHTML(p.descripcion)}</p>
      <a class="btn" href="pages/listado.html">Explorar catálogo</a>
    </div>`;
}

async function init() {
  mostrarCarga(top, CONFIG.TOP_RANKING);
  mostrarCarga(populares, 6);
  try {
    // El backend ya ordena: no hace falta traer todo el catálogo
    const [ranking, masPopulares] = await Promise.all([
      getPeliculas({ sort: 'ranking', limit: CONFIG.TOP_RANKING }),
      getPeliculas({ sort: 'popularidad', limit: CONFIG.POPULARES }),
    ]);
    if (!ranking.peliculas.length) {
      mostrarVacio(top);
      mostrarVacio(populares);
      return;
    }

    renderHero(ranking.peliculas[0]);
    top.innerHTML = ranking.peliculas.map(renderCard).join('');
    populares.innerHTML = masPopulares.peliculas.map(renderCard).join('');
    top.removeAttribute('aria-busy');
    populares.removeAttribute('aria-busy');
  } catch (e) {
    mostrarError(top, e.message);
    mostrarError(populares, e.message);
  }
}

init();
