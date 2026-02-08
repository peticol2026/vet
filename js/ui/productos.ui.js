import { obtenerProductos } from "../services/productos.service.js";

/* =========================
   ELEMENTOS DOM
========================= */

// Grid de productos
const grid = document.getElementById("productosGrid");

// Contador
const productsCount = document.getElementById("productsCount");

// Modal
const modal = document.getElementById("productModal");
const btnAdd = document.getElementById("btnAddProduct");
const btnCancel = document.getElementById("btnCancelModal");


function formatoCOP(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0
  }).format(valor);
}




/* =========================
   RENDER PRODUCTOS (CARDS)
========================= */
export async function renderProductos() {
  const productos = await obtenerProductos();
  grid.innerHTML = "";

  productos.forEach(producto => {

    // ✅ armamos la ruta correcta de la imagen
    const imagenSrc = producto.imagen && producto.imagen.trim() !== ""
      ? `./assets/imagenes/${producto.imagen}`
      : `./assets/imagenes/default.png`;

    const card = document.createElement("div");
card.classList.add("product-card");

    card.innerHTML = `
  <img 
    src="${imagenSrc}" 
    alt="${producto.nombreProducto}"
    onerror="this.src='./assets/imagenes/default.png'"
  >

  <h4 class="product-name">
    ${producto.nombreProducto}
  </h4>

  <p class="product-category">
    ${producto.categoria}
  </p>

  <p class="product-category">
    Fecha de vencimiento: ${producto.fechaVencimiento}
  </p>

  <div class="product-info">
    <span class="product-price">
      Precio de costo: ${formatoCOP(producto.precioCosto)}
    </span>

    <span class="product-price">
      Precio de venta: ${formatoCOP(producto.precioVenta)}
    </span>

    <span class="product-stock">
      ${producto.cantidad} u
    </span>
  </div>
`;

    grid.appendChild(card);
  });

  if (productsCount) {
    productsCount.textContent = `${productos.length} productos`;
  }
}

/* =========================
   MODAL
========================= */
export function initModal() {

  btnAdd.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  btnCancel.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });
}
