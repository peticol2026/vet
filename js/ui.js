function mostrarServicios(listaServicios) {
  const app = document.getElementById("app");

  let html = `
    <h2>Nuestros Servicios</h2>
    <ul>
      ${listaServicios.map(s => `<li>${s.nombre} - ${s.precio}</li>`).join("")}
    </ul>
  `;

  app.innerHTML = html;
}



