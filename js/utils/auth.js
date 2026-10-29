// Sesión del usuario guardada en el navegador (token JWT + datos básicos).
const CLAVE = 'marisolliflix_sesion';

export function getSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE));
  } catch {
    return null;
  }
}

export function guardarSesion(token, user) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ token, user }));
  } catch {
    // Sin almacenamiento (modo privado): la sesión dura solo mientras la página siga abierta
  }
}

export function cerrarSesion() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // nada que borrar
  }
}

export const getToken = () => getSesion()?.token ?? null;
export const getUsuario = () => getSesion()?.user ?? null;
export const esAdmin = () => getUsuario()?.role === 'admin';
