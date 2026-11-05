import { api } from '../api/client.js';
import { sesion } from './Sesion.js';
import { escapeHTML, Texto, Tarjetas, Estados } from './ui.js';
import { Dialogos } from './Dialogos.js';
import { Streaming } from './Streaming.js';
import { FormularioResena } from './FormularioResena.js';

const TIPOS = { pelicula: 'Película', serie: 'Serie', anime: 'Anime' };
const ESTADOS = { pending: 'Pendiente de aprobación', rejected: 'Rechazada' };

const fecha = (iso) => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
// "Editada" si se cambió después de crearla (el backend actualiza updatedAt en cada edición)
const fueEditada = (r) => new Date(r.editada) - new Date(r.creada) > 1000;

// Dibuja la información de una película y sus reseñas dentro de `raiz`.
// Sirve igual para la página de detalle y para la ventana emergente (enModal).
//   - alCambiar(): se llama cuando algo cambió (reseña publicada, editada, borrada o voto),
//     para que quien abrió la vista pueda refrescar sus listas.
//   - alTitulo(titulo): recibe el título cuando ya se conoce (para el título de la pestaña).
export class DetallePelicula {
  #raiz;
  #id;
  #enModal;
  #alCambiar;
  #alTitulo;
  #datos = null; // { pelicula, resenas } del último pedido al backend
  #info;
  #seccionResenas;
  #zonaForm;
  #lista;

  constructor(raiz, id, { enModal = false, alCambiar = () => {}, alTitulo = () => {} } = {}) {
    this.#raiz = raiz;
    this.#id = id;
    this.#enModal = enModal;
    this.#alCambiar = alCambiar;
    this.#alTitulo = alTitulo;
  }

  montar() {
    this.#raiz.innerHTML = `
      <div class="detalle-vista">
        <div data-zona="info" aria-live="polite"><p class="state">Cargando…</p></div>
        <section class="detalle-vista__resenas" data-zona="resenas" hidden>
          <h2 data-zona="titulo-resenas">Reseñas</h2>
          <div data-zona="form"></div>
          <ul class="resenas" data-zona="lista"></ul>
        </section>
      </div>`;
    this.#info = this.#zona('info');
    this.#seccionResenas = this.#zona('resenas');
    this.#zonaForm = this.#zona('form');
    this.#lista = this.#zona('lista');
    this.#conectarEventos();

    if (!/^[1-9]\d*$/.test(String(this.#id ?? ''))) {
      Estados.error(this.#info, 'Película no válida. Vuelve al catálogo y elige una.');
    } else {
      this.#cargar();
    }
  }

  #zona(nombre) {
    return this.#raiz.querySelector(`[data-zona="${nombre}"]`);
  }

  // ---- Carga ----

  // silencioso: vuelve a pedir los datos sin tapar la pantalla (tras publicar, votar, editar o borrar)
  async #cargar({ silencioso = false } = {}) {
    if (!silencioso) {
      this.#info.innerHTML = '<p class="state">Cargando…</p>';
      this.#seccionResenas.hidden = true;
    }
    try {
      this.#datos = await api.peliculas.obtener(this.#id);
    } catch (e) {
      Estados.error(this.#info, e.message);
      this.#seccionResenas.hidden = true;
      return;
    }
    const usuario = sesion.usuario;
    this.#pintarInfo(this.#datos.pelicula);
    this.#pintarZonaForm(usuario);
    this.#pintarResenas(usuario);
    this.#seccionResenas.hidden = false;
  }

  // Tras cambiar algo: se refresca esta vista y se avisa a quien la abrió
  async #recargarTrasCambio() {
    await this.#cargar({ silencioso: true });
    this.#alCambiar();
  }

  // ---- Dibujo ----

  // Al iniciar sesión se vuelve a esta misma película (la página de detalle)
  #urlLogin() {
    const destino = new URL(Tarjetas.urlDetalle(this.#id), location.href);
    const base = location.pathname.includes('/pages/') ? '' : 'pages/';
    return `${base}login.html?volver=${encodeURIComponent(destino.pathname + destino.search)}`;
  }

  #pintarInfo(p) {
    const estado = ESTADOS[p.estado]
      ? `<span class="badge badge--${escapeHTML(p.estado)}">${ESTADOS[p.estado]}</span>`
      : '';
    // No repetir "Anime · Anime": el tipo solo se muestra si no coincide con la categoría
    const tipo = TIPOS[p.tipo] ?? p.tipo;
    const tipoYCategoria = tipo.toLowerCase() === p.categoria.toLowerCase()
      ? escapeHTML(p.categoria)
      : `${escapeHTML(tipo)} · ${escapeHTML(p.categoria)}`;
    // Sin reseñas no hay datos: las cuatro casillas muestran "—" con el mismo formato
    const hay = p.resenas > 0;
    const nota = hay ? `${p.rating.toFixed(1)} / 10` : '—';
    const cuantas = hay ? p.resenas : '—';
    const ranking = hay ? p.ranking.toFixed(1) : '—';
    const likes = hay ? p.likes : '—';
    const enlace = this.#enModal
      ? `<a class="volver" href="${Tarjetas.urlDetalle(this.#id)}">Abrir en página completa ↗</a>`
      : '<a class="volver" href="listado.html">← Volver al catálogo</a>';
    const etiqueta = this.#enModal ? 'h2' : 'h1';
    this.#info.innerHTML = `
      ${enlace}
      <article class="detalle">
        <div class="detalle__poster">${Tarjetas.poster(p, { prioridad: true, sizes: Tarjetas.SIZES_DETALLE })}</div>
        <div class="detalle__info">
          <${etiqueta} class="detalle__titulo">${escapeHTML(p.titulo)}</${etiqueta}>
          <p class="detalle__meta">${escapeHTML(String(p.anio))} · ${tipoYCategoria} ${estado}</p>
          ${p.estado === 'approved' ? this.#botonLista(p) : ''}
          <dl class="detalle__stats">
            <div><dt>Calificación</dt><dd>${nota}</dd></div>
            <div><dt>Reseñas</dt><dd>${cuantas}</dd></div>
            <div><dt>Ranking</dt><dd>${ranking}</dd></div>
            <div><dt>Likes</dt><dd>${likes}</dd></div>
            <div class="stat--imdb"><dt>IMDb</dt><dd>${p.imdb == null ? '—' : `${Texto.imdb(p)} / 10`}</dd></div>
          </dl>
          <p class="detalle__desc">${escapeHTML(p.descripcion)}</p>
          ${Streaming.renderDondeVer(p)}
        </div>
      </article>
      ${Streaming.renderTrailer(p)}`;
    this.#alTitulo(p.titulo);
  }

  #botonLista(p) {
    return `<button type="button" class="btn btn--lista${p.enLista ? ' btn--lista-activa' : ''}" data-lista aria-pressed="${p.enLista}">
      ${p.enLista ? '✓ En mi lista' : '+ Mi lista'}
    </button>`;
  }

  #pintarZonaForm(usuario) {
    const { pelicula, resenas } = this.#datos;
    if (!usuario) {
      this.#zonaForm.innerHTML = `<p class="ayuda">Para escribir una reseña o votar, <a class="enlace" href="${this.#urlLogin()}">inicia sesión</a>.</p>`;
    } else if (pelicula.estado !== 'approved') {
      this.#zonaForm.innerHTML = '<p class="ayuda">Podrás reseñarla cuando un administrador la apruebe.</p>';
    } else if (resenas.some((r) => r.autor.id === usuario.id)) {
      this.#zonaForm.innerHTML = '<p class="ayuda">Ya reseñaste esta película. Puedes editar o eliminar tu reseña más abajo.</p>';
    } else {
      this.#zonaForm.innerHTML = `
        <form class="form form--resena" data-form-resena novalidate>
          <h3>Escribe tu reseña</h3>
          ${FormularioResena.campos()}
          <p class="form__error" role="alert" hidden></p>
          <button class="btn" type="submit">Publicar reseña</button>
        </form>`;
    }
  }

  #htmlResena(r, usuario) {
    const soyYo = usuario && r.autor.id === usuario.id;
    const votos = soyYo
      ? `<span class="voto--solo" aria-label="${r.likes} me gusta">👍 ${r.likes}</span><span class="voto--solo" aria-label="${r.dislikes} no me gusta">👎 ${r.dislikes}</span>
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

  #pintarResenas(usuario) {
    const { resenas } = this.#datos;
    this.#zona('titulo-resenas').textContent = `Reseñas (${resenas.length})`;
    if (!resenas.length) {
      this.#lista.innerHTML = '<li class="state state--empty">Todavía no hay reseñas. ¡Sé la primera persona en opinar!</li>';
      return;
    }
    // Tu reseña primero; el resto en el orden del backend (más recientes arriba)
    const esMia = (r) => Number(Boolean(usuario) && r.autor.id === usuario.id);
    const ordenadas = [...resenas].sort((a, b) => esMia(b) - esMia(a));
    this.#lista.innerHTML = ordenadas.map((r) => this.#htmlResena(r, usuario)).join('');
  }

  // ---- Eventos ----

  #conectarEventos() {
    // Clic en la miniatura del trailer: se carga el reproductor
    this.#info.addEventListener('click', (e) => {
      const portada = e.target.closest('[data-trailer]');
      if (portada) Streaming.reproducirTrailer(portada);
      const lista = e.target.closest('[data-lista]');
      if (lista) this.#alternarLista(lista);
    });

    this.#zonaForm.addEventListener('submit', (e) => this.#publicarResena(e));
    this.#lista.addEventListener('click', (e) => this.#accionResena(e));

    // Si la sesión cambia en otra pestaña se vuelve a pintar (formulario, "Tu reseña", votos)
    const alCambiarSesion = () => {
      if (!this.#raiz.isConnected) {
        document.removeEventListener('sesion-cambiada', alCambiarSesion);
        return;
      }
      if (this.#datos) this.#cargar({ silencioso: true });
    };
    document.addEventListener('sesion-cambiada', alCambiarSesion);
  }

  async #alternarLista(boton) {
    if (!sesion.usuario) {
      Dialogos.avisar('Inicia sesión para guardar películas en tu lista.', 'error');
      return;
    }
    const p = this.#datos.pelicula;
    boton.disabled = true;
    try {
      if (p.enLista) await api.lista.quitar(this.#id);
      else await api.lista.agregar(this.#id);
      p.enLista = !p.enLista;
      boton.outerHTML = this.#botonLista(p);
      Dialogos.avisar(p.enLista ? 'Agregada a tu lista.' : 'Quitada de tu lista.');
      this.#alCambiar();
    } catch (err) {
      Dialogos.avisar(err.message, 'error');
      boton.disabled = false;
    }
  }

  async #publicarResena(e) {
    const form = e.target.closest('[data-form-resena]');
    if (!form) return;
    e.preventDefault();
    const error = form.querySelector('.form__error');
    const boton = form.querySelector('[type="submit"]');
    error.hidden = true;
    boton.disabled = true;
    try {
      await api.resenas.crear(this.#id, FormularioResena.validar(Object.fromEntries(new FormData(form))));
      Dialogos.avisar('Reseña publicada.');
      await this.#recargarTrasCambio();
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
      boton.disabled = false;
    }
  }

  async #accionResena(e) {
    const boton = e.target.closest('[data-accion]');
    if (!boton) return;
    const resenaId = boton.closest('.resena').dataset.id;
    const resena = this.#datos.resenas.find((r) => String(r.id) === resenaId);
    const { accion } = boton.dataset;

    try {
      if (accion === 'like' || accion === 'dislike') await this.#votar(boton, resenaId, accion);
      else if (accion === 'editar') await this.#editar(resena);
      else if (accion === 'borrar') await this.#borrar(resenaId);
    } catch (err) {
      Dialogos.avisar(err.message, 'error');
      boton.disabled = false;
    }
  }

  async #votar(boton, resenaId, tipo) {
    if (!sesion.usuario) {
      Dialogos.avisar('Inicia sesión para votar.', 'error');
      return;
    }
    boton.disabled = true;
    await api.resenas.reaccionar(resenaId, tipo);
    await this.#recargarTrasCambio();
  }

  async #editar(resena) {
    const guardado = await Dialogos.formulario({
      titulo: 'Editar tu reseña',
      cuerpo: FormularioResena.campos(resena),
      alEnviar: (f) => api.resenas.editar(resena.id, FormularioResena.validar(f)),
    });
    if (guardado) {
      Dialogos.avisar('Reseña actualizada.');
      await this.#recargarTrasCambio();
    }
  }

  async #borrar(resenaId) {
    const ok = await Dialogos.confirmar('¿Eliminar tu reseña? También se borrarán sus likes y dislikes.', { textoBoton: 'Eliminar', peligro: true });
    if (!ok) return;
    await api.resenas.borrar(resenaId);
    Dialogos.avisar('Reseña eliminada.');
    await this.#recargarTrasCambio();
  }
}
