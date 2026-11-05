import { Dialogos } from '../utils/Dialogos.js';
import { Paginador } from '../utils/Paginador.js';
import { Estados } from '../utils/ui.js';

// Base de las pestañas del panel de administración. Cada pestaña hereda de aquí y define:
//   - pintar(): dibuja su lista
//   - acciones(): botones que maneja, por el valor de su data-accion
// Esta clase se encarga de los clics, la paginación y de avisar si algo falla.
export class Panel {
  #raiz;
  #lista;
  #pagina = 1;
  #alCambiar;

  // alCambiar: qué volver a pintar cuando algo cambia (por defecto, solo esta pestaña)
  constructor(idRaiz, idLista, { alCambiar } = {}) {
    this.#raiz = document.getElementById(idRaiz);
    this.#lista = document.getElementById(idLista);
    this.#alCambiar = alCambiar;
    this.#raiz.addEventListener('click', (e) => this.#alHacerClic(e));
    new Paginador(this.#raiz, (dir) => {
      this.#pagina += dir;
      this.pintar();
    });
  }

  get lista() {
    return this.#lista;
  }

  get pagina() {
    return this.#pagina;
  }

  pintar() {
    throw new Error(`${this.constructor.name} debe implementar pintar()`);
  }

  acciones() {
    return {};
  }

  volverAlPrincipio() {
    this.#pagina = 1;
  }

  // Si se borró lo último de la página, se retrocede una. Devuelve true si retrocedió.
  retrocederSiHaceFalta(hayDatos) {
    if (hayDatos || this.#pagina <= 1) return false;
    this.#pagina -= 1;
    return true;
  }

  // Muestra "Cargando…" y luego lo que dibuje `pintar`; si falla, muestra el error
  async cargar(pintar) {
    this.#lista.innerHTML = '<p class="state">Cargando…</p>';
    try {
      await pintar();
    } catch (e) {
      Estados.error(this.#lista, e.message);
    }
  }

  // Corre una acción y avisa si el backend la rechaza (por ejemplo, un 409)
  async ejecutar(accion, mensajeOk) {
    try {
      await accion();
      Dialogos.avisar(mensajeOk);
      await this.refrescar();
    } catch (e) {
      Dialogos.avisar(e.message, 'error');
    }
  }

  refrescar() {
    return this.#alCambiar ? this.#alCambiar() : this.pintar();
  }

  #alHacerClic(e) {
    const boton = e.target.closest('button');
    if (!boton || boton.disabled) return;
    const accion = this.acciones()[boton.dataset.accion];
    if (accion) {
      accion(Number(boton.dataset.id) || undefined, boton).catch((err) => Dialogos.avisar(err.message, 'error'));
    }
  }
}
