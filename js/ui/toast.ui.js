export function showToast(message, type = "succes"){

    const toast = document.getElementById("toast");


    toast.textContent = message;
    toast.className = `toast show ${type}`;


    setTimeout(() => {

        toast.className = "toast";

    },3000);

}

export function mostrarToast(mensaje, tipo = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  toast.textContent = mensaje;

  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
