import { api } from '../api/client.js';
import { CONFIG } from '../utils/config.js';
import { escapeHTML, Texto, Tarjetas, Estados } from '../utils/ui.js';

// Página de inicio: película destacada, Top 5 por ranking y más populares
class PaginaInicio {
  #hero = document.getElementById('hero');
  #top = document.getElementById('top-ranking');
  #populares = document.getElementById('populares');

  iniciar() {
    this.#cargar();
    // Si se publicó o votó una reseña en la ventana, las tarjetas se actualizan
    document.addEventListener('pelicula-cambiada', () => this.#cargar());
  }

  // Las películas sin sinopsis real traen un texto de relleno; no sirven para el hero
  #tieneSinopsis(p) {
    return !/pendiente de agregar/i.test(p.descripcion ?? '');
  }

  // El badge de calificación solo se muestra si la película ya tiene reseñas
  #pintarHero(p) {
    const badge = p.resenas ? `<span class="badge">${Texto.rating(p)}</span>` : '';
    // La portada de la destacada se funde con el fondo del hero, sin marco
    // (el fondo se asigna por código más abajo: la política de seguridad del sitio no permite style="" en el HTML)
    const fondo = p.imagen ? '<div class="hero__fondo" aria-hidden="true"></div>' : '';
    const portada = p.imagen
      ? `<a class="hero__portada" href="${Tarjetas.urlDetalle(p.id)}" data-pelicula="${escapeHTML(String(p.id))}" aria-label="Ver ${escapeHTML(p.titulo)}">
          ${Tarjetas.poster(p, { prioridad: true, sizes: '(max-width: 700px) 0px, 320px' })}
        </a>`
      : '';
    this.#hero.innerHTML = `
      ${fondo}
      <div class="hero__content">
        ${badge}
        <h1>${escapeHTML(p.titulo)}</h1>
        <p>${escapeHTML(p.descripcion)}</p>
        <a class="btn" href="pages/listado.html">Explorar catálogo</a>
      </div>
      ${portada}`;
    const imagenFondo = this.#hero.querySelector('.hero__fondo');
    if (imagenFondo) imagenFondo.style.backgroundImage = `url("${p.imagen.replace(/"/g, '%22')}")`;
  }

  #pintarLista(contenedor, lista, mensajeVacio) {
    if (!lista.length) {
      Estados.vacio(contenedor, mensajeVacio);
      return;
    }
    contenedor.innerHTML = lista.map(Tarjetas.card).join('');
    contenedor.removeAttribute('aria-busy');
  }

  async #cargar() {
    Estados.cargando(this.#top, CONFIG.TOP_RANKING);
    Estados.cargando(this.#populares, 6);
    try {
      // El backend ya ordena (con desempate fijo, así que el Top no cambia). Se piden de más
      // las populares porque se descartan las que no tienen reseñas y las que ya salieron en el Top 5.
      const [ranking, masPopulares] = await Promise.all([
        api.peliculas.listar({ sort: 'ranking', limit: CONFIG.TOP_RANKING }),
        api.peliculas.listar({ sort: 'popularidad', limit: CONFIG.POPULARES + CONFIG.TOP_RANKING }),
      ]);
      if (!ranking.peliculas.length) {
        Estados.vacio(this.#top);
        Estados.vacio(this.#populares);
        return;
      }

      // Sin reseñas no hay ranking real: el orden sería arbitrario, así que solo cuentan las reseñadas
      const topLista = ranking.peliculas.filter((p) => p.resenas > 0);
      const yaMostradas = new Set(topLista.map((p) => p.id));
      const popularesLista = masPopulares.peliculas
        .filter((p) => p.resenas > 0 && !yaMostradas.has(p.id))
        .slice(0, CONFIG.POPULARES);

      // Destacada: la mejor del ranking con sinopsis real; si aún no hay reseñas, la primera
      // del catálogo con sinopsis (sin badge). Si ninguna tiene, se usa la primera que haya.
      const candidatas = [...topLista, ...ranking.peliculas];
      this.#pintarHero(candidatas.find((p) => this.#tieneSinopsis(p)) ?? candidatas[0]);

      this.#pintarLista(this.#top, topLista,
        'Todavía no hay películas con reseñas. Abre una del catálogo y escribe la primera.');
      this.#pintarLista(this.#populares, popularesLista, topLista.length
        ? 'Cuando haya más reseñas, aquí aparecerán las películas más comentadas.'
        : 'Aquí aparecerán las películas más comentadas.');
    } catch (e) {
      Estados.error(this.#top, e.message);
      Estados.error(this.#populares, e.message);
    }
  }
}

new PaginaInicio().iniciar();
