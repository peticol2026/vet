/* =====================================================
   IMPORTS
===================================================== */
import {
  obtenerProductos,
  actualizarProducto,
} from "./services/productos.service.js";

import { supabase } from "./config/supabase.js";
import { initBackButton } from "./ui/backButton.ui.js";

let usuarioLogueado = null;

/* =====================================================
   REFERENCIAS DOM
===================================================== */
const productsGrid = document.getElementById("productsGrid");
const carritoItems = document.getElementById("carritoItems");
const totalVentaEl = document.getElementById("totalVenta");
const btnFinalizar = document.getElementById("btnFinalizar");
const buscador = document.getElementById("buscador");
const filtroCategoria = document.getElementById("filtroCategoria");
const cartCount = document.getElementById("cartCount");
const valorPagadoInput = document.getElementById("valorPagado");
const vueltoEl = document.getElementById("vuelto");

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  lista.forEach((prod) => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-img">
        <img src="${prod.imagen || "https://aramar.com/wp-content/uploads/2017/05/aramar-suministros-para-el-vidrio-cristal-sin-imagen-disponible.jpg"}">
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
document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("btn-add")) return;

  const id = e.target.dataset.id;
  const producto = productos.find((p) => p.idProducto == id);
  const existente = carrito.find((p) => p.idProducto == id);

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
      stockInicial: producto.cantidad,
      descuentoUnitario: 0, // 👈 NUEVO
    });
  }

  actualizarCarrito();
});

carritoItems.addEventListener("click", (e) => {


    // 🚫 Si es el input de descuento, NO hacer nada
  if (e.target.classList.contains("input-descuento")) return;


  const id = e.target.dataset.id;
  if (!id) return;

  const item = carrito.find((p) => p.idProducto == id);
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
      carrito = carrito.filter((p) => p.idProducto != id);
    }
  }

  /* ELIMINAR */
  if (e.target.classList.contains("btn-eliminar")) {
    carrito = carrito.filter((p) => p.idProducto != id);
  }

  actualizarCarrito();
});

function actualizarCarrito() {
  carritoItems.innerHTML = "";

  let total = 0;
  let totalProductos = 0;

  carrito.forEach((item) => {
    const precioFinalUnit = item.precioVenta - (item.descuentoUnitario || 0);

    total += precioFinalUnit * item.cantidad;

    totalProductos += item.cantidad; // 👈 AQUÍ VA

    carritoItems.innerHTML += `
      <div class="carrito-item">
        
        <div class="item-info" id="info-${item.idProducto}">

          <strong>${item.nombreProducto}</strong>
          ${
            item.descuentoUnitario > 0
              ? `
      <small style="text-decoration: line-through; color:#999;">
        ${formatoCOP(item.precioVenta)}
      </small>
      <small style="color:red;">
        - ${formatoCOP(item.descuentoUnitario)}
      </small>
    `
              : `
      <small>${formatoCOP(item.precioVenta)}</small>
    `
          }

        </div>

        <div class="item-controls">
          <button class="btn-restar" data-id="${item.idProducto}">−</button>
          <span>${item.cantidad}</span>
          <button class="btn-sumar" data-id="${item.idProducto}">+</button>
          <button class="btn-eliminar" data-id="${item.idProducto}">🗑</button>
        </div>

        <div class="descuento-unitario">
          <span>- $</span>
          <input 
            type="number"
            class="input-descuento"
            data-id="${item.idProducto}"
            value="${item.descuentoUnitario || 0}"
            min="0"
            placeholder="0"
          >
        </div>



<div class="item-total" id="total-${item.idProducto}">

  ${formatoCOP(
    (item.precioVenta - (item.descuentoUnitario || 0)) * item.cantidad,
  )}
</div>


      </div>
    `;
  });

  totalVentaEl.textContent = formatoCOP(total);

  cartCount.textContent = totalProductos;

  calcularVuelto();

  document.querySelectorAll(".input-descuento").forEach((input) => {
    input.addEventListener("input", (e) => {
  const id = e.target.dataset.id;
  const valor = parseFloat(e.target.value) || 0;

  const item = carrito.find((p) => p.idProducto == id);
  if (!item) return;

  item.descuentoUnitario = Math.min(valor, item.precioVenta);

  recalcularTotales(); // 👈 solo recalcula, NO re-renderiza
});

  });
}

function recalcularTotales() {
  let total = 0;
  let totalProductos = 0;

  carrito.forEach((item) => {

    const precioFinalUnit =
      item.precioVenta - (item.descuentoUnitario || 0);

    const totalItem = precioFinalUnit * item.cantidad;

    total += totalItem;
    totalProductos += item.cantidad;

    // 🔥 ACTUALIZAR SOLO ESTE ITEM VISUALMENTE
    const info = document.getElementById(`info-${item.idProducto}`);
    const totalDiv = document.getElementById(`total-${item.idProducto}`);

    if (info) {
      info.innerHTML = `
        <strong>${item.nombreProducto}</strong>
        ${
          item.descuentoUnitario > 0
            ? `
              <small style="text-decoration: line-through; color:#999;">
                ${formatoCOP(item.precioVenta)}
              </small>
              <small style="color:red;">
                - ${formatoCOP(item.descuentoUnitario)}
              </small>
            `
            : `
              <small>${formatoCOP(item.precioVenta)}</small>
            `
        }
      `;
    }

    if (totalDiv) {
      totalDiv.textContent = formatoCOP(totalItem);
    }
  });

  totalVentaEl.textContent = formatoCOP(total);
  cartCount.textContent = totalProductos;
  calcularVuelto();
}



/* =====================================================
   PAGO
===================================================== */
valorPagadoInput?.addEventListener("input", calcularVuelto);

function calcularVuelto() {
  const total = carrito.reduce(
    (acc, item) =>
      acc + (item.precioVenta - (item.descuentoUnitario || 0)) * item.cantidad,
    0
  );

  const pagado = parseFloat(valorPagadoInput.value) || 0;

  const vuelto = pagado - total;

  vueltoEl.textContent = vuelto > 0 ? formatoCOP(vuelto) : formatoCOP(0);
}


function configurarEventosPago() {
  const efectivoRows = document.querySelectorAll(".efectivo-row");

  document.querySelectorAll(".metodo").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".metodo")
        .forEach((b) => b.classList.remove("active"));

      btn.classList.add("active");
      metodoSeleccionado = btn.dataset.pago;

      /* 🔥 Si NO es efectivo */
      if (metodoSeleccionado !== "Efectivo") {
        efectivoRows.forEach((row) => (row.style.display = "none"));

        // automáticamente se paga el total exacto
        const total = carrito.reduce(
          (acc, item) =>
            acc +
            (item.precioVenta - (item.descuentoUnitario || 0)) * item.cantidad,
          0,
        );

        valorPagadoInput.value = total;
        vueltoEl.textContent = formatoCOP(0);
      } else {
        efectivoRows.forEach((row) => (row.style.display = "flex"));
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

 const total = carrito.reduce(
  (acc, item) =>
    acc + (item.precioVenta - (item.descuentoUnitario || 0)) * item.cantidad,
  0
);
  let pagado = parseFloat(valorPagadoInput.value) || 0;

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
    .insert([
      {
        total: total,
        metodo_pago: metodoSeleccionado,
        idusuario: idUsuarioReal,
      },
    ])
    .select()
    .single();

  if (errorVenta) {
    console.error(errorVenta);
    alert("Error al registrar venta");
    return;
  }

  /* 2️⃣ Insertar detalle */
  const detalles = carrito.map((p) => {
    const descuento = p.descuentoUnitario || 0;

    const precioFinalUnit = p.precioVenta - descuento;

    const gananciaUnidadFinal = precioFinalUnit - p.precioCosto;

    return {
      idventa: venta.idventa,
      idproducto: p.idProducto,
      cantidad: p.cantidad,
      precio: precioFinalUnit, // 👈 precio ya con descuento
      descuento_unitario: descuento, // 👈 GUARDAMOS DESCUENTO
      ganancia: gananciaUnidadFinal * p.cantidad,
    };
  });

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
      cantidad: nuevoStock,
    });
  }

  // Obtener nombre del empleado
  const nombreEmpleado = await obtenerNombreEmpleado(idUsuarioReal);

  /* 4️⃣ Generar ticket */
  generarTicketTermico(
    venta.idventa,
    pagado,
    metodoSeleccionado,
    nombreEmpleado,
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
  const total = carrito.reduce(
    (acc, p) => acc + (p.precioVenta - (p.descuentoUnitario || 0)) * p.cantidad,
    0,
  );

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

          img {
            width: 120px;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>

        <div class="center">
          <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iQ2FwYV84X2NvcGlhIiBkYXRhLW5hbWU9IkNhcGEgOCBjb3BpYSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNTAwIDUwMCI+CiAgPGRlZnM+CiAgICA8c3R5bGU+CiAgICAgIC5jbHMtMSB7CiAgICAgICAgZmlsbDogbm9uZTsKICAgICAgICBzdHJva2U6ICNmZjg1MzM7CiAgICAgICAgc3Ryb2tlLW1pdGVybGltaXQ6IDEwOwogICAgICAgIHN0cm9rZS13aWR0aDogMy4wNXB4OwogICAgICB9CgogICAgICAuY2xzLTIgewogICAgICAgIGZpbGw6ICNmZmY7CiAgICAgIH0KCiAgICAgIC5jbHMtMyB7CiAgICAgICAgZmlsbDogI2ZmODUzMzsKICAgICAgfQoKICAgICAgLmNscy00IHsKICAgICAgICBmaWxsOiAjM2EzYTNhOwogICAgICB9CiAgICA8L3N0eWxlPgogIDwvZGVmcz4KICA8cGF0aCBjbGFzcz0iY2xzLTQiIGQ9Ik0xNTMuMDksMTYyLjg5bC0xLjg5LDE4Ljc5djc3LjgyYzYuNjguNzYsMTYuMjgsMS40OCwyNy44NCwxLjAzLDE2LjM0LS42NCwyNC41LS45NywzMi41NS02LjAyLDEzLjU5LTguNTMsMTcuNTItMjMuNDcsMTguMzMtMjYuNTQsMi45Ni0xMS4yNC42OC0xNy4wNy4xMS0xOS4zOC0uODctMy41Ni0xLjg4LTUuNzktMi44NS03Ljg0aC01OC42MXYtMTkuMDFzLTIuMzgtMTItMTUuNDgtMTguODZaIi8+CiAgPHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMTI4LjYzLDE2Mi4zNnYxNDIuMjFoNTUuNDRzLTkuNjQtMjguNjctMS40NC01Ni4xN2MyLjQ2LTMuMDgsMjUuNSwyLjI2LDMyLjQ4LTMzLjQ0LDAtNy4xOC4yMS0xNC4yLjIxLTE0LjJoLTE4Ljczcy01LjY4LTIwLjYxLTQwLjE1LTE4LjQyYy01LjkyLTguMjgtMTUuODItMTcuNzItMjcuODEtMTkuOThaIi8+CiAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJNMTUwLjMsMTg5LjE2YzMzLjEtNS43NCw0MS43MiwxNy43MSw0MS43MiwxNy43MSwwLDAsMTcuMjMuNDEsMjMuMTgsMCwxLjY0LDkuMjMsMTAuNjMsNy45MywxMC42Myw3LjkzLjA1LDIuMjItLjEsNS4zOS0xLjA5LDkuMDMtMi40NSw4Ljk5LTguMywxNC41MS0xMC45NCwxNi42OS04LjcxLDcuMTgtMTguNjksNy43OC0yNS43Miw4LjIxLTUuMTQuMzEtOS40MS0uMTEtMTIuMzEtLjU1LTguNDgsMzQuNzQsMCw1Ni4zOSwwLDU2LjM5aC00Ny4xNXYtMTA5LjEybDIxLjY3LTYuMjlaIi8+CiAgPHBhdGggY2xhc3M9ImNscy00IiBkPSJNMTI4LjYzLDE2Ny43NnYxMzYuODJoNDUuNTFzLTM4LjMtMjguNDgtMjcuMDgtNzQuMTdjMS40MS0uMDQsMy40My0uMjksNS40Ny0xLjM3LDcuMDMtMy43LDcuOS0xMy43Myw4LjIxLTE3LjIzLDEuNDEtMTYuMTYtMTEuNzItMjguODctMTQuNS0zMS40NiwwLDAtOC41OC0xMC4xMi0xNy42LTEyLjU4WiIvPgogIDxjaXJjbGUgY2xhc3M9ImNscy00IiBjeD0iMTc3LjA1IiBjeT0iMjA3LjExIiByPSI0LjEzIi8+CiAgPHBhdGggY2xhc3M9ImNscy00IiBkPSJNMzQyLjAxLDI5NGMwLDIuMjgtMS44NSw0LjEzLTQuMTMsNC4xMy0uMjIsMC0uNDMtLjAyLS42NS0uMDUtMS41OS0xLjEyLTIuNTctMS44Ny00LjUyLTEuODdzLTIuOTYuODktNC41NywxLjkxYy0uMDguMDItLjE2LjAyLS4yNC4wMi0yLjI4LDAtNC4xMy0xLjg1LTQuMTMtNC4xMywwLTEuMDIuMzctMS45NS45OC0yLjY3aDBzMCwwLDAtLjAyYy4yNy0uMzEuNTgtLjU5LjkzLS44MS44Ni0uODMsMS40Mi0xLjYyLDEuNzktMi4yNC42OC0xLjE1LjY4LTEuNjcsMS40Ny0yLjYyLjQ5LS42LDEuMzctMS42NCwyLjg2LTEuOTksMS44Ni0uNDMsMy4zOS41MywzLjczLjczLDEuNDUuOTEsMi4wOCwyLjMsMi4yNiwyLjczLjMuNjcuMjQuODkuNTUsMS41LjY4LDEuMzQsMS42NCwxLjQsMi4wNiwyLjA5aDBjLjk4Ljc3LDEuNjEsMS45NSwxLjYxLDMuMjlaIi8+CiAgPGNpcmNsZSBjbGFzcz0iY2xzLTQiIGN4PSIzMjcuNzQiIGN5PSIyOTQuMzYiIHI9IjMuNzgiLz4KICA8Y2lyY2xlIGNsYXNzPSJjbHMtNCIgY3g9IjMzNy44OCIgY3k9IjI5NC4zNiIgcj0iMy43OCIvPgogIDxlbGxpcHNlIGNsYXNzPSJjbHMtNCIgY3g9IjMzNy4zOCIgY3k9IjI3OC4zNCIgcng9IjQuNSIgcnk9IjMuNjIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDYuNDggNTY0LjM1KSByb3RhdGUoLTgwLjM2KSIvPgogIDxlbGxpcHNlIGNsYXNzPSJjbHMtNCIgY3g9IjMyOC4yMiIgY3k9IjI3OC4zNCIgcng9IjMuNjIiIHJ5PSI0LjUiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC00MS45NyA1OC44OCkgcm90YXRlKC05LjY0KSIvPgogIDxlbGxpcHNlIGNsYXNzPSJjbHMtNCIgY3g9IjM0My41NCIgY3k9IjI4NS4yMSIgcng9IjMuODUiIHJ5PSIzLjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQuODQgNTc2LjE0KSByb3RhdGUoLTgwLjM2KSIvPgogIDxlbGxpcHNlIGNsYXNzPSJjbHMtNCIgY3g9IjMyMi4yOCIgY3k9IjI4NC44OCIgcng9IjMuMSIgcnk9IjMuODUiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC00My4xNSA1Ny45OCkgcm90YXRlKC05LjY0KSIvPgogIDxjaXJjbGUgY2xhc3M9ImNscy0xIiBjeD0iMzMyLjgiIGN5PSIyODQuODgiIHI9IjE3LjQ3Ii8+CiAgPGc+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTQiIGQ9Ik0yMDQuNjQsMzA1LjA4Yy00LjMzLDAtOC4xMi0uODYtMTEuMzUtMi41OS0zLjI0LTEuNzMtNS43NC00LjA5LTcuNTItNy4wOC0xLjc4LTIuOTktMi42Ny02LjQ0LTIuNjctMTAuMzNzLjg2LTcuMzQsMi41OS0xMC4zM2MxLjczLTIuOTksNC4xMS01LjM1LDcuMTUtNy4wOCwzLjA0LTEuNzMsNi41MS0yLjU5LDEwLjQtMi41OXM3LjE4Ljg0LDEwLjE1LDIuNTIsNS4zLDQuMDMsNy4wMSw3LjA0YzEuNywzLjAyLDIuNTUsNi41OSwyLjU1LDEwLjczLDAsLjM0LS4wMS43Ny0uMDQsMS4yOC0uMDMuNTEtLjA2Ljk2LS4xMSwxLjM1aC0zMi40OHYtNi4wNmgyNy42N2wtMy42NSwxLjljLjA1LTIuMTktLjQtNC4xNS0xLjM1LTUuODgtLjk1LTEuNzMtMi4yNS0zLjA3LTMuOTEtNC4wMS0xLjY2LS45NS0zLjYtMS40Mi01Ljg0LTEuNDJzLTQuMTUuNDctNS44OCwxLjQyYy0xLjczLjk1LTMuMDUsMi4zLTMuOTgsNC4wNS0uOTIsMS43NS0xLjM5LDMuNzctMS4zOSw2LjA2djEuNDZjMCwyLjM0LjUyLDQuNDEsMS41Nyw2LjIxLDEuMDUsMS44LDIuNTQsMy4yLDQuNDksNC4yLDEuOTUsMSw0LjIxLDEuNSw2Ljc5LDEuNSwyLjE5LDAsNC4xNi0uMzYsNS45MS0xLjA5LDEuNzUtLjczLDMuMzEtMS44LDQuNjctMy4yMWw0Ljk2LDUuNjljLTEuOCwyLjA0LTQuMDMsMy42LTYuNjgsNC42Ny0yLjY1LDEuMDctNS42OCwxLjYxLTkuMDksMS42MVoiLz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtNCIgZD0iTTIyNS4wOCwyNzIuODl2LTcuM2gyNS45OXY3LjNoLTI1Ljk5Wk0yNDQuOTMsMzA1LjA4Yy00LjI4LDAtNy41OS0xLjExLTkuOTMtMy4zMi0yLjM0LTIuMjEtMy41LTUuNDYtMy41LTkuNzV2LTM1LjA0aDkuMDV2MzQuNzVjMCwxLjg1LjQ5LDMuMjgsMS40Niw0LjMxLjk3LDEuMDIsMi4zNCwxLjUzLDQuMDksMS41MywyLDAsMy42NS0uNTQsNC45Ni0xLjYxbDIuNjMsNi41Yy0xLjEyLjg4LTIuNDYsMS41My00LjAxLDEuOTctMS41Ni40NC0zLjE0LjY2LTQuNzUuNjZaIi8+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTQiIGQ9Ik0yNjQuMzUsMjU5LjE3Yy0xLjcsMC0zLjEtLjU0LTQuMi0xLjYxLTEuMS0xLjA3LTEuNjQtMi4zOC0xLjY0LTMuOTQsMC0xLjQ2LjU1LTIuNzMsMS42NC0zLjgsMS4wOS0xLjA3LDIuNDktMS42MSw0LjItMS42MXMzLjEuNSw0LjIsMS41YzEuMDksMSwxLjY0LDIuMjgsMS42NCwzLjgzcy0uNTQsMi44OC0xLjYxLDMuOThjLTEuMDcsMS4xLTIuNDgsMS42NC00LjIzLDEuNjRaTTI1OS44MywzMDQuNTd2LTM4Ljk4aDkuMDV2MzguOThoLTkuMDVaIi8+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTQiIGQ9Ik0yOTcuMjcsMzA1LjA4Yy00LjA5LDAtNy43My0uODYtMTAuOTEtMi41OXMtNS42OC00LjA5LTcuNDgtNy4wOGMtMS44LTIuOTktMi43LTYuNDQtMi43LTEwLjMzcy45LTcuNCwyLjctMTAuMzdjMS44LTIuOTcsNC4yOS01LjMyLDcuNDgtNy4wNCwzLjE5LTEuNzMsNi44My0yLjU5LDEwLjkxLTIuNTksMy43NSwwLDcuMDguNzgsMTAsMi4zNCwyLjkyLDEuNTYsNS4xMSwzLjgyLDYuNTcsNi43OWwtNi45NCw0LjA5Yy0xLjE3LTEuOC0yLjU5LTMuMTUtNC4yNy00LjA1cy0zLjQ5LTEuMzUtNS40NC0xLjM1Yy0yLjI0LDAtNC4yNi41LTYuMDYsMS41LTEuOCwxLTMuMjEsMi40MS00LjIzLDQuMjMtMS4wMiwxLjgyLTEuNTMsMy45OC0xLjUzLDYuNDZzLjUxLDQuNjUsMS41Myw2LjVjMS4wMiwxLjg1LDIuNDMsMy4yNyw0LjIzLDQuMjcsMS44LDEsMy44MiwxLjUsNi4wNiwxLjUsMS45NSwwLDMuNzYtLjQ1LDUuNDQtMS4zNXMzLjEtMi4yNyw0LjI3LTQuMTJsNi45NCw0LjA5Yy0xLjQ2LDIuOTItMy42NSw1LjE3LTYuNTcsNi43NS0yLjkyLDEuNTgtNi4yNSwyLjM3LTEwLDIuMzdaIi8+CiAgPC9nPgogIDxwYXRoIGNsYXNzPSJjbHMtNCIgZD0iTTM1Ni4zMywzMDQuNTd2LTU0LjE3aDkuMDV2NTQuMTdoLTkuMDVaIi8+Cjwvc3ZnPg==" />
          <br>
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
              <span>${p.cantidad} x ${formatoCOP(p.precioVenta - (p.descuentoUnitario || 0))} </span>
              <span>${formatoCOP(
                p.cantidad * (p.precioVenta - (p.descuentoUnitario || 0)),
              )}</span>

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

setTimeout(() => {
  ventana.focus();
  ventana.print();
  ventana.close();
}, 500);
}

/* =====================================================
   FORMATO COP
===================================================== */
function formatoCOP(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor);
}



function agregarAlCarrito(producto) {
  const existente = carrito.find(
    (p) => p.idProducto == producto.idProducto
  );

  if (existente) {
    if (existente.cantidad < existente.stockInicial) {
      existente.cantidad++;
    }
  } else {
    carrito.push({
      ...producto,
      cantidad: 1,
      stockInicial: producto.cantidad,
      descuentoUnitario: 0,
    });
  }

  actualizarCarrito();
}



/* =====================================================
   FILTROS
===================================================== */
buscador?.addEventListener("input", (e) => {
  const texto = e.target.value.trim();

  const coincidencias = productos.filter((p) => {
    const nombre = p.nombreProducto?.toLowerCase() || "";
    const codigo = String(p.codigoBarras || "");

    return (
      nombre.includes(texto.toLowerCase()) ||
      codigo.includes(texto)
    );
  });

  renderProductos(coincidencias);

  // 🔥 Si coincide EXACTAMENTE con código de barras
  const exacto = productos.find(
    (p) => String(p.codigoBarras) === texto
  );

  if (exacto) {
    agregarAlCarrito(exacto);
    buscador.value = "";
  }
});


function cargarCategorias() {
  if (!filtroCategoria) return;

  const categorias = [...new Set(productos.map((p) => p.categoriaNombre))];

  filtroCategoria.innerHTML = `<option value="">Todas las categorías</option>`;

  categorias.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    filtroCategoria.appendChild(option);
  });
}

filtroCategoria?.addEventListener("change", (e) => {
  const categoria = e.target.value;

  if (!categoria) {
    renderProductos(productos);
    return;
  }

  const filtrados = productos.filter((p) => p.categoriaNombre === categoria);

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
    const isClickInside =
      e.target.closest(".cart-header") ||
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
