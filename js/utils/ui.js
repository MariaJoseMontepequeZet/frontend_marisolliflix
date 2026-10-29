export function escapeHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

export function renderCard(p) {
  const poster = p.imagen
    ? `<img src="${escapeHTML(p.imagen)}" alt="Póster de ${escapeHTML(p.titulo)}" loading="lazy">`
    : `<div class="card__placeholder" aria-hidden="true">${escapeHTML(p.titulo.charAt(0))}</div>`;
  return `
    <article class="card">
      ${poster}
      <div class="card__body">
        <h3 class="card__title">${escapeHTML(p.titulo)}</h3>
        <p class="card__meta">${escapeHTML(p.categoria)} · ${escapeHTML(String(p.anio))}</p>
        <span class="badge">★ ${p.rating.toFixed(1)}</span>
      </div>
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
