import { montarDetalle } from './detallePelicula.js';

// Abre la información de una película en una ventana emergente (<dialog>).
// Cualquier persona puede verla; con sesión también puede reseñar y votar.
// Si algo cambió dentro (reseña o voto), al cerrar se avisa con el evento "pelicula-cambiada"
// para que Inicio y Listado refresquen sus tarjetas.
export function abrirPelicula(id) {
  const dialog = document.createElement('dialog');
  dialog.className = 'modal modal--pelicula';
  dialog.setAttribute('aria-label', 'Información de la película');
  dialog.innerHTML = `
    <button type="button" class="modal__cerrar" aria-label="Cerrar">×</button>
    <div class="modal__contenido"></div>`;
  document.body.append(dialog);

  let hubo = false;
  montarDetalle(dialog.querySelector('.modal__contenido'), id, {
    enModal: true,
    alCambiar: () => { hubo = true; },
  });

  dialog.querySelector('.modal__cerrar').addEventListener('click', () => dialog.close());
  // Clic en el fondo oscuro (fuera de la ventana) también cierra
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    dialog.remove();
    if (hubo) document.dispatchEvent(new CustomEvent('pelicula-cambiada'));
  });
  dialog.showModal();
}
