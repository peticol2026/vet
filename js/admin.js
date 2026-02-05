const toggle = document.getElementById("toggleSidebar");
const sidebar = document.getElementById("sidebar");
const content = document.querySelector(".content");
const toggleBtn = document.getElementById("toggleSidebar");
const searchInput = document.getElementById("searchInput");
const cards = document.querySelectorAll(".card");



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



// ==============================
// SIDEBAR TOGGLE
// ==============================


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
