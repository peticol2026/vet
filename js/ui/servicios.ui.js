export function mostrarServicios(servicios) {
  const contenedor = document.getElementById("servicios");

  contenedor.innerHTML = "";

  servicios.forEach(servicio => {
    const card = document.createElement("div");
    card.className = "card-servicio";

    card.innerHTML = `
      <h3>${servicio.nombre}</h3>
      <p>${servicio.descripcion}</p>
    `;

    contenedor.appendChild(card);
  });
}
