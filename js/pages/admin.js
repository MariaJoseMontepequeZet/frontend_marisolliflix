import {
  getCategorias, crearCategoria, editarCategoria, borrarCategoria,
  getPeliculasAdmin, getPendientes, proponerPelicula, editarPelicula, cambiarEstado, borrarPelicula,
} from '../api/client.js';
import { getUsuario, esAdmin } from '../utils/auth.js';
import { abrirModal, confirmar, avisar } from '../utils/modal.js';
import { camposPelicula, datosPelicula, NOMBRE_ESTADO, NOMBRE_TIPO } from '../utils/formPelicula.js';
import { escapeHTML, mostrarError } from '../utils/ui.js';

const $ = (id) => document.getElementById(id);

// Página actual de cada lista paginada y películas ya cargadas (para editarlas)
const paginas = { peliculas: 1, pendientes: 1 };
const cargadas = new Map();

async function cargar(contenedor, pintar) {
  contenedor.innerHTML = '<p class="state">Cargando…</p>';
  try {
    await pintar();
  } catch (e) {
    mostrarError(contenedor, e.message);
  }
}

function paginador({ page, pages }, lista) {
  if (pages <= 1) return '';
  return `<div class="paginacion">
    <button class="btn btn--sec" data-lista-dir="${lista}" data-dir="-1" ${page === 1 ? 'disabled' : ''}>Anterior</button>
    <span>Página ${page} de ${pages}</span>
    <button class="btn btn--sec" data-lista-dir="${lista}" data-dir="1" ${page === pages ? 'disabled' : ''}>Siguiente</button>
  </div>`;
}

function filaPelicula(p, acciones) {
  cargadas.set(p.id, p);
  return `<li class="fila">
    <div class="fila__info">
      <strong class="fila__titulo">${escapeHTML(p.titulo)}</strong>
      <span class="fila__meta">${escapeHTML(p.categoria)} · ${escapeHTML(NOMBRE_TIPO[p.tipo] ?? p.tipo)} · ${escapeHTML(String(p.anio))}
        <span class="badge badge--${escapeHTML(p.estado)}">${escapeHTML(NOMBRE_ESTADO[p.estado] ?? p.estado)}</span></span>
      <p class="fila__desc">${escapeHTML(p.descripcion)}</p>
    </div>
    <div class="fila__acciones">${acciones.map(([accion, texto, clase]) =>
      `<button class="btn ${clase}" data-accion="${accion}" data-id="${p.id}">${texto}</button>`).join('')}</div>
  </li>`;
}

const ACCIONES_PELICULA = [['ver-peli', 'Ver', 'btn--sec'], ['editar-peli', 'Editar', 'btn--sec'], ['borrar-peli', 'Eliminar', 'btn--peligro']];
const ACCIONES_PENDIENTE = [['ver-peli', 'Ver', 'btn--sec'], ['aprobar', 'Aprobar', ''], ['rechazar', 'Rechazar', 'btn--peligro']];

// ---- Pintar cada pestaña ----
function pintarCategorias() {
  const cont = $('lista-categorias');
  return cargar(cont, async () => {
    const categorias = await getCategorias();
    cont.innerHTML = categorias.length
      ? `<ul class="lista">${categorias.map((c) => `<li class="fila">
          <strong class="fila__titulo">${escapeHTML(c.name)}</strong>
          <div class="fila__acciones">
            <button class="btn btn--sec" data-accion="editar-cat" data-id="${c.id}" data-nombre="${escapeHTML(c.name)}">Editar</button>
            <button class="btn btn--peligro" data-accion="borrar-cat" data-id="${c.id}" data-nombre="${escapeHTML(c.name)}">Eliminar</button>
          </div></li>`).join('')}</ul>`
      : '<p class="state">Aún no hay categorías.</p>';
  });
}

async function pintarLista(clave, pedir, acciones, vacio) {
  const cont = $(`lista-${clave}`);
  await cargar(cont, async () => {
    const { peliculas, paginacion } = await pedir();
    // Si se borró lo último de la página, se retrocede una
    if (!peliculas.length && paginas[clave] > 1) {
      paginas[clave] -= 1;
      return pintarLista(clave, pedir, acciones, vacio);
    }
    if (clave === 'pendientes') {
      const contador = $('contador-pendientes');
      contador.textContent = paginacion.total;
      contador.hidden = !paginacion.total;
    }
    cont.innerHTML = peliculas.length
      ? `<ul class="lista">${peliculas.map((p) => filaPelicula(p, acciones)).join('')}</ul>${paginador(paginacion, clave)}`
      : `<p class="state">${vacio}</p>`;
    return undefined;
  });
}

const pintarPeliculas = () => pintarLista(
  'peliculas',
  () => getPeliculasAdmin({ page: paginas.peliculas, status: $('filtro-estado').value || undefined }),
  ACCIONES_PELICULA,
  'No hay películas con ese estado.'
);
const pintarPendientes = () => pintarLista(
  'pendientes',
  () => getPendientes({ page: paginas.pendientes }),
  ACCIONES_PENDIENTE,
  'No hay propuestas por revisar.'
);

// Un cambio en una película puede afectar a las dos listas
const refrescarPeliculas = () => Promise.all([pintarPeliculas(), pintarPendientes()]);

// Corre una acción y avisa si el backend la rechaza (por ejemplo, un 409)
async function ejecutar(accion, mensajeOk, refrescar) {
  try {
    await accion();
    avisar(mensajeOk);
    await refrescar();
  } catch (e) {
    avisar(e.message, 'error');
  }
}

// ---- Acciones ----
const campoNombre = (valor = '') =>
  `<label>Nombre <input type="text" name="name" maxlength="100" value="${escapeHTML(valor)}" required></label>`;

const ACCIONES = {
  async 'nueva-cat'() {
    const guardado = await abrirModal({
      titulo: 'Nueva categoría',
      cuerpo: campoNombre(),
      alEnviar: (d) => crearCategoria(d.name.trim()),
    });
    if (guardado) { avisar('Categoría creada.'); await pintarCategorias(); }
  },

  async 'editar-cat'(id, boton) {
    const guardado = await abrirModal({
      titulo: 'Editar categoría',
      cuerpo: campoNombre(boton.dataset.nombre),
      alEnviar: (d) => editarCategoria(id, d.name.trim()),
    });
    if (guardado) { avisar('Categoría actualizada.'); await pintarCategorias(); }
  },

  async 'borrar-cat'(id, boton) {
    if (await confirmar(`¿Eliminar la categoría "${boton.dataset.nombre}"?`, { textoBoton: 'Eliminar', peligro: true })) {
      await ejecutar(() => borrarCategoria(id), 'Categoría eliminada.', pintarCategorias);
    }
  },

  async 'nueva-peli'() {
    const categorias = await getCategorias();
    const guardado = await abrirModal({
      titulo: 'Nueva película o serie',
      cuerpo: camposPelicula(categorias),
      alEnviar: (d) => proponerPelicula(datosPelicula(d)),
    });
    if (guardado) { avisar('Película creada y aprobada.'); await refrescarPeliculas(); }
  },

  // La misma ventana emergente que ve cualquier visitante (el admin ve ademas las pendientes)
  async 'ver-peli'(id) {
    const { abrirPelicula } = await import('../utils/ventanaPelicula.js');
    abrirPelicula(id);
  },

  async 'editar-peli'(id) {
    const categorias = await getCategorias();
    const guardado = await abrirModal({
      titulo: 'Editar película',
      cuerpo: camposPelicula(categorias, cargadas.get(id), { conEstado: true }),
      alEnviar: (d) => editarPelicula(id, datosPelicula(d)),
    });
    if (guardado) { avisar('Película actualizada.'); await refrescarPeliculas(); }
  },

  async 'borrar-peli'(id) {
    const { titulo } = cargadas.get(id);
    if (await confirmar(`¿Eliminar "${titulo}"? Se borrarán también sus reseñas.`, { textoBoton: 'Eliminar', peligro: true })) {
      await ejecutar(() => borrarPelicula(id), 'Película eliminada.', refrescarPeliculas);
    }
  },

  async aprobar(id) {
    const { titulo } = cargadas.get(id);
    if (await confirmar(`¿Aprobar "${titulo}"? Aparecerá en el catálogo.`, { textoBoton: 'Aprobar' })) {
      await ejecutar(() => cambiarEstado(id, 'approved'), 'Película aprobada.', refrescarPeliculas);
    }
  },

  async rechazar(id) {
    const { titulo } = cargadas.get(id);
    if (await confirmar(`¿Rechazar "${titulo}"?`, { textoBoton: 'Rechazar', peligro: true })) {
      await ejecutar(() => cambiarEstado(id, 'rejected'), 'Película rechazada.', refrescarPeliculas);
    }
  },
};

const REPINTAR = { peliculas: pintarPeliculas, pendientes: pintarPendientes };

function conectar() {
  document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => {
      t.classList.toggle('active', t === tab);
      t.setAttribute('aria-selected', String(t === tab));
    });
    ['categorias', 'peliculas', 'pendientes'].forEach((nombre) => {
      $(`tab-${nombre}`).hidden = nombre !== tab.dataset.tab;
    });
  }));

  $('filtro-estado').addEventListener('change', () => { paginas.peliculas = 1; pintarPeliculas(); });

  $('panel-admin').addEventListener('click', (e) => {
    const boton = e.target.closest('button');
    if (!boton || boton.disabled) return;
    if (boton.dataset.dir) {
      const lista = boton.dataset.listaDir;
      paginas[lista] += Number(boton.dataset.dir);
      REPINTAR[lista]();
      return;
    }
    const accion = ACCIONES[boton.dataset.accion];
    if (accion) {
      accion(Number(boton.dataset.id) || undefined, boton).catch((err) => avisar(err.message, 'error'));
    }
  });
}

function init() {
  const aviso = $('aviso-acceso');
  if (!getUsuario()) {
    location.href = 'login.html';
    return;
  }
  if (!esAdmin()) {
    aviso.textContent = 'Solo los administradores pueden entrar aquí.';
    aviso.hidden = false;
    return;
  }
  $('panel-admin').hidden = false;
  conectar();
  pintarCategorias();
  pintarPeliculas();
  pintarPendientes();
}

init();
