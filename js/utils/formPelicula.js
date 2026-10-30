import { escapeHTML } from './ui.js';

export const NOMBRE_TIPO = { pelicula: 'Película', serie: 'Serie', anime: 'Anime' };
export const NOMBRE_ESTADO = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' };

const opciones = (mapa, actual) =>
  Object.entries(mapa)
    .map(([valor, texto]) => `<option value="${valor}"${valor === actual ? ' selected' : ''}>${texto}</option>`)
    .join('');

// Campos del formulario de película. v trae los valores actuales al editar.
// conEstado agrega el selector de estado (solo para el admin al editar).
export function camposPelicula(categorias, v = {}, { conEstado = false } = {}) {
  const categoriasHTML = categorias
    .map((c) => `<option value="${c.id}"${c.id === v.categoriaId ? ' selected' : ''}>${escapeHTML(c.name)}</option>`)
    .join('');
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
      <label>Tipo <select name="type" required>${opciones(NOMBRE_TIPO, v.tipo)}</select></label>
    </div>
    <label>Imagen (URL o ruta del sitio, opcional) <input type="text" name="imageUrl" maxlength="500" value="${escapeHTML(v.imagen)}"></label>
    ${conEstado ? `<label>Estado <select name="status">${opciones(NOMBRE_ESTADO, v.estado)}</select></label>` : ''}`;
}

// Convierte lo que escribió el usuario al formato que espera el backend.
// La imagen vacía se manda como null (el backend rechaza un texto vacío).
export function datosPelicula(crudo) {
  const datos = {
    title: crudo.title.trim(),
    description: crudo.description.trim(),
    categoryId: crudo.categoryId ? Number(crudo.categoryId) : undefined,
    year: crudo.year ? Number(crudo.year) : undefined,
    type: crudo.type,
    imageUrl: crudo.imageUrl.trim() || null,
  };
  if (crudo.status) datos.status = crudo.status;
  return datos;
}
