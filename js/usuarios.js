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
   INIT
========================== */
init();

async function init() {
  await cargarUsuarios();
  initBackButton();
}

/* ==========================
   ABRIR / CERRAR MODALES
========================== */
btnOpenCreate.addEventListener("click", () => {
  modalCreate.classList.remove("hidden");
});

btnCloseAll.forEach(btn => {
  btn.addEventListener("click", () => {
    modalCreate.classList.add("hidden");
    modalEdit.classList.add("hidden");
  });
});

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
  try {
    const usuarios = await obtenerUsuarios();
    usersGrid.innerHTML = "";

    if (!usuarios || usuarios.length === 0) {
      usersGrid.innerHTML = "<p>No hay usuarios registrados.</p>";
      return;
    }

    usuarios.forEach(user => {
      const card = document.createElement("div");
      card.className = "user-card";

      // Guardamos tanto idusuario como auth_id en dataset por si la Edge Function requiere auth_id
      card.innerHTML = `
        <div>
          <h4>${user.nombre || "Sin nombre"}</h4>
          <p>${user.correo || "Sin correo"}</p>
        </div>

        <span class="role ${user.rol === "Administrador" ? "admin" : "worker"}">
          ${user.rol || "Trabajador"}
        </span>

        <div class="user-actions">
          <button class="btn ghost btn-edit" data-id="${user.idusuario}" data-auth="${user.auth_id || ''}">
            Editar
          </button>
          <button class="btn danger btn-delete" data-id="${user.idusuario}" data-auth="${user.auth_id || ''}">
            Eliminar
          </button>
        </div>
      `;

      usersGrid.appendChild(card);
    });
  } catch (err) {
    console.error("Error al cargar usuarios:", err);
  }
}

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
    await cargarUsuarios();
    alert("Usuario creado correctamente");
  } catch (error) {
    console.error(error);
    alert("Error al crear usuario");
  }
});

/* ==========================
   EVENTOS DINÁMICOS
========================== */
usersGrid.addEventListener("click", async (e) => {
  const btnEdit = e.target.closest(".btn-edit");
  const btnDelete = e.target.closest(".btn-delete");

  /* EDITAR */
  if (btnEdit) {
    // Guardamos el objeto entero con los identificadores por si los necesita la Edge Function
    usuarioEditando = {
      idusuario: btnEdit.dataset.id,
      auth_id: btnEdit.dataset.auth
    };

    const card = btnEdit.closest(".user-card");

    const nombre = card.querySelector("h4").textContent.trim();
    const correo = card.querySelector("p").textContent.trim();
    const rol = card.querySelector(".role").textContent.trim();

    document.getElementById("editNombre").value = nombre;
    document.getElementById("editCorreo").value = correo;
    document.getElementById("editRol").value = rol;
    document.getElementById("editPassword").value = "";

    modalEdit.classList.remove("hidden");
  }

  /* ELIMINAR */
  if (btnDelete) {
    const idusuario = btnDelete.dataset.id;
    const auth_id = btnDelete.dataset.auth;

    if (confirm("¿Eliminar usuario?")) {
      try {
        // Se envía idusuario y auth_id por si la Edge Function usa cualquiera de los dos
        await eliminarUsuario({ idusuario, auth_id });
        await cargarUsuarios();
        alert("Usuario eliminado correctamente");
      } catch (err) {
        console.error("Error al eliminar:", err);
        alert("Error al eliminar el usuario");
      }
    }
  }
});

/* ==========================
   ACTUALIZAR USUARIO
========================== */
formEdit.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("editNombre").value.trim();
  const correo = document.getElementById("editCorreo").value.trim();
  const password = document.getElementById("editPassword").value;
  const rol = document.getElementById("editRol").value;

  // 1. Armamos el objeto con los nombres de variables exactos que espera la Edge Function
  const payload = {
    idusuario: typeof usuarioEditando === "object" ? usuarioEditando.idusuario : usuarioEditando,
    nombre,
    rol,
    email: correo
  };

  // 2. Solo adjuntamos password si el usuario escribió algo
  if (password && password.trim() !== "") {
    payload.password = password;
  }

  try {
    await actualizarUsuario(payload);

    modalEdit.classList.add("hidden");
    await cargarUsuarios();
    alert("¡Usuario actualizado correctamente! ✏️");
  } catch (err) {
    console.error("Error al actualizar:", err);
    alert("Error al actualizar el usuario. Revisa la consola.");
  }
});