import { CONFIG } from '../utils/config.js';
import { escapeHTML } from '../utils/ui.js';

// Pie de página con los enlaces a los repositorios y a la documentación de la API
export class PiePagina {
  iniciar() {
    if (document.querySelector('.footer')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <footer class="footer">
        <p><strong>MarisolliFlix</strong> · Proyecto académico para calificar y rankear películas, series y animes.</p>
        <p class="footer__enlaces">
          <a href="https://github.com/MariaJoseMontepequeZet/frontend_marisolliflix">Frontend</a>
          <a href="https://github.com/MariaJoseMontepequeZet/backend_marisolliflix">Backend</a>
          <a href="${escapeHTML(CONFIG.API_URL)}/docs/">Documentación de la API</a>
        </p>
        <p class="footer__creditos">Sinopsis: Wikipedia en español (CC BY-SA 4.0) · Portadas: TMDB</p>
      </footer>`);
  }
}
