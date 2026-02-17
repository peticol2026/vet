export function initBackButton() {
  const btn = document.querySelector(".btn-back");
  if (!btn) return;

  btn.addEventListener("click", () => {
    window.location.href = "indexAdmin.html";
  });
}