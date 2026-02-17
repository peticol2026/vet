import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
} from "./services/usuarios.service.js";

import { initBackButton } from "./ui/backButton.ui.js";
/* ==========================
   ELEMENTOS
========================== */
const btnOpenCreate = document.getElementById("btnOpenCreate");
const modalCreate = document.getElementById("modalCreate");
const modalEdit = document.getElementById("modalEdit");
const usersGrid = document.getElementById("usersGrid");

const btnCloseAll = document.querySelectorAll(".btn-close");

const formCreate = modalCreate.querySelector("form");
const formEdit = modalEdit.querySelector("form");

let usuarioEditando = null;

/* ==========================
   ABRIR MODAL CREAR
========================== */
btnOpenCreate.addEventListener("click", () => {
  modalCreate.classList.remove("hidden");
});

/* ==========================
   CERRAR MODALES
========================== */
btnCloseAll.forEach(btn => {
  btn.addEventListener("click", () => {
    modalCreate.classList.add("hidden");
    modalEdit.classList.add("hidden");
  });
});

/* Click fuera */
[modalCreate, modalEdit].forEach(modal => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });
});

/* ==========================
   CARGAR USUARIOS
========================== */
async function cargarUsuarios() {

  const usuarios = await obtenerUsuarios();

  usersGrid.innerHTML = "";

  usuarios.forEach(user => {

    const card = document.createElement("div");
    card.className = "user-card";

    card.innerHTML = `
      <div>
        <h4>${user.nombre}</h4>
        <p>${user.correo}</p>
      </div>

      <span class="role ${user.rol === "Administrador" ? "admin" : "worker"}">
        ${user.rol}
      </span>

      <div class="user-actions">
        <button class="btn ghost btn-edit" data-id="${user.idusuario}">
          Editar
        </button>
        <button class="btn danger btn-delete" data-id="${user.idusuario}">
          Eliminar
        </button>
      </div>
    `;

    usersGrid.appendChild(card);
  });
}


cargarUsuarios();


/* ==========================
   CREAR USUARIO
========================== */
formCreate.addEventListener("submit", async (e) => {

  e.preventDefault();

  const nombre = formCreate[0].value;
  const email = formCreate[1].value;
  const password = formCreate[2].value;
  const rol = formCreate[3].value;

  try {
    await crearUsuario({ nombre, email, password, rol });

    formCreate.reset();
    modalCreate.classList.add("hidden");

    cargarUsuarios();
    alert("Usuario creado correctamente");

  } catch (error) {
    console.error(error);
    alert("Error al crear usuario");
  }

});





/* ==========================
   EVENTOS DINÁMICOS
========================== */
document.addEventListener("click", async (e) => {

  /* EDITAR */
 if (e.target.classList.contains("btn-edit")) {

  usuarioEditando = e.target.dataset.id;

  const card = e.target.closest(".user-card");

  const nombre = card.querySelector("h4").textContent;
  const correo = card.querySelector("p").textContent;
  const rol = card.querySelector(".role").textContent.trim();

  document.getElementById("editNombre").value = nombre;
  document.getElementById("editCorreo").value = correo;
  document.getElementById("editRol").value = rol;
  document.getElementById("editPassword").value = "";

  modalEdit.classList.remove("hidden");
}




  /* ELIMINAR */
  if (e.target.classList.contains("btn-delete")) {

    const id = e.target.dataset.id;

    if (confirm("¿Eliminar usuario?")) {
      await eliminarUsuario(id);
      cargarUsuarios();
    }
  }
});

/* ==========================
   ACTUALIZAR USUARIO
========================== */
formEdit.addEventListener("submit", async (e) => {

  e.preventDefault();

  const nombre = document.getElementById("editNombre").value;
  const email = document.getElementById("editCorreo").value;
  const password = document.getElementById("editPassword").value;
  const rol = document.getElementById("editRol").value;

  await actualizarUsuario({
    idusuario: usuarioEditando,
    nombre,
    rol,
    email,
    password: password || null
  });

  modalEdit.classList.add("hidden");
  cargarUsuarios();
});



initBackButton();


