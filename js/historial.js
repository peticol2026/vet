import { supabase } from "./config/supabase.js";

import { initBackButton } from "./ui/backButton.ui.js";

const tabla = document.getElementById("tablaVentas");

const fechaInicioInput = document.getElementById("fechaInicio");
const fechaFinInput = document.getElementById("fechaFin");
const filtroMetodo = document.getElementById("filtroMetodo");
const filtroCategoria = document.getElementById("filtroCategoria");

const btnEliminarRango = document.getElementById("btnEliminarRango");

// 🔥 FILTRO AUTOMÁTICO
fechaInicioInput.addEventListener("change", cargarVentas);
fechaFinInput.addEventListener("change", cargarVentas);
filtroMetodo.addEventListener("change", cargarVentas);
filtroCategoria.addEventListener("input", cargarVentas);

cargarVentas();

// 🔥 EVENTO ELIMINAR INDIVIDUAL (SOLO UNA VEZ)
tabla.addEventListener("click", async (e) => {

  const btn = e.target.closest(".btn-delete");
  if (!btn) return;

  const id = btn.dataset.id;

  const confirmar = confirm("¿Eliminar esta venta?");

  if (!confirmar) return;

  try {

    await supabase
      .from("detalle_venta")
      .delete()
      .eq("idventa", id);

    await supabase
      .from("ventas")
      .delete()
      .eq("idventa", id);

    alert("Venta eliminada correctamente");

    cargarVentas();

  } catch (err) {
    console.error(err);
    alert("Error eliminando venta");
  }

});

async function cargarVentas() {

  tabla.innerHTML = "";

  const fechaInicio = fechaInicioInput.value;
  const fechaFin = fechaFinInput.value;
  const metodoFiltro = filtroMetodo.value;
  const categoriaFiltro = filtroCategoria.value.toLowerCase();

  // 🔥 QUERY DINÁMICA PROFESIONAL
  let query = supabase
    .from("ventas")
    .select(
      `
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
        categorias (
          nombre
          )
        )
      )
    `,
    )
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

  data.forEach((venta) => {
    const fechaVenta = new Date(venta.fecha);
    const metodo = venta.metodo_pago;

    venta.detalle_venta.forEach((item) => {
      const categoria = item.productos?.categorias?.nombre || "";

      // 🔎 FILTRO CATEGORÍA (anidado, se hace aquí)
      if (categoriaFiltro && !categoria.toLowerCase().includes(categoriaFiltro))
        return;

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
    <td>
      <button class="btn-delete" data-id="${venta.idventa}">
        ❌
      </button>
    </td>
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

  // ELIMINAR POR RANGOS CON EL BOTON

btnEliminarRango.addEventListener("click", eliminarPorRango);

async function eliminarPorRango() {

  const fechaInicio = fechaInicioInput.value;
  const fechaFin = fechaFinInput.value;

  if (!fechaInicio || !fechaFin) {
    alert("Debes seleccionar fecha inicio y fecha fin");
    return;
  }

  const confirmar = confirm(
    `¿Seguro que deseas eliminar las ventas desde ${fechaInicio} hasta ${fechaFin}?`
  );

  if (!confirmar) return;

  try {

    // 1️⃣ Obtener ventas en rango
    const { data: ventas, error } = await supabase
      .from("ventas")
      .select("idventa")
      .gte("fecha", fechaInicio)
      .lte("fecha", fechaFin + "T23:59:59");

    if (error) throw error;

    if (!ventas.length) {
      alert("No hay ventas en ese rango");
      return;
    }

    const ids = ventas.map(v => v.idventa);

    // 2️⃣ Borrar detalle_venta primero
    await supabase
      .from("detalle_venta")
      .delete()
      .in("idventa", ids);

    // 3️⃣ Borrar ventas
    await supabase
      .from("ventas")
      .delete()
      .in("idventa", ids);

    alert("Ventas eliminadas correctamente ✅");

    cargarVentas();

  } catch (err) {
    console.error(err);
    alert("Error al eliminar ventas");
  }
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


initBackButton();
