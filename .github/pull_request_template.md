## Descripción

<!-- ¿Qué cambia este PR y por qué? -->

## Historia de usuario / Sprint

- Historia de usuario: <!-- enlace a la tarjeta en GitHub Projects / Trello / ClickUp -->
- Sprint: <!-- ej. Sprint 1 -->

## Tipo de cambio

- [ ] Nueva funcionalidad
- [ ] Corrección de error
- [ ] Estilos / UI
- [ ] Documentación
- [ ] Refactor

## Pantalla(s) afectada(s)

- [ ] Inicio
- [ ] Registro / Login
- [ ] Listado de películas
- [ ] Detalle de película
- [ ] Panel admin

## Checklist obligatorio

### Tecnología
- [ ] Solo HTML, CSS y JavaScript puro (sin frameworks ni librerías de UI).
- [ ] No se agregó código del backend a este repositorio.

### Consumo de la API
- [ ] Los datos se obtienen de los endpoints del backend (nada de datos quemados).
- [ ] La URL base de la API está centralizada (no repetida en cada archivo).
- [ ] El token JWT se envía en el header `Authorization: Bearer <token>` en las rutas protegidas.
- [ ] Se muestran en pantalla los mensajes de validación o error que devuelve el backend.

### Roles y permisos
- [ ] Las opciones de administrador (categorías, aprobar películas) solo se muestran a administradores.
- [ ] El usuario no puede dar like/dislike a sus propias reseñas.
- [ ] La calificación de las reseñas se limita a valores entre 1 y 10.

### Interfaz
- [ ] Es responsive (probado en móvil y escritorio).
- [ ] Las operaciones CRUD de la pantalla funcionan (crear, leer, actualizar, eliminar).
- [ ] No hay errores en la consola del navegador.

### Calidad
- [ ] El PR apunta a la rama `dev` (no directamente a `main`).
- [ ] Los commits tienen mensajes claros y descriptivos.
- [ ] Se actualizó el README si el cambio lo requiere.

## Cómo probarlo

1. <!-- pasos para verificar el cambio -->

## Capturas de pantalla

<!-- Adjunta capturas en escritorio y móvil si el cambio afecta la UI -->
