// ==========================
// ELEMENTOS
// ==========================
const btnOpenCreate = document.getElementById("btnOpenCreate");
const modalCreate = document.getElementById("modalCreate");
const modalEdit = document.getElementById("modalEdit");

const btnCloseAll = document.querySelectorAll(".btn-close");
const btnEdit = document.querySelectorAll(".btn-edit");

// ==========================
// ABRIR MODAL CREAR
// ==========================
btnOpenCreate.addEventListener("click", () => {
  modalCreate.classList.remove("hidden");
});

// ==========================
// ABRIR MODAL EDITAR
// ==========================
btnEdit.forEach(btn => {
  btn.addEventListener("click", () => {
    modalEdit.classList.remove("hidden");
  });
});

// ==========================
// CERRAR MODALES
// ==========================
btnCloseAll.forEach(btn => {
  btn.addEventListener("click", () => {
    modalCreate.classList.add("hidden");
    modalEdit.classList.add("hidden");
  });
});

// ==========================
// CLICK FUERA DEL MODAL
// ==========================
[modalCreate, modalEdit].forEach(modal => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });
});
