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

// Las portadas propias (/assets/img/portadas/nombre.jpg) tienen dos versiones WebP:
// nombre-sm.webp (220 px de ancho) y nombre.webp (400 px). El navegador elige la que
// necesita según el tamaño en pantalla y, si no soporta WebP, usa el JPG.
const PORTADA_PROPIA = /^(\/assets\/img\/portadas\/[a-z0-9-]+)\.jpg$/;
export const SIZES_CARD = '(max-width: 600px) 46vw, (max-width: 800px) 32vw, (max-width: 1100px) 24vw, 220px';
export const SIZES_DETALLE = '(max-width: 700px) 260px, 280px';

// prioridad: true carga la imagen de inmediato (la ventana de detalle); si no, es perezosa
// (las tarjetas que aún no se ven). width y height reservan el espacio y evitan saltos.
export function renderPoster(p, { prioridad = false, sizes = SIZES_CARD } = {}) {
  if (!p.imagen) {
    return `<div class="card__placeholder" aria-hidden="true">${escapeHTML(p.titulo.charAt(0))}</div>`;
  }
  const img = `<img src="${escapeHTML(p.imagen)}" alt="Póster de ${escapeHTML(p.titulo)}" width="400" height="600" loading="${prioridad ? 'eager' : 'lazy'}" decoding="async">`;
  const propia = PORTADA_PROPIA.exec(p.imagen);
  if (!propia) return img;
  return `<picture><source type="image/webp" srcset="${propia[1]}-sm.webp 220w, ${propia[1]}.webp 400w" sizes="${sizes}">${img}</picture>`;
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
