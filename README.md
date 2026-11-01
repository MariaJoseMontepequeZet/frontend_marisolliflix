# MarisolliFlix · Frontend

Interfaz web de **MarisolliFlix**, una app para registrar, calificar y rankear películas, animes y series geek. Está hecha en **HTML, CSS y JavaScript puro** (sin frameworks ni librerías de interfaz) y consume la API REST del backend.

| | |
|---|---|
| **Sitio publicado** | https://marisolliflix.pamcing.me |
| **Repositorio del backend** | https://github.com/MariaJoseMontepequeZet/backend_marisolliflix |
| **Documentación de la API (Swagger)** | https://marisolliflix.pamcing.me/api/v1/docs |
| **Video** | [https://marisolliflix.pamcing.me/api/v1/docs](https://drive.google.com/drive/folders/1fWOdx8Gpee_4csEE-WjLwmUCvh51XfC4?usp=drive_link) |

## Contenido

1. [Qué hace](#qué-hace)
2. [Pantallas](#pantallas)
3. [Tecnologías](#tecnologías)
4. [Cómo ejecutarlo](#cómo-ejecutarlo)
5. [Estructura](#estructura)
6. [Cómo consume la API](#cómo-consume-la-api)
7. [Sesión y permisos](#sesión-y-permisos)
8. [Diseño y accesibilidad](#diseño-y-accesibilidad)
9. [Seguridad del sitio](#seguridad-del-sitio)
10. [Imágenes](#imágenes)
11. [Cómo probarlo a mano](#cómo-probarlo-a-mano)
12. [Despliegue](#despliegue)
13. [Flujo de trabajo (Scrum)](#flujo-de-trabajo-scrum)
14. [Equipo y créditos](#equipo-y-créditos)

## Qué hace

| Rol | Puede |
|---|---|
| **Visitante** | Ver el inicio (película destacada, Top 5 por ranking y más populares), buscar por título, explorar el listado con filtro por categoría, orden y paginación, y abrir el detalle de cada película con su sinopsis, trailer, plataformas, nota de IMDb y reseñas. Crear una cuenta o entrar. |
| **Usuario** (con sesión) | Todo lo anterior, más: escribir, editar y eliminar su reseña (calificación de 1 a 10), dar like o dislike a las de otros (no a la propia), guardar películas en **Mi lista** y proponer películas nuevas, que quedan pendientes de aprobación. |
| **Administrador** | Todo lo anterior, más el **panel de administración**: crear, editar y borrar categorías, editar y eliminar películas, y aprobar o rechazar las propuestas pendientes. |

El **orden**, el **filtro por categoría**, la **búsqueda** y la **paginación** los resuelve el backend (`?sort=`, `?categoryId=`, `?q=`, `?page=`, `?limit=`); el frontend solo los pide y los muestra. Los mensajes de validación o error que devuelve el backend se muestran en pantalla.

## Pantallas

| Pantalla | Archivo | Quién la usa |
|---|---|---|
| **Inicio:** portada destacada, Top 5 por ranking y más populares | `index.html` | Todos |
| **Listado de películas:** búsqueda, filtro por categoría, orden y paginación (36 por página, 6 por fila) | `pages/listado.html` | Todos |
| **Detalle de película:** ventana emergente al pulsar cualquier tarjeta, y página completa | `pages/detalle.html?id=...` | Todos; reseñar y votar requiere sesión |
| **Entrar y crear cuenta** | `pages/login.html` | Visitantes |
| **Mi lista:** películas guardadas para ver después | `pages/mi-lista.html` | Usuarios con sesión |
| **Proponer una película** (con trailer y plataformas opcionales) | `pages/proponer.html` | Usuarios con sesión |
| **Panel de administración:** pestañas Categorías, Películas y Pendientes | `pages/admin.html` | Solo administradores |

Todas las páginas comparten el encabezado (logo, buscador y menú), que se adapta a la sesión, y el pie de página con los enlaces a los repositorios y a la documentación de la API.

## Tecnologías

- HTML, CSS y JavaScript puro con **módulos ES** (`import`/`export`).
- Sin frameworks, sin librerías de interfaz y sin proceso de compilación: todo se sirve como archivos estáticos.
- Portadas en JPG y WebP con `srcset`.
- Trailers con el reproductor de YouTube (`youtube-nocookie.com`).

## Cómo ejecutarlo

Necesita el **backend corriendo** (ver su README). Los módulos ES requieren un servidor local; no se puede abrir con doble clic:

```bash
git clone https://github.com/MariaJoseMontepequeZet/frontend_marisolliflix.git
cd frontend_marisolliflix
python -m http.server 5500
```

Abre http://localhost:5500. El puerto debe coincidir con `FRONT_URL` del backend (por CORS); si usas otro, cámbialo allá.

`API_URL` (en `js/utils/config.js`) se elige sola: en `localhost` o `127.0.0.1` usa el backend local (`http://localhost:3000/api/v1`) y en el servidor usa `/api/v1` (mismo dominio). Los demás valores también viven ahí: 36 tarjetas por página, Top 5 y 12 populares en el inicio.

## Estructura

```
index.html                # inicio
pages/                    # listado, detalle, login, mi-lista, proponer, admin
js/
├── main.js               # menú, buscador, pie de página y apertura de la ventana de película
├── api/client.js         # cliente de la API (el único lugar que llama a fetch)
├── pages/                # un módulo por pantalla (inicio, listado, detalle, login, miLista, proponer, admin)
└── utils/
    ├── config.js         # URL de la API y tamaños de página
    ├── auth.js           # sesión: guardar, leer y cerrar
    ├── ui.js             # tarjetas, portadas, mensajes de carga, vacío y error, escapeHTML
    ├── modal.js          # ventanas de confirmación y avisos
    ├── ventanaPelicula.js, detallePelicula.js  # detalle de película (ventana y página)
    ├── streaming.js      # trailer y "dónde ver"
    └── formPelicula.js   # formulario para proponer y editar películas
css/styles.css            # estilos y paleta
assets/img/               # portadas (JPG y WebP), iconos e imagen para compartir (og.jpg)
.github/workflows/        # despliegue automático
```

## Cómo consume la API

Todas las llamadas salen de `js/api/client.js`, que arma la URL, agrega el token cuando hace falta y traduce los errores del backend a mensajes legibles.

| Pantalla o acción | Endpoint |
|---|---|
| Listado, búsqueda, ranking y populares | `GET /movies` (con `sort`, `categoryId`, `q`, `page`, `limit`) |
| Detalle, con reseñas e `inWatchlist` | `GET /movies/:id` |
| Categorías (filtro y admin) | `GET /categories` · `POST`, `PUT`, `DELETE /categories/:id` |
| Registro y login | `POST /auth/register` · `POST /auth/login` |
| Reseñas | `POST /movies/:id/reviews` · `PUT`, `DELETE /reviews/:id` |
| Like y dislike | `POST /reviews/:id/reaction` |
| Mi lista | `GET /watchlist` · `POST`, `DELETE /watchlist/:movieId` |
| Proponer película | `POST /movies` |
| Administración de películas | `GET /movies?status=...` · `GET /movies/pending` · `PUT /movies/:id` · `PATCH /movies/:id/status` · `DELETE /movies/:id` |

La referencia completa de cada endpoint está en la documentación del backend.

## Sesión y permisos

- Al iniciar sesión, el token y los datos del usuario se guardan en `localStorage` con la clave `marisolliflix_sesion`. Se envía en el header `Authorization: Bearer <token>` en las rutas protegidas.
- Si la sesión cambia en otra pestaña (entrar, salir o cambiar de usuario), esta se entera sola: el menú se repinta y las pantallas que exigen sesión se recargan.
- **Salir** pide confirmación.
- `?volver=/ruta` lleva de vuelta a la página donde se pidió iniciar sesión; solo acepta rutas del propio sitio, nunca otra dirección.
- La pantalla de administración y la de proponer piden sesión; el backend es quien decide de verdad los permisos, y devuelve `401` o `403` si no corresponde.

## Diseño y accesibilidad

- **Responsive:** en pantallas de menos de 700 px el menú se convierte en hamburguesa, la portada del inicio se oculta y las tarjetas se reacomodan, sin desbordes.
- **Teclado:** foco visible (`:focus-visible`), menú y ventanas con `aria-expanded` y cierre con Escape, y las ventanas usan el elemento `<dialog>`.
- **Movimiento reducido:** se respeta `prefers-reduced-motion` (sin animaciones ni desplazamiento suave).
- **Estados claros:** cada lista muestra "cargando", "vacío" o el error del backend; los textos tienen un tamaño mínimo legible.
- **Compartir:** cada página tiene `description` y etiquetas Open Graph (el panel, el login y proponer llevan `noindex`).

## Seguridad del sitio

El servidor publica el frontend con una política de contenido (CSP) estricta, así que el código respeta estas reglas:

- No se escribe `style="..."` ni `onclick="..."` en el HTML, ni scripts en línea. Un estilo dinámico se asigna desde JavaScript (`elemento.style.propiedad = ...`).
- Todo texto que viene de la API o de un usuario se escapa antes de ponerse en el HTML (`escapeHTML`).
- Los enlaces externos llevan `rel="noopener noreferrer"`.
- El trailer usa el reproductor `youtube-nocookie.com`, que la política permite con `frame-src`. Si se agrega otro servicio externo (scripts, imágenes, iframes), hay que permitirlo también en la CSP del servidor.
- El token vive en `localStorage`; la CSP estricta y el escape del texto son la defensa contra XSS.

## Imágenes

- Cada portada vive en tres archivos: `nombre.jpg` (respaldo), `nombre.webp` (400 px) y `nombre-sm.webp` (220 px, para las tarjetas).
- `og.jpg` es la imagen que aparece al compartir el enlace (WhatsApp, Discord...). Pesa unos 100 KB a propósito: WhatsApp descarta las imágenes de vista previa de más de ~300 KB. Las páginas la piden como `og.jpg?v=3`: si se cambia la imagen, hay que subir el número (`?v=4`) en las etiquetas `og:image` para que Cloudflare y las aplicaciones de mensajería la vuelvan a descargar.
- WhatsApp guarda la vista previa de cada enlace; para ver una nueva, comparte el enlace con un parámetro distinto (por ejemplo `https://marisolliflix.pamcing.me/?v=4`).

## Cómo probarlo a mano

Con el backend corriendo y datos cargados:

1. **Inicio:** se ve la portada destacada, el Top 5 y los más populares; el buscador está en el encabezado.
2. **Listado:** buscar un título, filtrar por categoría, cambiar el orden (incluido "Internet") y paginar.
3. **Detalle:** abrir una película; se ven la sinopsis, el trailer (o el enlace para buscarlo), "Dónde ver", la nota de IMDb y las reseñas.
4. **Registro:** con una contraseña de menos de 8 caracteres sale el aviso sin enviar nada; con una válida, inicia sesión sola.
5. **Reseñas:** escribir, editar y borrar la propia; dar like y dislike a otra (a la propia no deja).
6. **Mi lista:** guardar una película y verla en su página.
7. **Proponer:** enviar una película; queda pendiente.
8. **Administración:** con el administrador, aprobar la propuesta, y crear una categoría.
9. **Móvil:** reducir la ventana a 375 px: menú hamburguesa, sin desbordes.

## Despliegue

Al hacer push a `main`, el workflow `.github/workflows/desplegar.yml` (en un runner propio del servidor) copia el código a `~/marisolliflix/frontend_marisolliflix` y ejecuta `desplegar.sh web`, que reconstruye el servicio `web` (Caddy) y espera a que responda. En el servidor, el contenedor `web` sirve estos archivos y manda `/api/*` al backend.

A mano, en el servidor:

```bash
~/marisolliflix/desplegar.sh web
```

El sitio pasa por Cloudflare, que guarda en caché el CSS y el JavaScript: después de desplegar, si se ve una versión vieja, hay que purgar su caché (y el navegador puede tardar en refrescar los archivos; Ctrl+Shift+R lo fuerza).

## Flujo de trabajo (Scrum)

- Una rama por tarea (`feature/hu-XX-descripcion`, `fix/...`, `docs/...`, `chore/...`) y PR hacia `dev` con la plantilla de `.github/pull_request_template.md`.
- De `dev` a `main` al cerrar cada entrega; el merge a `main` despliega.
- Historias de usuario y sprints en ClickUp.
- El documento de planeación Scrum (roles, requerimientos, historias de usuario y sprints) está en [`docs/planeacion-scrum.pdf`](docs/planeacion-scrum.pdf).

## Equipo y créditos

| Integrante | Rol en el equipo |
|---|---|
| María José Montepeque | [completar: rol Scrum y tareas] |
| Allison Vargas | [completar: rol Scrum y tareas] |
| [completar] | [completar] |
| [completar] | [completar] |

- Sinopsis: [Wikipedia en español](https://es.wikipedia.org) (CC BY-SA 4.0).
- Portadas: TMDB.
- Calificaciones de IMDb: se muestran solo como referencia externa.
