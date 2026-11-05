import { escapeHTML } from './ui.js';
import { Streaming } from './Streaming.js';
import { sesion } from './Sesion.js';

// Formulario para proponer y editar películas (lo usan "Proponer" y el panel de administración).
export class FormularioPelicula {
  static NOMBRE_TIPO = { pelicula: 'Película', serie: 'Serie', anime: 'Anime' };
  static NOMBRE_ESTADO = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' };

  static #opciones(mapa, actual) {
    return Object.entries(mapa)
      .map(([valor, texto]) => `<option value="${valor}"${valor === actual ? ' selected' : ''}>${texto}</option>`)
      .join('');
  }

  // Campos del formulario. v trae los valores actuales al editar.
  // conEstado agrega el selector de estado (solo para el admin al editar).
  static campos(categorias, v = {}, { conEstado = false } = {}) {
    const categoriasHTML = categorias
      .map((c) => `<option value="${c.id}"${c.id === v.categoriaId ? ' selected' : ''}>${escapeHTML(c.name)}</option>`)
      .join('');
    const imdb = sesion.esAdmin
      ? `<label>Calificación en IMDb (1 a 10, opcional)
          <input type="number" name="imdbRating" min="1" max="10" step="0.1" value="${escapeHTML(v.imdb ?? '')}">
        </label>`
      : '';
    const estado = conEstado
      ? `<label>Estado <select name="status">${FormularioPelicula.#opciones(FormularioPelicula.NOMBRE_ESTADO, v.estado)}</select></label>`
      : '';
    return `
      <label>Título <input type="text" name="title" maxlength="255" value="${escapeHTML(v.titulo)}" required></label>
      <label>Descripción <textarea name="description" rows="4" required>${escapeHTML(v.descripcion)}</textarea></label>
      <label>Categoría
        <select name="categoryId" required>
          <option value="">Elige una categoría</option>${categoriasHTML}
        </select>
      </label>
      <div class="form__fila">
        <label>Año <input type="number" name="year" min="1888" max="${new Date().getFullYear() + 5}" value="${escapeHTML(v.anio)}" required></label>
        <label>Tipo <select name="type" required>${FormularioPelicula.#opciones(FormularioPelicula.NOMBRE_TIPO, v.tipo)}</select></label>
      </div>
      <label>Imagen (URL o ruta del sitio, opcional) <input type="text" name="imageUrl" maxlength="500" value="${escapeHTML(v.imagen)}"></label>
      ${imdb}
      ${Streaming.campos(v)}
      ${estado}`;
  }

  // Convierte lo que escribió el usuario al formato que espera el backend.
  // La imagen y el trailer vacíos se mandan como null (el backend rechaza un texto vacío).
  static datos(crudo) {
    const datos = {
      title: crudo.title.trim(),
      description: crudo.description.trim(),
      categoryId: crudo.categoryId ? Number(crudo.categoryId) : undefined,
      year: crudo.year ? Number(crudo.year) : undefined,
      type: crudo.type,
      imageUrl: crudo.imageUrl.trim() || null,
      ...Streaming.datos(crudo),
    };
    // Solo el formulario del admin trae este campo; vacío = sin calificación
    if (crudo.imdbRating !== undefined) datos.imdbRating = crudo.imdbRating === '' ? null : Number(crudo.imdbRating);
    if (crudo.status) datos.status = crudo.status;
    return datos;
  }
}
