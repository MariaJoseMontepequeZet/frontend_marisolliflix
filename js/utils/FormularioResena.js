import { escapeHTML } from './ui.js';

// Campos y validación del formulario de reseñas
export class FormularioResena {
  static campos(r = {}) {
    // Sin valor por defecto: una nota preseleccionada sesga la calificación
    const vacia = `<option value=""${r.rating ? '' : ' selected'} disabled>Elige una calificación…</option>`;
    const opciones = Array.from({ length: 10 }, (_, i) => i + 1)
      .map((n) => `<option value="${n}"${n === r.rating ? ' selected' : ''}>${n}</option>`).join('');
    return `
      <label>Título <input type="text" name="title" maxlength="255" required value="${escapeHTML(r.titulo ?? '')}"></label>
      <label>Calificación (1 a 10) <select name="rating" required>${vacia}${opciones}</select></label>
      <label>Comentario <textarea name="comment" rows="4" maxlength="1000" required>${escapeHTML(r.comentario ?? '')}</textarea></label>`;
  }

  // El formulario no usa la validación nativa del navegador, así que se revisa aquí antes de enviar
  // (el backend también rechaza títulos y comentarios vacíos o solo con espacios).
  // Devuelve los datos listos para el backend o lanza un Error con el problema.
  static validar(crudo) {
    const datos = { title: crudo.title.trim(), rating: Number(crudo.rating), comment: crudo.comment.trim() };
    if (!datos.title) throw new Error('Escribe un título (no puede quedar vacío ni tener solo espacios).');
    if (!Number.isInteger(datos.rating) || datos.rating < 1 || datos.rating > 10) {
      throw new Error('Elige una calificación del 1 al 10.');
    }
    if (!datos.comment) throw new Error('Escribe un comentario (no puede quedar vacío ni tener solo espacios).');
    return datos;
  }
}
