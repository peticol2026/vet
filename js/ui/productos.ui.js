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

/* =========================
   FORMATO MONEDA
========================= */
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
export function renderProductos(productos = [], onEliminar) {

  grid.innerHTML = "";

  productos.forEach(producto => {

    const imagenSrc = producto.imagen
      ? producto.imagen
      : "https://i.pinimg.com/736x/76/f3/f3/76f3f3007969fd3b6db21c744e1ef289.jpg";

    const card = document.createElement("div");
    card.classList.add("product-card");

    card.innerHTML = `
  <img 
    src="${imagenSrc}" 
    alt="${producto.nombreProducto}"
    onerror="this.src='./assets/imagenes/default.png'"
  >

  <h4 class="product-name">${producto.nombreProducto}</h4>

  <p class="product-category">${producto.categoria}</p>

  <p class="product-category">
    Fecha de vencimiento: ${producto.fechaVencimiento ?? "N/A"}
  </p>

  <div class="product-info">
    <span class="product-price">
      Precio costo: ${formatoCOP(producto.precioCosto)}
    </span>

    <span class="product-price">
      Precio venta: ${formatoCOP(producto.precioVenta)}
    </span>

    <span class="product-stock">
      ${producto.cantidad} u
    </span>
  </div>

  <button 
    class="btn danger btn-delete"
    data-id="${producto.idProducto}">
    Eliminar
  </button>
`;


const btnDelete = card.querySelector(".btn-delete");

btnDelete.addEventListener("click", () => {
  if (!confirm("¿Eliminar este producto?")) return;

  card.classList.add("fade-out");

  setTimeout(() => {
    onEliminar(producto);
  }, 300);
});






    grid.appendChild(card);
  });

  productsCount.textContent = `${productos.length} productos`;
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




/* =========================
   FORMULARIO
========================= */

const form = document.getElementById("productForm");


export function initFormulario(onGuardar) {
  const form = document.getElementById("productForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = document.getElementById("imagen").files[0];

    const producto = {
      nombreProducto: document.getElementById("nombreProducto").value,
      categoria: document.getElementById("categoria").value,
      precioCosto: Number(document.getElementById("precioCosto").value),
      precioVenta: Number(document.getElementById("precioVenta").value),
      cantidad: Number(document.getElementById("cantidad").value),
      imagenFile: file || null // 👈 NO sube aquí
    };

    onGuardar(producto);
  });
}



