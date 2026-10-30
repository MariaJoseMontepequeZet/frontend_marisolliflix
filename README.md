# MarisolliFlix · Frontend

Frontend en HTML, CSS y JavaScript (módulos ES).

## Estructura
- `index.html` — Inicio (hero, Top 5 por ranking, más populares)
- `pages/listado.html` — Listado con filtro por categoría, orden y paginación
- `pages/login.html` — Entrar y crear cuenta
- `pages/proponer.html` — Formulario para proponer una película (usuarios con sesión)
- `pages/admin.html` — Panel de administración con pestañas Categorías, Películas y Pendientes (solo admin)
- `js/api/client.js` — cliente de la API
- `js/utils/` — configuración, sesión (`auth.js`), modales y avisos (`modal.js`), formulario de película y helpers de UI
- `css/styles.css` — estilos base

## Ejecutar
Los módulos ES requieren un servidor local (no abrir con doble clic):

    python -m http.server 5500

Abrir http://localhost:5500 (el puerto debe coincidir con `FRONT_URL` del backend por CORS).
`API_URL` en `js/utils/config.js` se elige sola: en `localhost` usa el backend local (`http://localhost:3000/api/v1`) y en el servidor usa `/api/v1` (mismo dominio).

El orden, el filtro por categoría y la paginación los hace el backend (`?sort=`, `?categoryId=`, `?page=`, `?limit=`).
El inicio pide `sort=ranking` (Top 5) y `sort=popularidad` (más populares).

## Flujo de trabajo (Scrum)
Una rama por tarea: `feature/hu-XX-descripcion`, PR hacia `dev`.
