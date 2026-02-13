import { supabase } from "./config/supabase.js";

const tabla = document.getElementById("tablaVentas");

const fechaInicioInput = document.getElementById("fechaInicio");
const fechaFinInput = document.getElementById("fechaFin");
const filtroMetodo = document.getElementById("filtroMetodo");
const filtroCategoria = document.getElementById("filtroCategoria");

// 🔥 FILTRO AUTOMÁTICO
fechaInicioInput.addEventListener("change", cargarVentas);
fechaFinInput.addEventListener("change", cargarVentas);
filtroMetodo.addEventListener("change", cargarVentas);
filtroCategoria.addEventListener("input", cargarVentas);

cargarVentas();

async function cargarVentas() {

  tabla.innerHTML = "";

  const fechaInicio = fechaInicioInput.value;
  const fechaFin = fechaFinInput.value;
  const metodoFiltro = filtroMetodo.value;
  const categoriaFiltro = filtroCategoria.value.toLowerCase();

  // 🔥 QUERY DINÁMICA PROFESIONAL
  let query = supabase
    .from("ventas")
    .select(`
      idventa,
      fecha,
      metodo_pago,
      usuarios (
        nombre
      ),
      detalle_venta (
        cantidad,
        precio,
        productos (
          nombreProducto,
          categoria
        )
      )
    `)
    .order("fecha", { ascending: false });

  // ✅ FILTRO MÉTODO (desde base)
  if (metodoFiltro) {
    query = query.eq("metodo_pago", metodoFiltro);
  }

  // ✅ FILTRO FECHA INICIO
  if (fechaInicio) {
    query = query.gte("fecha", fechaInicio);
  }

  // ✅ FILTRO FECHA FIN
  if (fechaFin) {
    query = query.lte("fecha", fechaFin + "T23:59:59");
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return;
  }

  let totalGeneral = 0;
  let totalEfectivo = 0;
  let totalNequi = 0;
  let totalTarjeta = 0;
  let totalTransferencia = 0;

  data.forEach(venta => {

    const fechaVenta = new Date(venta.fecha);
    const metodo = venta.metodo_pago;

    venta.detalle_venta.forEach(item => {

      const categoria = item.productos?.categoria || "";

      // 🔎 FILTRO CATEGORÍA (anidado, se hace aquí)
      if (categoriaFiltro && !categoria.toLowerCase().includes(categoriaFiltro)) return;

      const totalItem = item.cantidad * item.precio;

      totalGeneral += totalItem;

      if (metodo === "Efectivo") totalEfectivo += totalItem;
      if (metodo === "Nequi") totalNequi += totalItem;
      if (metodo === "Tarjeta") totalTarjeta += totalItem;
      if (metodo === "Transferencia") totalTransferencia += totalItem;

      tabla.innerHTML += `
        <tr>
          <td>${fechaVenta.toLocaleString("es-CO")}</td>
          <td>${item.productos?.nombreProducto || "-"}</td>
          <td>${categoria || "-"}</td>
          <td>${item.cantidad}</td>
          <td>${formatoCOP(item.precio)}</td>
          <td>${formatoCOP(totalItem)}</td>
          <td>${venta.usuarios?.nombre || "Sin usuario"}</td>
          <td>${metodo}</td>
        </tr>
      `;
    });

  });

  // 🔥 ACTUALIZAR RESUMEN
  document.getElementById("totalGeneral").textContent = formatoCOP(totalGeneral);
  document.getElementById("totalEfectivo").textContent = formatoCOP(totalEfectivo);
  document.getElementById("totalNequi").textContent = formatoCOP(totalNequi);
  document.getElementById("totalTarjeta").textContent = formatoCOP(totalTarjeta);
  document.getElementById("totalTransferencia").textContent = formatoCOP(totalTransferencia);
}

/* ===============================
   FORMATO PESO COLOMBIANO
=============================== */

function formatoCOP(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0
  }).format(valor);
}

// MODO CLARO

const toggleTheme = document.getElementById("toggleTheme");

// Cargar preferencia guardada
if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light-mode");
  toggleTheme.checked = true;
}

// Cambiar tema
toggleTheme.addEventListener("change", () => {
  document.body.classList.toggle("light-mode");

  if (document.body.classList.contains("light-mode")) {
    localStorage.setItem("theme", "light");
  } else {
    localStorage.setItem("theme", "dark");
  }
});


