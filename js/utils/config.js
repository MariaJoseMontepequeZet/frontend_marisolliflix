// Configuración global del frontend.
export const CONFIG = {
  // En el servidor, el frontend y la API comparten dominio (/api/v1). En local
  // (localhost) la API corre en el puerto 3000.
  API_URL: ['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://localhost:3000/api/v1' : '/api/v1',
  PAGE_SIZE: 36, // 6 columnas x 6 filas
  TOP_RANKING: 5,
  POPULARES: 12, // dos filas de 6
};
