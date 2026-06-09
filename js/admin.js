// 🔐 IMPORTAR SUPABASE
import { supabase } from "./config/supabase.js";

const toggle = document.getElementById("toggleSidebar");
const sidebar = document.getElementById("sidebar");
const content = document.querySelector(".content");
const toggleBtn = document.getElementById("toggleSidebar");
const searchInput = document.getElementById("searchInput");
const cards = document.querySelectorAll(".card");


// ==============================
// 🔐 VERIFICAR SESIÓN ACTIVA
// ==============================

document.addEventListener("DOMContentLoaded", async () => {

  // 🔐 1. Verificar sesión
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  const user = sessionData.session.user;

  // 🔎 2. Buscar rol en tu tabla usuarios
  const { data: usuarioDB, error } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("auth_id", user.id)
    .single();

  if (error) {
    console.error("Error obteniendo rol:", error);
    return;
  }

  // 🚫 3. Si es Trabajador ocultar cards admin
  if (usuarioDB.rol === "Trabajador") {
    document.querySelectorAll('[data-role="admin-only"]')
      .forEach(card => {
        card.style.display = "none";
      });
  }

});



// ==============================
// SIDEBAR TOGGLE
// ==============================

if (toggle) {
  toggle.addEventListener("click", () => {
    sidebar?.classList.toggle("hidden");
    content?.classList.toggle("full");
  });
}

document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("click", () => {
    const link = card.dataset.link;
    window.location.href = link;
  });
});

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    sidebar?.classList.toggle("show");
  });
}


// ==============================
// BUSCADOR DE CARDS
// ==============================

searchInput.addEventListener("input", () => {
  const searchValue = searchInput.value.toLowerCase().trim();

  cards.forEach(card => {
    const cardText = card
      .querySelector(".card-text")
      .textContent
      .toLowerCase();

    if (cardText.includes(searchValue)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
});


// ==============================
// 🚪 CERRAR SESIÓN
// ==============================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error al cerrar sesión:", error);
      return;
    }

    // 🔥 Redirige a index.html
    window.location.href = "index.html";
  });
}


// ==============================
// MODAL LOGO
// ==============================

const logo = document.querySelector(".navbar-logo");
const logoModal = document.getElementById("logoModal");

if (logo && logoModal) {

  logo.addEventListener("click", () => {
    logoModal.classList.add("show");
  });

  logoModal.addEventListener("click", (e) => {

    if (e.target === logoModal) {
      logoModal.classList.remove("show");
    }

  });

  document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {
      logoModal.classList.remove("show");
    }

  });

}