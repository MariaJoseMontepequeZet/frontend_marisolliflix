import { getPeliculas } from '../api/client.js';
import { CONFIG } from '../utils/config.js';
import { escapeHTML, textoRating, renderCard, mostrarCarga, mostrarVacio, mostrarError } from '../utils/ui.js';

const hero = document.getElementById('hero');
const top = document.getElementById('top-ranking');
const populares = document.getElementById('populares');

// Las películas sin sinopsis real traen un texto de relleno; no sirven para el hero
const tieneSinopsis = (p) => !/pendiente de agregar/i.test(p.descripcion ?? '');

// Mejor ranking primero; si empatan, gana la que tiene más reseñas, luego más likes y luego el título
const porRanking = (a, b) =>
  b.ranking - a.ranking || b.resenas - a.resenas || b.likes - a.likes || a.titulo.localeCompare(b.titulo, 'es');

// El badge de calificación solo se muestra si la película ya tiene reseñas
function renderHero(p) {
  const badge = p.resenas ? `<span class="badge">${textoRating(p)}</span>` : '';
  hero.innerHTML = `
    <div class="hero__content">
      ${badge}
      <h1>${escapeHTML(p.titulo)}</h1>
      <p>${escapeHTML(p.descripcion)}</p>
      <a class="btn" href="pages/listado.html">Explorar catálogo</a>
    </div>`;
}

async function init() {
  mostrarCarga(top, CONFIG.TOP_RANKING);
  mostrarCarga(populares, 6);
  try {
    // El backend ya ordena. Se piden de más las populares porque se descartan las que
    // no tienen reseñas y las que ya salieron en el Top 5.
    const [ranking, masPopulares] = await Promise.all([
      // Se piden más de 5 para poder desempatar aquí antes de recortar el Top
      getPeliculas({ sort: 'ranking', limit: CONFIG.TOP_RANKING * 4 }),
      getPeliculas({ sort: 'popularidad', limit: CONFIG.POPULARES + CONFIG.TOP_RANKING }),
    ]);
    if (!ranking.peliculas.length) {
      mostrarVacio(top);
      mostrarVacio(populares);
      return;
    }

    // Sin reseñas no hay ranking real: el orden sería arbitrario, así que solo cuentan las reseñadas
    const topLista = ranking.peliculas
      .filter((p) => p.resenas > 0)
      .sort(porRanking)
      .slice(0, CONFIG.TOP_RANKING);
    const yaMostradas = new Set(topLista.map((p) => p.id));
    const popularesLista = masPopulares.peliculas
      .filter((p) => p.resenas > 0 && !yaMostradas.has(p.id))
      .slice(0, CONFIG.POPULARES);

    // Destacada: la mejor del ranking con sinopsis real; si aún no hay reseñas, la primera
    // del catálogo con sinopsis (sin badge). Si ninguna tiene, se usa la primera que haya.
    const candidatas = [...topLista, ...ranking.peliculas];
    renderHero(candidatas.find(tieneSinopsis) ?? candidatas[0]);

    if (topLista.length) {
      top.innerHTML = topLista.map(renderCard).join('');
      top.removeAttribute('aria-busy');
    } else {
      mostrarVacio(top, 'Todavía no hay películas con reseñas. Abre una del catálogo y escribe la primera.');
    }

    if (popularesLista.length) {
      populares.innerHTML = popularesLista.map(renderCard).join('');
      populares.removeAttribute('aria-busy');
    } else {
      mostrarVacio(populares, topLista.length
        ? 'Cuando haya más reseñas, aquí aparecerán las películas más comentadas.'
        : 'Aquí aparecerán las películas más comentadas.');
    }
  } catch (e) {
    mostrarError(top, e.message);
    mostrarError(populares, e.message);
  }
}

init();
// Si se publicó o votó una reseña en la ventana, las tarjetas se actualizan
document.addEventListener('pelicula-cambiada', init);
