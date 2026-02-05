// Botón "Iniciar Sesión" del navbar
const loginBtn = document.querySelector('a[href="#login"]');

// Modal (overlay completo)
const modal = document.getElementById('loginModal');

// Abrir modal
loginBtn.addEventListener('click', (e) => {
  e.preventDefault();
  modal.style.display = 'flex';
});

// Cerrar modal desde la X
function cerrarLogin() {
  modal.style.display = 'none';
}

// Cerrar modal al hacer click fuera del contenido
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    cerrarLogin();
  }
});
