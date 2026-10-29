import { escapeHTML } from './ui.js';

function crearDialog(html) {
  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  dialog.innerHTML = html;
  document.body.append(dialog);
  dialog.addEventListener('close', () => dialog.remove());
  dialog.showModal();
  return dialog;
}

// Modal de confirmación. Devuelve true solo si se pulsa el botón de confirmar
// (cancelar, Escape o cerrar devuelven false).
export function confirmar(mensaje, { textoBoton = 'Confirmar', peligro = false } = {}) {
  return new Promise((resolve) => {
    const dialog = crearDialog(`
      <form method="dialog" class="modal__caja">
        <p>${escapeHTML(mensaje)}</p>
        <div class="modal__acciones">
          <button class="btn btn--sec" value="no">Cancelar</button>
          <button class="btn${peligro ? ' btn--peligro' : ''}" value="si">${escapeHTML(textoBoton)}</button>
        </div>
      </form>`);
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'si'));
  });
}

// Modal con formulario. alEnviar recibe los datos del formulario; si lanza un error,
// el mensaje (el del backend) se muestra dentro del modal y se puede corregir y reenviar.
// Devuelve true si se guardó.
export function abrirModal({ titulo, cuerpo, textoBoton = 'Guardar', alEnviar }) {
  return new Promise((resolve) => {
    const dialog = crearDialog(`
      <form class="modal__caja form" novalidate>
        <h2>${escapeHTML(titulo)}</h2>
        ${cuerpo}
        <p class="form__error" role="alert" hidden></p>
        <div class="modal__acciones">
          <button type="button" class="btn btn--sec" data-cancelar>Cancelar</button>
          <button type="submit" class="btn">${escapeHTML(textoBoton)}</button>
        </div>
      </form>`);
    const form = dialog.querySelector('form');
    const error = form.querySelector('.form__error');
    const enviar = form.querySelector('[type="submit"]');
    let guardado = false;

    form.querySelector('[data-cancelar]').addEventListener('click', () => dialog.close());
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      error.hidden = true;
      enviar.disabled = true;
      try {
        await alEnviar(Object.fromEntries(new FormData(form)));
        guardado = true;
        dialog.close();
      } catch (err) {
        error.textContent = err.message;
        error.hidden = false;
        enviar.disabled = false;
      }
    });
    dialog.addEventListener('close', () => resolve(guardado));
  });
}

// Mensaje corto que se va solo. tipo: 'ok' | 'error'
export function avisar(mensaje, tipo = 'ok') {
  let zona = document.getElementById('avisos');
  if (!zona) {
    zona = document.createElement('div');
    zona.id = 'avisos';
    zona.setAttribute('aria-live', 'polite');
    document.body.append(zona);
  }
  const aviso = document.createElement('p');
  aviso.className = `aviso aviso--${tipo}`;
  aviso.textContent = mensaje;
  zona.append(aviso);
  setTimeout(() => aviso.remove(), 4000);
}
