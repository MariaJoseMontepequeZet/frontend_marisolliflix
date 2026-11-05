// Único lugar que llama a fetch: arma la URL, agrega el token y traduce los errores del backend.
export class HttpClient {
  #urlBase;
  #sesion;

  constructor(urlBase, sesion) {
    this.#urlBase = urlBase;
    this.#sesion = sesion;
  }

  // auth: true envía el token de la sesión y exige tenerla; auth: 'opcional' lo envía solo
  // si hay sesión (así el backend sabe quién mira). Si el backend responde 401 con sesión
  // iniciada, el token venció o ya no sirve: se cierra la sesión.
  async pedir(ruta, { method = 'GET', body, auth = false } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = auth ? this.#sesion.token : null;
    if (auth === true && !token) throw new Error('Debes iniciar sesión.');
    if (token) headers.Authorization = `Bearer ${token}`;

    const respuesta = await this.#enviar(ruta, { method, headers, body });
    if (respuesta.status === 204) return null;
    if (!respuesta.ok) throw await this.#errorDe(respuesta, token);
    return respuesta.json();
  }

  async #enviar(ruta, { method, headers, body }) {
    try {
      return await fetch(`${this.#urlBase}${ruta}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new Error('No se pudo conectar con el servidor.');
    }
  }

  // El backend responde { status: 'error', message, errors? }
  async #errorDe(respuesta, token) {
    const cuerpo = await respuesta.json().catch(() => ({}));
    if (respuesta.status === 401 && token) {
      this.#sesion.cerrar();
      return new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
    }
    const detalle = (cuerpo.errors ?? []).map((e) => e.message).join(' · ');
    return new Error([cuerpo.message ?? `Error ${respuesta.status}`, detalle].filter(Boolean).join(': '));
  }
}
