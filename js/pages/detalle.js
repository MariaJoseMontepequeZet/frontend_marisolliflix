import { montarDetalle } from '../utils/detallePelicula.js';

const id = new URLSearchParams(location.search).get('id');

montarDetalle(document.getElementById('detalle-raiz'), id, {
  alTitulo: (titulo) => { document.title = `${titulo} · MarisolliFlix`; },
});
