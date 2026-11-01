import { escapeHTML } from './ui.js';

// Plataformas que acepta el backend (mismo orden que en movieValidation.js)
export const PLATAFORMAS = {
  netflix: 'Netflix',
  prime: 'Prime Video',
  disney: 'Disney+',
  max: 'Max',
  appletv: 'Apple TV+',
  paramount: 'Paramount+',
  crunchyroll: 'Crunchyroll',
  vix: 'ViX',
  mubi: 'MUBI',
  youtube: 'YouTube',
  otra: 'Otra plataforma',
};

// Saca el id de 11 caracteres de un enlace de YouTube (watch?v=, youtu.be/, embed/ o shorts/)
export function idYoutube(url) {
  const m = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(url ?? '');
  return m ? m[1] : null;
}

// Trailer: si la película tiene uno registrado se muestra su miniatura y, al pulsarla,
// se carga el reproductor (así la ventana abre rápido aunque no se vea el trailer).
// Si no tiene, se ofrece buscarlo en YouTube.
export function renderTrailer(p) {
  const id = idYoutube(p.trailer);
  if (!id) {
    const busqueda = encodeURIComponent(`${p.titulo} ${p.anio} trailer español`);
    return `
      <section class="extra" aria-labelledby="trailer-${escapeHTML(String(p.id))}">
        <h2 class="extra__titulo" id="trailer-${escapeHTML(String(p.id))}">Trailer</h2>
        <a class="btn btn--sec" href="https://www.youtube.com/results?search_query=${busqueda}" target="_blank" rel="noopener noreferrer">
          ▶ Buscar el trailer en YouTube <span aria-hidden="true">↗</span>
        </a>
      </section>`;
  }
  return `
    <section class="extra" aria-labelledby="trailer-${escapeHTML(String(p.id))}">
      <h2 class="extra__titulo" id="trailer-${escapeHTML(String(p.id))}">Trailer</h2>
      <div class="trailer">
        <button type="button" class="trailer__portada" data-trailer="${id}" aria-label="Reproducir el trailer de ${escapeHTML(p.titulo)}">
          <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" decoding="async">
          <span class="trailer__play" aria-hidden="true">▶</span>
        </button>
      </div>
    </section>`;
}

// Reemplaza la miniatura por el reproductor de YouTube (sin cookies hasta reproducir)
export function reproducirTrailer(boton) {
  const id = boton.dataset.trailer;
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
  iframe.title = boton.getAttribute('aria-label').replace('Reproducir el', 'Reproductor:');
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  boton.replaceWith(iframe);
}

// "Dónde ver": un botón por plataforma que abre la película en ese servicio.
// Si todavía no se registró ninguna, solo se ofrece consultarlo en JustWatch (Guatemala).
export function renderStreaming(p) {
  const lista = Array.isArray(p.streaming) ? p.streaming : [];
  const botones = lista
    .filter((s) => PLATAFORMAS[s.platform] && /^https?:\/\//i.test(s.url))
    .map((s) => `
      <a class="plataforma plataforma--${escapeHTML(s.platform)}" href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">
        ${escapeHTML(PLATAFORMAS[s.platform])} <span aria-hidden="true">↗</span>
      </a>`)
    .join('');
  const justwatch = `https://www.justwatch.com/gt/buscar?q=${encodeURIComponent(p.titulo)}`;
  const cuerpo = botones
    ? `<div class="plataformas">${botones}</div>
       <p class="ayuda ayuda--chica">La disponibilidad cambia según el país. <a class="enlace" href="${justwatch}" target="_blank" rel="noopener noreferrer">Confirmar en JustWatch ↗</a></p>`
    : `<a class="btn btn--sec" href="${justwatch}" target="_blank" rel="noopener noreferrer">Buscar dónde verla en JustWatch <span aria-hidden="true">↗</span></a>`;
  return `
    <section class="extra" aria-labelledby="donde-${escapeHTML(String(p.id))}">
      <h2 class="extra__titulo" id="donde-${escapeHTML(String(p.id))}">Dónde ver</h2>
      ${cuerpo}
    </section>`;
}

// Campos del formulario de película para el trailer y las plataformas (admin y proponer).
// Cada plataforma es un campo de enlace: vacío = no está en esa plataforma.
export function camposStreaming(v = {}) {
  const enlaces = new Map((v.streaming ?? []).map((s) => [s.platform, s.url]));
  const filas = Object.entries(PLATAFORMAS)
    .map(([clave, nombre]) => `
      <label>${escapeHTML(nombre)}
        <input type="url" name="stream_${clave}" maxlength="500" placeholder="https://…" value="${escapeHTML(enlaces.get(clave) ?? '')}">
      </label>`)
    .join('');
  return `
    <label>Trailer (enlace de YouTube, opcional)
      <input type="url" name="trailerUrl" maxlength="500" placeholder="https://www.youtube.com/watch?v=…" value="${escapeHTML(v.trailer ?? '')}">
    </label>
    <details class="form__grupo"${enlaces.size ? ' open' : ''}>
      <summary>Dónde ver (opcional)</summary>
      <p class="ayuda ayuda--chica">Pega el enlace de la película en cada plataforma donde esté. Deja vacías las demás.</p>
      <div class="form__fila">${filas}</div>
    </details>`;
}

// Lee los campos anteriores y arma { trailerUrl, streaming } para el backend
export function datosStreaming(crudo) {
  const streaming = Object.keys(PLATAFORMAS)
    .map((platform) => ({ platform, url: (crudo[`stream_${platform}`] ?? '').trim() }))
    .filter((s) => s.url);
  return {
    trailerUrl: (crudo.trailerUrl ?? '').trim() || null,
    streaming,
  };
}
