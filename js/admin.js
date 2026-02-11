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

  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    window.location.href = "index.html"; // 🔥 redirige al login
    return;
  }

});


// ==============================
// SIDEBAR TOGGLE
// ==============================

toggle.addEventListener("click", () => {
  sidebar.classList.toggle("hidden");
  content.classList.toggle("full");
});

document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("click", () => {
    const link = card.dataset.link;
    window.location.href = link;
  });
});

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("show");
});


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
