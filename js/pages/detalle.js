import { DetallePelicula } from '../utils/DetallePelicula.js';

const id = new URLSearchParams(location.search).get('id');

new DetallePelicula(document.getElementById('detalle-raiz'), id, {
  alTitulo: (titulo) => { document.title = `${titulo} · MarisolliFlix`; },
}).montar();
