# MarisolliFlix · Frontend

Frontend en HTML, CSS y JavaScript (módulos ES).

## Estructura
- `index.html` — Inicio (hero, Top 5 por ranking, más populares)
- `pages/listado.html` — Listado con filtro por categoría, orden y paginación
- `js/api/client.js` — cliente de la API
- `js/utils/` — configuración y helpers de UI
- `js/mock/` — datos de ejemplo
- `css/styles.css` — estilos base

## Ejecutar
Los módulos ES requieren un servidor local (no abrir con doble clic):

    python -m http.server 5500

Abrir http://localhost:5500. En `js/utils/config.js` poner `USE_MOCK: false` para usar el backend real.

## Flujo de trabajo (Scrum)
Una rama por tarea: `feature/hu-XX-descripcion`, PR hacia `dev`.
