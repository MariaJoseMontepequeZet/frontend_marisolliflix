// Escapa también las comillas: se usa dentro de atributos (src="...", value="...").
const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHTML(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}

export function textoRating(p) {
  return p.resenas ? `★ ${p.rating.toFixed(1)}` : 'Sin reseñas';
}

// Dirección del detalle: desde /pages/ se enlaza sin prefijo; desde el inicio hace falta "pages/"
export function urlDetalle(id) {
  const base = location.pathname.includes('/pages/') ? '' : 'pages/';
  return `${base}detalle.html?id=${encodeURIComponent(id)}`;
}

export function renderPoster(p) {
  return p.imagen
    ? `<img src="${escapeHTML(p.imagen)}" alt="Póster de ${escapeHTML(p.titulo)}" loading="lazy">`
    : `<div class="card__placeholder" aria-hidden="true">${escapeHTML(p.titulo.charAt(0))}</div>`;
}

export function renderCard(p) {
  return `
    <article class="card">
      <a class="card__link" href="${urlDetalle(p.id)}" data-pelicula="${escapeHTML(String(p.id))}" aria-label="Ver ${escapeHTML(p.titulo)}">
        ${renderPoster(p)}
        <div class="card__body">
          <h3 class="card__title">${escapeHTML(p.titulo)}</h3>
          <p class="card__meta">${escapeHTML(p.categoria)} · ${escapeHTML(String(p.anio))}</p>
          <span class="badge">${textoRating(p)}</span>
        </div>
      </a>
    </article>`;
}

export function mostrarCarga(el, n = 6) {
  el.innerHTML = Array.from({ length: n }, () => '<div class="card card--skeleton" aria-hidden="true"></div>').join('');
  el.setAttribute('aria-busy', 'true');
}

export function mostrarVacio(el, mensaje = 'No se encontraron películas.') {
  el.innerHTML = `<p class="state state--empty">${escapeHTML(mensaje)}</p>`;
  el.removeAttribute('aria-busy');
}

export function mostrarError(el, mensaje = 'No se pudo cargar el contenido. Intenta de nuevo.') {
  el.innerHTML = `<p class="state state--error" role="alert">${escapeHTML(mensaje)}</p>`;
  el.removeAttribute('aria-busy');
}
