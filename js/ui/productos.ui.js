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
   RENDER PRODUCTOS (CARDS)
========================= */
export function renderProductos(productos = [], onEliminar, onEditar, editarProducto) {

  grid.innerHTML = "";

  productos.forEach(producto => {

    const imagenSrc = producto.imagen
      ? producto.imagen
      : "https://i.pinimg.com/736x/76/f3/f3/76f3f3007969fd3b6db21c744e1ef289.jpg";

    const card = document.createElement("div");
    card.classList.add("product-card");

    const vencido = estaVencido(producto.fechaVencimiento);

     if (vencido) {
      card.classList.add("card-vencida");
    }



    card.innerHTML = `
  <img 
    src="${imagenSrc}" 
    alt="${producto.nombreProducto}"
    onerror="this.src='./assets/imagenes/default.png'"
  >

  <h4 class="product-name">${producto.nombreProducto}</h4>

  <p class="product-category">${producto.categoria}</p>

    <p class="product-category ${vencido ? "vencido" : ""}">
    Fecha de vencimiento: 
    ${producto.fechaVencimiento ?? "N/A"}
    </p>


  <div class="product-info">
    <span class="product-price">
      Precio costo: ${formatoCOP(producto.precioCosto)}
    </span>

    <span class="product-price">
      Precio venta: ${formatoCOP(producto.precioVenta)}
    </span>

        <div class="product-stock-container">
      <span class="product-stock">
        ${producto.cantidad} u
      </span>

      ${vencido ? `<span class="badge-vencido">Vencido</span>` : ""}
    </div>

  </div>

  <button 
    class="btn danger btn-delete"
    data-id="${producto.idProducto}">
    Eliminar
  </button>

  <button 
      class="btn warning btn-edit"
      data-id="${producto.idProducto}">
      Editar
  </button>


`;


// LOGICA VENCIMIENTO DE FECHAS DE PRODUCTOS

function estaVencido(fecha) {
  if (!fecha) return false;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaProducto = new Date(fecha);
  fechaProducto.setHours(0, 0, 0, 0);

  return fechaProducto <= hoy;
}






    // LOGICA MONEDA COLOMBIANA

function formatoCOP(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0
  }).format(valor);
}




// LOGICA PARA BOTON DE ELIMINAR

const btnDelete = card.querySelector(".btn-delete");

btnDelete.addEventListener("click", () => {
  if (!confirm("¿Eliminar este producto?")) return;

  card.classList.add("fade-out");

  setTimeout(() => {
    onEliminar(producto);
  }, 300);
});


// lOGICA PARA BOTON DE EDITAR

const btnEdit = card.querySelector(".btn-edit");

btnEdit.addEventListener("click", () => {
  onEditar(producto);
});






    grid.appendChild(card);
  });

  productsCount.textContent = `${productos.length} productos`;
}


/* =========================
   MODAL
========================= */
/* =========================
   MODAL
========================= */
export function initModal() {

  btnAdd.addEventListener("click", () => {
    // Abrir modal
    modal.classList.remove("hidden");

    // Reset título (modo agregar)
    const modalTitle = document.getElementById("modalTitle");
    if (modalTitle) modalTitle.textContent = "Agregar producto";

    // Limpiar preview de imagen
    const preview = document.getElementById("imagenPreview");
    const btnQuitarImagen = document.getElementById("btnQuitarImagen");
    const inputImagen = document.getElementById("imagen");

    if (preview) {
      preview.src = "";
      preview.style.display = "none";
    }

    if (btnQuitarImagen) {
      btnQuitarImagen.style.display = "none";
    }

    if (inputImagen) {
      inputImagen.value = "";
    }
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

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const file = form.querySelector("#imagen").files[0];

    const producto = {
      nombreProducto: form.querySelector("#nombreProducto").value,
      categoria: form.querySelector("#categoria").value,
      precioCosto: Number(form.querySelector("#precioCosto").value),
      precioVenta: Number(form.querySelector("#precioVenta").value),
      cantidad: Number(form.querySelector("#cantidad").value),
      fechaVencimiento: form.querySelector("#fechaVencimiento").value || null,
      imagenFile: file || null
    };

    console.log("Producto enviado:", producto);

    onGuardar(producto);
  });
}


// LOGICA PARA EL PROCESO DE CAMBIAR LA FOTO

const inputImagen = document.getElementById("imagen");
const preview = document.getElementById("imagenPreview");
const btnQuitarImagen = document.getElementById("btnQuitarImagen");

if (inputImagen) {
  inputImagen.addEventListener("change", () => {
    const file = inputImagen.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
      preview.style.display = "block";
      btnQuitarImagen.style.display = "block";
    };
    reader.readAsDataURL(file);
  });
}


if (btnQuitarImagen) {
  btnQuitarImagen.addEventListener("click", () => {
    inputImagen.value = "";
    preview.src = "";
    preview.style.display = "none";
    btnQuitarImagen.style.display = "none";
  });
}





