// Botones "Anterior" y "Siguiente". Lo usan el listado, Mi lista y el panel de administración.
export class Paginador {
  // Escucha los clics dentro del contenedor y avisa hacia dónde se movió (-1 o 1)
  constructor(contenedor, alCambiar) {
    contenedor.addEventListener('click', (e) => {
      const boton = e.target.closest('[data-dir]');
      if (!boton || boton.disabled) return;
      alCambiar(Number(boton.dataset.dir));
    });
  }

  // Los botones para la página `page` de `pages`; vacío si solo hay una
  static html({ page, pages }, clase = 'btn') {
    if (pages <= 1) return '';
    return `
      <button class="${clase}" data-dir="-1" ${page === 1 ? 'disabled' : ''}>Anterior</button>
      <span>Página ${page} de ${pages}</span>
      <button class="${clase}" data-dir="1" ${page === pages ? 'disabled' : ''}>Siguiente</button>`;
  }
}
