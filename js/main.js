import { Encabezado } from './layout/Encabezado.js';
import { PiePagina } from './layout/PiePagina.js';
import { EnlacesPelicula } from './layout/EnlacesPelicula.js';

// Lo que tienen en común todas las páginas
new Encabezado().iniciar();
new PiePagina().iniciar();
new EnlacesPelicula().iniciar();
