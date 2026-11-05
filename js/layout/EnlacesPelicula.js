// Clic en una película (card o botón "Ver"): se abre su información en una ventana emergente.
// Con Ctrl, Cmd, Shift o clic central se respeta el enlace normal (abrir en otra pestaña).
export class EnlacesPelicula {
  iniciar() {
    document.addEventListener('click', (e) => this.#alHacerClic(e));
  }

  async #alHacerClic(e) {
    const enlace = e.target.closest('[data-pelicula]');
    if (!enlace || e.defaultPrevented) return;
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const { VentanaPelicula } = await import('../utils/VentanaPelicula.js');
    VentanaPelicula.abrir(enlace.dataset.pelicula);
  }
}
