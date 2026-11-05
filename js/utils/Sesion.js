// Sesión del usuario guardada en el navegador (token JWT + datos básicos).
export class Sesion {
  static CLAVE = 'marisolliflix_sesion';

  leer() {
    try {
      return JSON.parse(localStorage.getItem(Sesion.CLAVE));
    } catch {
      return null;
    }
  }

  guardar(token, user) {
    try {
      localStorage.setItem(Sesion.CLAVE, JSON.stringify({ token, user }));
    } catch {
      // Sin almacenamiento (modo privado): la sesión dura solo mientras la página siga abierta
    }
  }

  cerrar() {
    try {
      localStorage.removeItem(Sesion.CLAVE);
    } catch {
      // nada que borrar
    }
  }

  // Cambia los datos del usuario sin tocar el token (por ejemplo, tras editar su perfil)
  actualizarUsuario(user) {
    const actual = this.leer();
    if (actual) this.guardar(actual.token, { ...actual.user, ...user });
  }

  get token() {
    return this.leer()?.token ?? null;
  }

  get usuario() {
    return this.leer()?.user ?? null;
  }

  get esAdmin() {
    return this.usuario?.role === 'admin';
  }
}

export const sesion = new Sesion();
