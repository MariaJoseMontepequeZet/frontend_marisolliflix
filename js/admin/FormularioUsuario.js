import { escapeHTML } from '../utils/ui.js';

// Campos y validación del formulario de usuarios (crear y editar)
export class FormularioUsuario {
  static NOMBRE_ROL = { user: 'Usuario', admin: 'Administrador' };

  // Sin usuario es el formulario de crear. Al editar la contraseña es opcional y,
  // si el admin se edita a sí mismo, no puede cambiar su propio rol (el backend lo rechaza).
  static campos({ usuario, esYo = false } = {}) {
    const editando = Boolean(usuario);
    const roles = Object.entries(FormularioUsuario.NOMBRE_ROL)
      .map(([valor, texto]) => `<option value="${valor}"${valor === (usuario?.role ?? 'user') ? ' selected' : ''}>${texto}</option>`)
      .join('');
    const rol = esYo
      ? '<p class="ayuda ayuda--chica">No puedes cambiar tu propio rol.</p>'
      : `<label>Rol <select name="role">${roles}</select></label>`;
    return `
      <label>Nombre de usuario <input type="text" name="username" maxlength="50" autocomplete="off" value="${escapeHTML(usuario?.username ?? '')}" required></label>
      <label>Correo <input type="email" name="email" maxlength="255" autocomplete="off" value="${escapeHTML(usuario?.email ?? '')}" required></label>
      <label>${editando ? 'Nueva contraseña (opcional, 8 a 72 caracteres)' : 'Contraseña (8 a 72 caracteres)'}
        <input type="password" name="password" maxlength="72" autocomplete="new-password"${editando ? '' : ' required'}>
      </label>
      ${rol}`;
  }

  // Revisa lo escrito y arma los datos para el backend. Al editar, lo que quedó vacío no se envía.
  static datos(crudo, { editando = false } = {}) {
    const datos = { username: crudo.username.trim(), email: crudo.email.trim() };
    if (!datos.username || !datos.email) throw new Error('El nombre de usuario y el correo son obligatorios.');

    const password = crudo.password ?? '';
    if (password || !editando) {
      if (password.length < 8 || password.length > 72) {
        throw new Error('La contraseña debe tener entre 8 y 72 caracteres.');
      }
      datos.password = password;
    }
    if (crudo.role) datos.role = crudo.role;
    return datos;
  }
}
