# MarisolliFlix · Frontend

Interfaz web de **MarisolliFlix**, una app para registrar, calificar y rankear películas, animes y series geek. Consume la API REST del backend: [backend_marisolliflix](https://github.com/MariaJoseMontepequeZet/backend_marisolliflix).

Sitio publicado: https://marisolliflix.pamcing.me

## Tecnologías

- HTML, CSS y JavaScript puro (módulos ES). Sin frameworks ni librerías de interfaz.
- Imágenes de portada en JPG y WebP (con `srcset`).
- Todo se sirve como archivos estáticos.

## Pantallas

| Pantalla | Archivo | Quién la usa |
|---|---|---|
| Inicio: portada destacada, Top 5 por ranking y más populares | `index.html` | Todos |
| Listado de películas: búsqueda, filtro por categoría, orden y paginación | `pages/listado.html` | Todos |
| Detalle de película: sinopsis, trailer, dónde ver, nota de IMDb y reseñas | ventana emergente (desde cualquier tarjeta) y `pages/detalle.html` | Todos; reseñar y votar requiere sesión |
| Entrar y crear cuenta | `pages/login.html` | Visitantes |
| Mi lista: películas guardadas para ver después | `pages/mi-lista.html` | Usuarios con sesión |
| Proponer una película (queda pendiente de aprobación) | `pages/proponer.html` | Usuarios con sesión |
| Panel de administración: categorías, películas y pendientes | `pages/admin.html` | Solo administradores |

Qué se puede hacer:

- **Reseñas:** crear, editar y eliminar la propia (título, comentario y calificación de 1 a 10), con like y dislike a las de otros (no a las propias).
- **Ranking:** el orden, el filtro por categoría, la búsqueda y la paginación los resuelve el backend (`?sort=`, `?categoryId=`, `?q=`, `?page=`, `?limit=`). El inicio pide `sort=ranking` (Top 5) y `sort=popularidad`.
- **Errores y validaciones:** los mensajes de validación o error que devuelve el backend se muestran en pantalla.
- **Accesibilidad y móvil:** diseño responsive con menú hamburguesa, foco visible con teclado y respeto a `prefers-reduced-motion`.

## Cómo ejecutarlo

Necesita el backend corriendo (ver su README). Los módulos ES requieren un servidor local; no se puede abrir con doble clic:

```bash
python -m http.server 5500
```

Abre http://localhost:5500. El puerto debe coincidir con `FRONT_URL` del backend (por CORS).

`API_URL` (en `js/utils/config.js`) se elige sola: en `localhost` usa el backend local (`http://localhost:3000/api/v1`) y en el servidor usa `/api/v1` (mismo dominio).

## Estructura

```
index.html            # inicio
pages/                # listado, detalle, login, mi-lista, proponer, admin
js/
├── main.js           # menú, buscador, pie de página y apertura de la ventana de película
├── api/client.js     # cliente de la API (único lugar que llama a fetch)
├── pages/            # un módulo por pantalla
└── utils/            # configuración, sesión (auth.js), modales, formularios, trailer y dónde ver, helpers de interfaz
css/styles.css        # estilos y paleta
assets/img/           # portadas (JPG y WebP), iconos e imagen para compartir (og.jpg)
```

La sesión (token y usuario) se guarda en `localStorage` con la clave `marisolliflix_sesion`, y el token se envía en `Authorization: Bearer <token>` en las rutas protegidas.

## Seguridad del sitio

El servidor publica el frontend con una política de contenido (CSP) estricta, así que el código respeta estas reglas:

- No se escribe `style="..."` ni `onclick="..."` en el HTML, ni scripts en línea. Un estilo dinámico se asigna desde JavaScript (`elemento.style.propiedad = ...`).
- Todo texto que viene de la API o de un usuario se escapa antes de ponerse en el HTML (`escapeHTML`).
- Los enlaces externos llevan `rel="noopener noreferrer"`.
- El trailer se muestra con el reproductor `youtube-nocookie.com`, que la política permite con `frame-src`. Si se agrega otro servicio externo (scripts, imágenes, iframes), hay que permitirlo también en la CSP del servidor.

## Imágenes

- Cada portada vive en tres archivos: `nombre.jpg` (respaldo), `nombre.webp` (400 px) y `nombre-sm.webp` (220 px, para las tarjetas).
- `og.jpg` es la imagen que aparece al compartir el enlace (WhatsApp, Discord...). Pesa unos 100 KB a propósito: WhatsApp descarta las imágenes de vista previa de más de ~300 KB. Las páginas la piden como `og.jpg?v=3`: si se cambia la imagen, hay que subir el número (`?v=4`) en las etiquetas `og:image` para que Cloudflare y las aplicaciones de mensajería la vuelvan a descargar. WhatsApp guarda la vista previa de cada enlace; para ver una nueva, comparte el enlace con un parámetro distinto (por ejemplo `https://marisolliflix.pamcing.me/?v=4`).

## Despliegue

Al hacer push a `main`, el workflow `.github/workflows/desplegar.yml` (en un runner propio del servidor) copia el código a `~/marisolliflix/frontend_marisolliflix` y ejecuta `desplegar.sh web`. A mano, en el servidor:

```bash
git -C ~/marisolliflix/frontend_marisolliflix pull
~/marisolliflix/desplegar.sh web
```

El sitio pasa por Cloudflare: después de desplegar, si se ve una versión vieja, hay que purgar su caché.

## Créditos

- Sinopsis: [Wikipedia en español](https://es.wikipedia.org) (CC BY-SA 4.0).
- Portadas: TMDB.
- Calificaciones de IMDb: se muestran solo como referencia externa.

## Flujo de trabajo (Scrum)

Una rama por tarea (`feature/hu-XX-descripcion`, `fix/...`, `docs/...`) y PR hacia `dev`; de `dev` a `main` al cerrar el sprint.
