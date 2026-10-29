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
    const peliculas = await getPeliculas();
    if (!peliculas.length) {
      mostrarVacio(top);
      mostrarVacio(populares);
      return;
    }
    const porRanking = [...peliculas].sort((a, b) => b.ranking - a.ranking || b.resenas - a.resenas);
    const porPopularidad = [...peliculas].sort((a, b) => b.resenas - a.resenas || b.ranking - a.ranking);

    renderHero(porRanking[0]);
    top.innerHTML = porRanking.slice(0, CONFIG.TOP_RANKING).map(renderCard).join('');
    populares.innerHTML = porPopularidad.slice(0, CONFIG.POPULARES).map(renderCard).join('');
    top.removeAttribute('aria-busy');
    populares.removeAttribute('aria-busy');
  } catch (e) {
    mostrarError(top, e.message);
    mostrarError(populares, e.message);
  }
}

init();
