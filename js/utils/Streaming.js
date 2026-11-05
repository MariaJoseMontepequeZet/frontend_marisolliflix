import { escapeHTML } from './ui.js';

// Trailer y "dónde ver" de una película, y los campos del formulario para registrarlos.
export class Streaming {
  // Plataformas que acepta el backend (mismo orden que en movieValidation.js)
  static PLATAFORMAS = {
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
  static idYoutube(url) {
    const m = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(url ?? '');
    return m ? m[1] : null;
  }

  // Trailer: si la película tiene uno registrado se muestra su miniatura y, al pulsarla,
  // se carga el reproductor (así la ventana abre rápido aunque no se vea el trailer).
  // Si no tiene, se ofrece buscarlo en YouTube.
  static renderTrailer(p) {
    const id = Streaming.idYoutube(p.trailer);
    const titulo = `trailer-${escapeHTML(String(p.id))}`;
    const cuerpo = id
      ? `<div class="trailer">
          <button type="button" class="trailer__portada" data-trailer="${id}" aria-label="Reproducir el trailer de ${escapeHTML(p.titulo)}">
            <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" decoding="async">
            <span class="trailer__play" aria-hidden="true">▶</span>
          </button>
        </div>`
      : `<a class="btn btn--sec" href="https://www.youtube.com/results?search_query=${encodeURIComponent(`${p.titulo} ${p.anio} trailer español`)}" target="_blank" rel="noopener noreferrer">
          ▶ Buscar el trailer en YouTube <span aria-hidden="true">↗</span>
        </a>`;
    return `
      <section class="extra" aria-labelledby="${titulo}">
        <h2 class="extra__titulo" id="${titulo}">Trailer</h2>
        ${cuerpo}
      </section>`;
  }

  // Reemplaza la miniatura por el reproductor de YouTube (sin cookies hasta reproducir)
  static reproducirTrailer(boton) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${boton.dataset.trailer}?autoplay=1&rel=0`;
    iframe.title = boton.getAttribute('aria-label').replace('Reproducir el', 'Reproductor:');
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    boton.replaceWith(iframe);
  }

  // "Dónde ver": un botón por plataforma que abre la película en ese servicio.
  // Si todavía no se registró ninguna, solo se ofrece consultarlo en JustWatch (Guatemala).
  static renderDondeVer(p) {
    const lista = Array.isArray(p.streaming) ? p.streaming : [];
    const botones = lista
      .filter((s) => Streaming.PLATAFORMAS[s.platform] && /^https?:\/\//i.test(s.url))
      .map((s) => `
        <a class="plataforma plataforma--${escapeHTML(s.platform)}" href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">
          ${escapeHTML(Streaming.PLATAFORMAS[s.platform])} <span aria-hidden="true">↗</span>
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
  static campos(v = {}) {
    const enlaces = new Map((v.streaming ?? []).map((s) => [s.platform, s.url]));
    const filas = Object.entries(Streaming.PLATAFORMAS)
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
  static datos(crudo) {
    const streaming = Object.keys(Streaming.PLATAFORMAS)
      .map((platform) => ({ platform, url: (crudo[`stream_${platform}`] ?? '').trim() }))
      .filter((s) => s.url);
    return {
      trailerUrl: (crudo.trailerUrl ?? '').trim() || null,
      streaming,
    };
  }
}
