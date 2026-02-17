/* =====================================================
   IMPORTS
===================================================== */
import { obtenerProductos, actualizarProducto } 
from "./services/productos.service.js";

import { supabase } from "./config/supabase.js";
import { initBackButton } from "./ui/backButton.ui.js";

let usuarioLogueado = null;


/* =====================================================
   REFERENCIAS DOM
===================================================== */
const productsGrid     = document.getElementById("productsGrid");
const carritoItems     = document.getElementById("carritoItems");
const totalVentaEl     = document.getElementById("totalVenta");
const btnFinalizar     = document.getElementById("btnFinalizar");
const buscador         = document.getElementById("buscador");
const filtroCategoria  = document.getElementById("filtroCategoria");
const cartCount        = document.getElementById("cartCount");
const valorPagadoInput = document.getElementById("valorPagado");
const vueltoEl         = document.getElementById("vuelto");


/* =====================================================
   ESTADO GLOBAL
===================================================== */
let productos = [];
let carrito = [];
let metodoSeleccionado = "Efectivo";


/* =====================================================
   INICIALIZACIÓN
===================================================== */
document.addEventListener("DOMContentLoaded", async () => {

  // Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    alert("No hay usuario logueado");
    window.location.href = "index.html";
    return;
  }

  usuarioLogueado = user;

  cargarProductos();
  configurarEventosPago();
});



/* =====================================================
   PRODUCTOS
===================================================== */
async function cargarProductos() {
  productos = await obtenerProductos();
  renderProductos(productos);
  cargarCategorias();
}

function renderProductos(lista) {

  productsGrid.innerHTML = "";

  lista.forEach(prod => {

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-img">
        <img src="${prod.imagen || 'https://aramar.com/wp-content/uploads/2017/05/aramar-suministros-para-el-vidrio-cristal-sin-imagen-disponible.jpg'}">
      </div>

      <div class="product-info">
        <h4>${prod.nombreProducto}</h4>
        <p class="price">${formatoCOP(prod.precioVenta)}</p>
        <p class="stock">Stock: ${prod.cantidad}</p>
      </div>

      <button class="btn primary btn-add"
        data-id="${prod.idProducto}"
        ${prod.cantidad <= 0 ? "disabled" : ""}>
        ${prod.cantidad <= 0 ? "Sin stock" : "Agregar"}
      </button>
    `;

    productsGrid.appendChild(card);
  });
}


/* =====================================================
   CARRITO
===================================================== */
document.addEventListener("click", e => {

  if (!e.target.classList.contains("btn-add")) return;

  const id = e.target.dataset.id;
  const producto = productos.find(p => p.idProducto == id);
  const existente = carrito.find(p => p.idProducto == id);

  if (existente) {

    if (existente.cantidad < existente.stockInicial) {
      existente.cantidad++;
    } else {
      alert("No hay más stock disponible");
    }

  } else {

    carrito.push({
      ...producto,
      cantidad: 1,
      stockInicial: producto.cantidad
    });
  }

  actualizarCarrito();
});


document.addEventListener("click", e => {

  const id = e.target.dataset.id;
  if (!id) return;

  const item = carrito.find(p => p.idProducto == id);
  if (!item) return;

  /* SUMAR */
  if (e.target.classList.contains("btn-sumar")) {

    if (item.cantidad < item.stockInicial) {
      item.cantidad++;
    }

  }

  /* RESTAR */
  if (e.target.classList.contains("btn-restar")) {

    item.cantidad--;

    if (item.cantidad <= 0) {
      carrito = carrito.filter(p => p.idProducto != id);
    }

  }

  /* ELIMINAR */
  if (e.target.classList.contains("btn-eliminar")) {

    carrito = carrito.filter(p => p.idProducto != id);

  }

  actualizarCarrito();
});




function actualizarCarrito() {

  carritoItems.innerHTML = "";

  let total = 0;
  let totalProductos = 0;

  carrito.forEach(item => {

    total += item.precioVenta * item.cantidad;
    totalProductos += item.cantidad;

    carritoItems.innerHTML += `
      <div class="carrito-item">
        
        <div class="item-info">
          <strong>${item.nombreProducto}</strong>
          <small>${formatoCOP(item.precioVenta)}</small>
        </div>

        <div class="item-controls">
          <button class="btn-restar" data-id="${item.idProducto}">−</button>
          <span>${item.cantidad}</span>
          <button class="btn-sumar" data-id="${item.idProducto}">+</button>
          <button class="btn-eliminar" data-id="${item.idProducto}">🗑</button>
        </div>

        <div class="item-total">
          ${formatoCOP(item.precioVenta * item.cantidad)}
        </div>

      </div>
    `;
  });

  totalVentaEl.textContent = total;
  cartCount.textContent = totalProductos;

  calcularVuelto();
}



/* =====================================================
   PAGO
===================================================== */
valorPagadoInput?.addEventListener("input", calcularVuelto);

function calcularVuelto() {

  const total  = parseFloat(totalVentaEl.textContent) || 0;
  const pagado = parseFloat(valorPagadoInput.value) || 0;

  const vuelto = pagado - total;

  vueltoEl.textContent = vuelto > 0
    ? formatoCOP(vuelto)
    : formatoCOP(0);
}

function configurarEventosPago() {

  const efectivoRows = document.querySelectorAll(".efectivo-row");

  document.querySelectorAll(".metodo").forEach(btn => {
    btn.addEventListener("click", () => {

      document.querySelectorAll(".metodo")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");
      metodoSeleccionado = btn.dataset.pago;

      /* 🔥 Si NO es efectivo */
      if (metodoSeleccionado !== "Efectivo") {

        efectivoRows.forEach(row => row.style.display = "none");

        // automáticamente se paga el total exacto
        valorPagadoInput.value = totalVentaEl.textContent;
        vueltoEl.textContent = formatoCOP(0);

      } else {

        efectivoRows.forEach(row => row.style.display = "flex");
        valorPagadoInput.value = "";
        vueltoEl.textContent = formatoCOP(0);
      }

    });
  });
}



/* =====================================================
   REGISTRAR VENTA
===================================================== */
btnFinalizar?.addEventListener("click", registrarVenta);

async function registrarVenta() {

  if (carrito.length === 0) {
    alert("Carrito vacío");
    return;
  }

  const total = parseFloat(totalVentaEl.textContent);
let pagado  = parseFloat(valorPagadoInput.value) || 0;


  // Si no es efectivo, el pago es igual al total
if (metodoSeleccionado !== "Efectivo") {
  pagado = total;
}



  if (pagado < total) {
    alert("El monto es insuficiente");
    return;
  }

  /* 1️⃣ Insertar venta */
 /* 1️⃣ Obtener idusuario real */
const idUsuarioReal = await obtenerIdUsuario(usuarioLogueado.id);

if (!idUsuarioReal) {
  alert("No se encontró el usuario en la base de datos");
  return;
}

/* 2️⃣ Insertar venta */
const { data: venta, error: errorVenta } = await supabase
  .from("ventas")
  .insert([{
    total: total,
    metodo_pago: metodoSeleccionado,
    idusuario: idUsuarioReal
  }])
  .select()
  .single();



  if (errorVenta) {
    console.error(errorVenta);
    alert("Error al registrar venta");
    return;
  }

  /* 2️⃣ Insertar detalle */
  const detalles = carrito.map(p => ({
    idventa: venta.idventa,
    idproducto: p.idProducto,
    cantidad: p.cantidad,
    precio: p.precioVenta
  }));

  const { error: errorDetalle } = await supabase
    .from("detalle_venta")
    .insert(detalles);

  if (errorDetalle) {
    console.error(errorDetalle);
    alert("Error en detalle venta");
    return;
  }

  /* 3️⃣ Descontar stock */
  for (let p of carrito) {

    const nuevoStock = p.stockInicial - p.cantidad;

    await actualizarProducto(p.idProducto, {
      cantidad: nuevoStock
    });
  }

  // Obtener nombre del empleado
const nombreEmpleado = await obtenerNombreEmpleado(idUsuarioReal);



  /* 4️⃣ Generar ticket */
  generarTicketTermico(
  venta.idventa,
  pagado,
  metodoSeleccionado,
  nombreEmpleado
);


  /* 5️⃣ Reset */
  carrito = [];
  valorPagadoInput.value = "";
  actualizarCarrito();
  cargarProductos();

  alert("Venta registrada correctamente");
}


/* =====================================================
   TICKET 58mm REAL
===================================================== */
function generarTicketTermico(idVenta, pagado, metodoPago, nombreEmpleado) {

  const total = carrito.reduce((acc, p) =>
    acc + p.precioVenta * p.cantidad, 0);

  const vuelto = pagado - total;

  const fecha = new Date().toLocaleString("es-CO");

  const ventana = window.open("", "", "width=300,height=600");

  ventana.document.write(`
    <html>
      <head>
        <title>Comprobante de pago</title>
        <style>
          body {
            font-family: monospace;
            width: 220px;
            margin: 0;
            padding: 10px;
            font-size: 12px;
          }
          .center { text-align:center; }
          .row { display:flex; justify-content:space-between; }
          hr { border: 1px dashed #000; margin:5px 0; }
        </style>
      </head>
      <body>

        <div class="center">
          <strong>PETICOL</strong><br>
          NIT: 11935811351<br>
          ${fecha}
        </div>

        <hr>

        <div>
          Ticket: ${idVenta}<br>
          Empleado: ${nombreEmpleado}
        </div>

        <hr>

        ${carrito
          .map(
            (p) => `
          <div>
            ${p.nombreProducto}
            <div class="row">
              <span>${p.cantidad} x ${formatoCOP(p.precioVenta)}</span>
              <span>${formatoCOP(p.cantidad * p.precioVenta)}</span>
            </div>
          </div>
          <br>
        `,
          )
          .join("")}

        <hr>

        <div class="row">
          <strong>TOTAL:</strong>
          <strong>${formatoCOP(total)}</strong>
        </div>

        ${
          metodoPago === "Efectivo"
            ? `
<div class="row">
  <span>PAGADO:</span>
  <span>${formatoCOP(pagado)}</span>
</div>

<div class="row">
  <span>VUELTO:</span>
  <span>${formatoCOP(vuelto)}</span>
</div>
`
            : ""
        }


        <div>
          Metodo: ${metodoPago}
        </div>

        <hr>

        <div class="center">
          Gracias por su compra
        </div>

      </body>
    </html>
  `);

  ventana.document.close();
  ventana.print();
}



/* =====================================================
   FORMATO COP
===================================================== */
function formatoCOP(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0
  }).format(valor);
}


/* =====================================================
   FILTROS
===================================================== */
buscador?.addEventListener("input", e => {

  const texto = e.target.value.toLowerCase();

  const filtrados = productos.filter(p =>
    p.nombreProducto.toLowerCase().includes(texto)
  );

  renderProductos(filtrados);
});

function cargarCategorias() {

  if (!filtroCategoria) return;

  const categorias = [...new Set(productos.map(p => p.categoria))];

  filtroCategoria.innerHTML =
    `<option value="">Todas las categorías</option>`;

  categorias.forEach(cat => {

    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    filtroCategoria.appendChild(option);
  });
}

filtroCategoria?.addEventListener("change", e => {

  const categoria = e.target.value;

  if (!categoria) {
    renderProductos(productos);
    return;
  }

  const filtrados = productos.filter(p =>
    p.categoria === categoria
  );

  renderProductos(filtrados);
});


async function obtenerNombreEmpleado(idUsuario) {
  const { data } = await supabase
    .from("usuarios")
    .select("nombre")
    .eq("idusuario", idUsuario)
    .maybeSingle();

  return data?.nombre || "Empleado";
}



async function obtenerIdUsuario(authId) {

  const { data, error } = await supabase
    .from("usuarios")
    .select("idusuario")
    .eq("auth_id", authId)
    .single();

  if (error) {
    console.error("Error obteniendo idusuario:", error);
    return null;
  }

  return data.idusuario;
}



// MODAL DE CARRITO

const cartIndicator = document.querySelector(".cart-indicator");
const cart = document.querySelector(".cart");

cartIndicator.addEventListener("click", () => {
  if (window.innerWidth <= 600) {
    cart.classList.add("open");
    document.body.style.overflow = "hidden";
  }
});

cart.addEventListener("click", (e) => {
  if (window.innerWidth <= 600) {

    // Si el click NO fue dentro del contenido del carrito
    const isClickInside = e.target.closest(".cart-header") ||
                          e.target.closest(".cart-items") ||
                          e.target.closest(".cart-footer");

    if (!isClickInside) {
      cart.classList.remove("open");
      document.body.style.overflow = "auto";
    }
  }
});


const closeBtn = document.querySelector(".close-cart");

closeBtn.addEventListener("click", () => {
  cart.classList.remove("open");
  document.body.style.overflow = "auto";
});


initBackButton();
