import { registrar, login } from '../api/client.js';
import { guardarSesion } from '../utils/auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tabs .tab');
  const formLogin = document.getElementById('form-login');
  const formRegistro = document.getElementById('form-registro');

  // Control de pestañas (Entrar / Crear cuenta)
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const modo = tab.dataset.modo;
      if (modo === 'login') {
        formLogin.hidden = false;
        formRegistro.hidden = true;
      } else {
        formLogin.hidden = true;
        formRegistro.hidden = false;
      }
    });
  });

  // Lógica de Registro (HU-01)
  if (formRegistro) {
    const errorDiv = formRegistro.querySelector('.form__error');

    formRegistro.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorDiv.hidden = true;
      errorDiv.textContent = '';

      const formData = new FormData(formRegistro);
      const username = formData.get('username').trim();
      const email = formData.get('email').trim();
      const password = formData.get('password');

      // 1. Validación en cliente
      if (!username || !email || !password) {
        errorDiv.textContent = 'Todos los campos son obligatorios.';
        errorDiv.hidden = false;
        return;
      }

      if (password.length < 8 || password.length > 72) {
        errorDiv.textContent = 'La contraseña debe tener entre 8 y 72 caracteres.';
        errorDiv.hidden = false;
        return;
      }

      try {
        // Petición al endpoint de registro
        await registrar({ username, email, password });

        // Redirigir o cambiar a la pestaña de login al registrarse con éxito
        alert('¡Cuenta creada con éxito! Por favor inicia sesión.');
        
        // Opcional: Cambiar automáticamente a la pestaña de login y limpiar formulario
        formRegistro.reset();
        const tabLogin = document.querySelector('.tab[data-modo="login"]');
        if (tabLogin) tabLogin.click();

      } catch (err) {
        // 2. Mostrar mensajes de error devueltos por el backend
        errorDiv.textContent = err.message || 'Ocurrió un error al registrarse.';
        errorDiv.hidden = false;
      }
    });
  }

  // Lógica de Login 
  if (formLogin) {
    const errorDivLogin = formLogin.querySelector('.form__error');

    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorDivLogin.hidden = true;
      errorDivLogin.textContent = '';

      const formData = new FormData(formLogin);
      const email = formData.get('email').trim();
      const password = formData.get('password');

      try {
        const data = await login(email, password);
        guardarSesion(data.token, data.user);
        window.location.href = '../index.html';
      } catch (err) {
        errorDivLogin.textContent = err.message || 'Credenciales inválidas.';
        errorDivLogin.hidden = false;
      }
    });
  }
});