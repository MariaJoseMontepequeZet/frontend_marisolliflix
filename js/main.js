// Marca el enlace activo de la navegación según la página actual.
const actual = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav a').forEach((a) => {
  if (a.getAttribute('href').split('/').pop() === actual) a.classList.add('active');
});
