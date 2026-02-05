const toggle = document.getElementById("toggleSidebar");
const sidebar = document.getElementById("sidebar");
const content = document.querySelector(".content");

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
