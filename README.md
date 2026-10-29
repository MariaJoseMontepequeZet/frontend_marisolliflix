# MarisolliFlix · Frontend

Frontend en HTML, CSS y JavaScript (módulos ES).

## Estructura
- `index.html` — Inicio (hero, Top 5 por ranking, más populares)
- `pages/listado.html` — Listado con filtro por categoría, orden y paginación
- `js/api/client.js` — cliente de la API
- `js/utils/` — configuración y helpers de UI
- `css/styles.css` — estilos base

## Ejecutar
Los módulos ES requieren un servidor local (no abrir con doble clic):

    python -m http.server 5500

Abrir http://localhost:5500 (el puerto debe coincidir con `FRONT_URL` del backend por CORS).
El backend debe estar corriendo en `http://localhost:3000` (`API_URL` en `js/utils/config.js`).

Nota: la API aún no soporta ordenar; el ranking, la popularidad y la paginación se calculan
en el frontend sobre las primeras 100 películas aprobadas.

## Flujo de trabajo (Scrum)
Una rama por tarea: `feature/hu-XX-descripcion`, PR hacia `dev`.
