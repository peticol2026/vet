import { obtenerProductos } from "./services/productos.service.js";
import { obtenerCategorias } from "./services/categorias.service.js";

const grid = document.getElementById("productosGridCliente");
const searchInput = document.getElementById("searchCliente");
const filtroCategoria = document.getElementById("filtroCategoriaCliente");

let productosGlobales = [];

/* =========================
   INIT
========================= */

init();

async function init() {
  await cargarProductos();
  await cargarCategorias();
}

/* =========================
   CARGAR PRODUCTOS
========================= */

async function cargarProductos() {
  const productos = await obtenerProductos();
  productosGlobales = productos;
  renderProductos(productos);
}

/* =========================
   RENDER
========================= */

function renderProductos(productos) {
  grid.innerHTML = "";

  productos.forEach(producto => {

    const imagen = producto.imagen 
      || "https://i.pinimg.com/736x/76/f3/f3/76f3f3007969fd3b6db21c744e1ef289.jpg";

    const card = document.createElement("div");
    card.classList.add("product-card");

  card.innerHTML = `
  <div class="flip-card-inner">

    <div class="flip-card-front">
      <img src="${imagen}" alt="${producto.nombreProducto}">
      <div class="product-info">
        <div class="product-name">${producto.nombreProducto}</div>
        <div class="product-price">
          ${formatoCOP(producto.precioVenta)}
        </div>
      </div>
    </div>

    <div class="flip-card-back">
      <h3>${producto.nombreProducto}</h3>
      <p>${producto.descripcion || "Producto disponible en Peticol."}</p>
      <button class="ver-info-btn">Ver más</button>
    </div>

  </div>
`;



    grid.appendChild(card);
  });
}

/* =========================
   FILTROS
========================= */

searchInput.addEventListener("input", aplicarFiltros);
filtroCategoria.addEventListener("change", aplicarFiltros);

function aplicarFiltros() {
  const texto = searchInput.value.toLowerCase();
  const categoria = filtroCategoria.value;

  const filtrados = productosGlobales.filter(p => {
    const coincideNombre = p.nombreProducto.toLowerCase().includes(texto);
    const coincideCategoria = categoria
      ? p.categoriaNombre === categoria
      : true;

    return coincideNombre && coincideCategoria;
  });

  renderProductos(filtrados);
}

/* =========================
   CARGAR CATEGORÍAS
========================= */

async function cargarCategorias() {
  const categorias = await obtenerCategorias();

  categorias.forEach(cat => {
    filtroCategoria.innerHTML += `
      <option value="${cat.nombre}">
        ${cat.nombre}
      </option>
    `;
  });
}

/* =========================
   FORMATO COP
========================= */

function formatoCOP(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0
  }).format(valor);
}


const btn = card.querySelector(".ver-info-btn");

btn.addEventListener("click", () => {
  abrirModalProducto(producto);
});


const modal = document.getElementById("modalProducto");
const cerrarModalBtn = document.getElementById("cerrarModalProducto");

function abrirModalProducto(producto) {

  document.getElementById("modalImagen").src =
    producto.imagen || "https://i.pinimg.com/736x/76/f3/f3/76f3f3007969fd3b6db21c744e1ef289.jpg";

  document.getElementById("modalNombre").textContent =
    producto.nombreProducto;

  document.getElementById("modalCategoria").textContent =
    producto.categoriaNombre;

  document.getElementById("modalPrecio").textContent =
    formatoCOP(producto.precioVenta);

  document.getElementById("modalDescripcion").textContent =
    producto.descripcion || "Producto disponible en nuestra tienda Peticol.";

  modal.classList.add("active");
}

cerrarModalBtn.addEventListener("click", () => {
  modal.classList.remove("active");
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("active");
  }
});


tsParticles.load("particles-bg", {
  background: {
    color: "transparent"
  },
  particles: {
    number: {
      value: 60
    },
    color: {
      value: "#ffffff"
    },
    opacity: {
      value: 0.3
    },
    size: {
      value: 3
    },
    move: {
      enable: true,
      speed: 1
    },
    links: {
      enable: true,
      distance: 150,
      color: "#6366f1",
      opacity: 0.2,
      width: 1
    }
  }
});


