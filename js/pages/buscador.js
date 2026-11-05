const API = 'http://localhost:3000/api/v1'; // tu API usa /api/v1

const form = document.getElementById('formBuscar');
const contenedor = document.getElementById('resultados');
const mensaje = document.getElementById('mensaje');

// Llena el select con las categorías existentes
const cargarCategorias = async () => {
    try {
        const res = await fetch(`${API}/categories`); // tus rutas están en inglés
        const data = await res.json();
        const select = document.getElementById('categoria');
        const lista = Array.isArray(data) ? data : (data.data || data.categorias || []); // tu formato es { status, data }
        lista.forEach(cat => {
            const nombre = cat.name || cat.nombre; // la columna puede llamarse name
            const opt = document.createElement('option');
            opt.value = nombre;
            opt.textContent = nombre;
            select.appendChild(opt);
        });
    } catch {
        console.warn('No se pudieron cargar categorías');
    }
};

const renderizar = (peliculas) => {
    contenedor.innerHTML = '';
    if (!peliculas.length) {
        mensaje.textContent = 'No se encontraron películas con esos filtros.';
        return;
    }
    mensaje.textContent = `${peliculas.length} resultado(s)`;

    peliculas.forEach(p => {
        const card = document.createElement('article');
        card.className = 'card-pelicula';

        const titulo = document.createElement('h3');
        titulo.textContent = p.titulo;

        const info = document.createElement('p');
        info.textContent = `${p.categoria} · ${p.anio}`;

        const calif = Number(p.calificacion); // MySQL devuelve el ROUND como texto
        const estrellas = Math.round(calif);
        const rating = document.createElement('p');
        rating.textContent = `${'★'.repeat(estrellas)}${'☆'.repeat(5 - estrellas)} (${calif})`;

        card.append(titulo, info, rating);
        contenedor.appendChild(card);
    });
};

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    ['categoria', 'minRating', 'maxRating', 'anioDesde', 'anioHasta'].forEach(id => {
        const valor = document.getElementById(id).value.trim();
        if (valor) params.append(id, valor);
    });

    try {
        const res = await fetch(`${API}/movies/search?${params}`); // tu ruta nueva
        const data = await res.json();
        if (!res.ok) {
            mensaje.textContent = data.mensaje || data.errores?.map(e => e.msg).join(', ') || 'Error en la búsqueda';
            contenedor.innerHTML = '';
            return;
        }
        renderizar(data.data); // el controller devuelve { status, total, data }
    } catch {
        mensaje.textContent = 'Error de conexión con el servidor.';
    }
});

cargarCategorias();