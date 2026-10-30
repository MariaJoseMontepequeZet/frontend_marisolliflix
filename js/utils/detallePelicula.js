import { getPelicula, crearResena, editarResena, borrarResena, reaccionar } from '../api/client.js';
import { getUsuario } from './auth.js';
import { escapeHTML, renderPoster, mostrarError, urlDetalle } from './ui.js';
import { abrirModal, confirmar, avisar } from './modal.js';

const TIPOS = { pelicula: 'Película', serie: 'Serie', anime: 'Anime' };
const ESTADOS = { pending: 'Pendiente de aprobación', rejected: 'Rechazada' };

const fecha = (iso) => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
// "Editada" si se cambió después de crearla (el backend actualiza updatedAt en cada edición)
const fueEditada = (r) => new Date(r.editada) - new Date(r.creada) > 1000;

function camposResena(r = {}) {
  const opciones = Array.from({ length: 10 }, (_, i) => i + 1)
    .map((n) => `<option value="${n}"${n === (r.rating ?? 8) ? ' selected' : ''}>${n}</option>`).join('');
  return `
    <label>Título <input type="text" name="title" maxlength="255" required value="${escapeHTML(r.titulo ?? '')}"></label>
    <label>Calificación (1 a 10) <select name="rating">${opciones}</select></label>
    <label>Comentario <textarea name="comment" rows="4" maxlength="1000" required>${escapeHTML(r.comentario ?? '')}</textarea></label>`;
}

const datosResena = (f) => ({ title: f.title.trim(), rating: Number(f.rating), comment: f.comment.trim() });

// Dibuja la información de una película y sus reseñas dentro de `raiz`.
// Sirve igual para la página de detalle y para la ventana emergente (enModal).
//   - alCambiar(): se llama cuando algo cambió (reseña publicada, editada, borrada o voto),
//     para que quien abrió la vista pueda refrescar sus listas.
//   - alTitulo(titulo): recibe el título cuando ya se conoce (para el título de la pestaña).
export function montarDetalle(raiz, id, { enModal = false, alCambiar = () => {}, alTitulo = () => {} } = {}) {
  raiz.innerHTML = `
    <div class="detalle-vista">
      <div data-zona="info" aria-live="polite"><p class="state">Cargando…</p></div>
      <section class="detalle-vista__resenas" data-zona="resenas" hidden>
        <h2 data-zona="titulo-resenas">Reseñas</h2>
        <div data-zona="form"></div>
        <ul class="resenas" data-zona="lista"></ul>
      </section>
    </div>`;
  const zona = (nombre) => raiz.querySelector(`[data-zona="${nombre}"]`);
  const info = zona('info');
  const seccionResenas = zona('resenas');
  const zonaForm = zona('form');
  const lista = zona('lista');

  let datos = null; // { pelicula, resenas } del último pedido al backend

  // Al iniciar sesión se vuelve a esta misma película (la página de detalle)
  const volverAqui = () => {
    const destino = new URL(urlDetalle(id), location.href);
    const base = location.pathname.includes('/pages/') ? '' : 'pages/';
    return `${base}login.html?volver=${encodeURIComponent(destino.pathname + destino.search)}`;
  };

  function renderInfo(p) {
    const estado = ESTADOS[p.estado]
      ? `<span class="badge badge--${escapeHTML(p.estado)}">${ESTADOS[p.estado]}</span>`
      : '';
    // No repetir "Anime · Anime": el tipo solo se muestra si no coincide con la categoría
    const tipo = TIPOS[p.tipo] ?? p.tipo;
    const tipoYCategoria = tipo.toLowerCase() === p.categoria.toLowerCase()
      ? escapeHTML(p.categoria)
      : `${escapeHTML(tipo)} · ${escapeHTML(p.categoria)}`;
    const nota = p.resenas ? `${p.rating.toFixed(1)} / 10` : '—';
    const ranking = p.resenas ? p.ranking.toFixed(1) : '—';
    const enlace = enModal
      ? `<a class="volver" href="${urlDetalle(id)}">Abrir en página completa ↗</a>`
      : '<a class="volver" href="listado.html">← Volver al catálogo</a>';
    info.innerHTML = `
      ${enlace}
      <article class="detalle">
        <div class="detalle__poster">${renderPoster(p)}</div>
        <div class="detalle__info">
          <${enModal ? 'h2' : 'h1'} class="detalle__titulo">${escapeHTML(p.titulo)}</${enModal ? 'h2' : 'h1'}>
          <p class="detalle__meta">${escapeHTML(String(p.anio))} · ${tipoYCategoria} ${estado}</p>
          <dl class="detalle__stats">
            <div><dt>Calificación</dt><dd>${nota}</dd></div>
            <div><dt>Reseñas</dt><dd>${p.resenas}</dd></div>
            <div><dt>Ranking</dt><dd>${ranking}</dd></div>
            <div><dt>Likes</dt><dd>${p.likes}</dd></div>
          </dl>
          <p class="detalle__desc">${escapeHTML(p.descripcion)}</p>
        </div>
      </article>`;
    alTitulo(p.titulo);
  }

  function renderZonaForm(usuario) {
    const { pelicula, resenas } = datos;
    if (!usuario) {
      zonaForm.innerHTML = `<p class="ayuda">Para escribir una reseña o votar, <a class="enlace" href="${volverAqui()}">inicia sesión</a>.</p>`;
    } else if (pelicula.estado !== 'approved') {
      zonaForm.innerHTML = '<p class="ayuda">Podrás reseñarla cuando un administrador la apruebe.</p>';
    } else if (resenas.some((r) => r.autor.id === usuario.id)) {
      zonaForm.innerHTML = '<p class="ayuda">Ya reseñaste esta película. Puedes editar o eliminar tu reseña más abajo.</p>';
    } else {
      zonaForm.innerHTML = `
        <form class="form form--resena" data-form-resena novalidate>
          <h3>Escribe tu reseña</h3>
          ${camposResena()}
          <p class="form__error" role="alert" hidden></p>
          <button class="btn" type="submit">Publicar reseña</button>
        </form>`;
    }
  }

  function renderResena(r, usuario) {
    const soyYo = usuario && r.autor.id === usuario.id;
    const votos = soyYo
      ? `<span class="voto voto--solo">👍 ${r.likes}</span><span class="voto voto--solo">👎 ${r.dislikes}</span>
         <button class="btn btn--sec btn--chico" data-accion="editar">Editar</button>
         <button class="btn btn--peligro btn--chico" data-accion="borrar">Eliminar</button>`
      : `<button class="voto" data-accion="like" aria-pressed="${r.miVoto === 1}" aria-label="Me gusta">👍 ${r.likes}</button>
         <button class="voto" data-accion="dislike" aria-pressed="${r.miVoto === -1}" aria-label="No me gusta">👎 ${r.dislikes}</button>`;
    return `
      <li class="resena${soyYo ? ' resena--propia' : ''}" data-id="${r.id}">
        <div class="resena__cab">
          <strong>${escapeHTML(r.autor.username)}</strong>
          ${soyYo ? '<span class="badge">Tu reseña</span>' : ''}
          <span class="resena__fecha">${fecha(r.creada)}${fueEditada(r) ? ' · editada' : ''}</span>
          <span class="resena__nota" aria-label="Calificación ${r.rating} de 10">★ ${r.rating}/10</span>
        </div>
        <h3 class="resena__titulo">${escapeHTML(r.titulo)}</h3>
        <p class="resena__texto">${escapeHTML(r.comentario)}</p>
        <div class="resena__pie">${votos}</div>
      </li>`;
  }

  function renderResenas(usuario) {
    const { resenas } = datos;
    zona('titulo-resenas').textContent = `Reseñas (${resenas.length})`;
    if (!resenas.length) {
      lista.innerHTML = '<li class="state state--empty">Todavía no hay reseñas. ¡Sé la primera persona en opinar!</li>';
      return;
    }
    // Tu reseña primero; el resto en el orden del backend (más recientes arriba)
    const ordenadas = [...resenas].sort((a, b) => Number(usuario && b.autor.id === usuario.id) - Number(usuario && a.autor.id === usuario.id));
    lista.innerHTML = ordenadas.map((r) => renderResena(r, usuario)).join('');
  }

  // silencioso: vuelve a pedir los datos sin tapar la pantalla (tras publicar, votar, editar o borrar)
  async function cargar({ silencioso = false } = {}) {
    if (!silencioso) {
      info.innerHTML = '<p class="state">Cargando…</p>';
      seccionResenas.hidden = true;
    }
    try {
      datos = await getPelicula(id);
    } catch (e) {
      mostrarError(info, e.message);
      seccionResenas.hidden = true;
      return;
    }
    const usuario = getUsuario();
    renderInfo(datos.pelicula);
    renderZonaForm(usuario);
    renderResenas(usuario);
    seccionResenas.hidden = false;
  }

  // Tras cambiar algo: se refresca esta vista y se avisa a quien la abrió
  async function recargarTrasCambio() {
    await cargar({ silencioso: true });
    alCambiar();
  }

  zonaForm.addEventListener('submit', async (e) => {
    const form = e.target.closest('[data-form-resena]');
    if (!form) return;
    e.preventDefault();
    const error = form.querySelector('.form__error');
    const boton = form.querySelector('[type="submit"]');
    error.hidden = true;
    boton.disabled = true;
    try {
      await crearResena(id, datosResena(Object.fromEntries(new FormData(form))));
      avisar('Reseña publicada.');
      await recargarTrasCambio();
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
      boton.disabled = false;
    }
  });

  lista.addEventListener('click', async (e) => {
    const boton = e.target.closest('[data-accion]');
    if (!boton) return;
    const resenaId = boton.closest('.resena').dataset.id;
    const resena = datos.resenas.find((r) => String(r.id) === resenaId);
    const accion = boton.dataset.accion;

    try {
      if (accion === 'like' || accion === 'dislike') {
        if (!getUsuario()) {
          avisar('Inicia sesión para votar.', 'error');
          return;
        }
        boton.disabled = true;
        await reaccionar(resenaId, accion);
        await recargarTrasCambio();
      } else if (accion === 'editar') {
        const guardado = await abrirModal({
          titulo: 'Editar tu reseña',
          cuerpo: camposResena(resena),
          alEnviar: (f) => editarResena(resenaId, datosResena(f)),
        });
        if (guardado) {
          avisar('Reseña actualizada.');
          await recargarTrasCambio();
        }
      } else if (accion === 'borrar') {
        const ok = await confirmar('¿Eliminar tu reseña? También se borrarán sus likes y dislikes.', { textoBoton: 'Eliminar', peligro: true });
        if (!ok) return;
        await borrarResena(resenaId);
        avisar('Reseña eliminada.');
        await recargarTrasCambio();
      }
    } catch (err) {
      avisar(err.message, 'error');
      boton.disabled = false;
    }
  });

  if (!/^[1-9]\d*$/.test(String(id ?? ''))) {
    mostrarError(info, 'Película no válida. Vuelve al catálogo y elige una.');
  } else {
    cargar();
  }
}
