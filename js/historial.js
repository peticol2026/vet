import { supabase } from "./config/supabase.js";
import { initBackButton } from "./ui/backButton.ui.js";

const tabla = document.getElementById("tablaVentas");

const fechaInicioInput = document.getElementById("fechaInicio");
const fechaFinInput = document.getElementById("fechaFin");
const filtroMetodo = document.getElementById("filtroMetodo");
const filtroCategoria = document.getElementById("filtroCategoria");

const btnEliminarRango = document.getElementById("btnEliminarRango");

let rolUsuario = null;

/* ===============================
   FILTROS AUTOMÁTICOS
=============================== */

fechaInicioInput.addEventListener("change", cargarVentas);
fechaFinInput.addEventListener("change", cargarVentas);
filtroMetodo.addEventListener("change", cargarVentas);
filtroCategoria.addEventListener("input", cargarVentas);

/* ===============================
   INIT
=============================== */

init();

async function init() {
  await obtenerRolUsuario();
  await cargarVentas();
  initBackButton();
}

/* ===============================
   ELIMINAR INDIVIDUAL
=============================== */

tabla.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-delete");
  if (!btn) return;

  const id = btn.dataset.id;
  const confirmar = confirm("¿Eliminar esta venta?");
  if (!confirmar) return;

  try {
    await supabase.from("detalle_venta").delete().eq("idventa", id);
    await supabase.from("ventas").delete().eq("idventa", id);

    alert("Venta eliminada correctamente");
    cargarVentas();
  } catch (err) {
    console.error(err);
    alert("Error eliminando venta");
  }
});

/* ===============================
   CARGAR VENTAS
=============================== */

async function cargarVentas() {
  tabla.innerHTML = "";

  const fechaInicio = fechaInicioInput.value;
  const fechaFin = fechaFinInput.value;
  const metodoFiltro = filtroMetodo.value;
  const categoriaFiltro = filtroCategoria.value.toLowerCase();

  let query = supabase
    .from("ventas")
    .select(
      `
      idventa,
      fecha,
      metodo_pago,
      usuarios ( nombre ),
      detalle_venta (
        cantidad,
        precio,
        ganancia,
        descuento_unitario,
        productos (
          nombreProducto,
          categorias ( nombre )
        )
      )
    `,
    )
    .order("fecha", { ascending: false });

  if (metodoFiltro) query = query.eq("metodo_pago", metodoFiltro);
  if (fechaInicio) query = query.gte("fecha", fechaInicio);
  if (fechaFin) query = query.lte("fecha", fechaFin + "T23:59:59");

  const { data, error } = await query;
  if (error) {
    console.error(error);
    return;
  }

  let totalGeneral = 0;
  let totalGananciaGeneral = 0;
  let totalDescuentosGeneral = 0;
  let totalEfectivo = 0;
  let totalNequi = 0;
  let totalTarjeta = 0;
  let totalTransferencia = 0;

  data.forEach((venta) => {
    const fechaVenta = new Date(venta.fecha);
    const metodo = venta.metodo_pago;

    venta.detalle_venta.forEach((item) => {
      const categoria = item.productos?.categorias?.nombre || "";

      if (categoriaFiltro && !categoria.toLowerCase().includes(categoriaFiltro))
        return;

      const totalItem = item.cantidad * item.precio;
      const gananciaItem = item.ganancia || 0;

      const descuentoUnit = item.descuento_unitario || 0;
      const descuentoTotalItem = descuentoUnit * item.cantidad;

      totalGeneral += totalItem;
      totalGananciaGeneral += gananciaItem;
      totalDescuentosGeneral += descuentoTotalItem;

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

          <!-- DESCUENTO (solo admin) -->
          <td ${rolUsuario === "Trabajador" ? 'style="display:none"' : ""}>
            ${rolUsuario !== "Trabajador" ? formatoCOP(descuentoTotalItem) : ""}
          </td>

          <!-- GANANCIA (solo admin) -->
          <td ${rolUsuario === "Trabajador" ? 'style="display:none"' : ""}>
            ${rolUsuario !== "Trabajador" ? formatoCOP(gananciaItem) : ""}
          </td>

          <!-- ACCIONES (solo admin) -->
          <td ${rolUsuario === "Trabajador" ? 'style="display:none"' : ""}>
            ${
              rolUsuario !== "Trabajador"
                ? `<button class="btn-delete" data-id="${venta.idventa}">❌</button>`
                : ""
            }
          </td>
        </tr>
      `;
    });
  });

  // RESUMEN
  document.getElementById("totalGeneral").textContent =
    formatoCOP(totalGeneral);

  document.getElementById("totalGanancia").textContent =
    formatoCOP(totalGananciaGeneral);

  const elDescuentos = document.getElementById("totalDescuentos");
  if (elDescuentos) {
    elDescuentos.textContent = formatoCOP(totalDescuentosGeneral);
  }

  document.getElementById("totalEfectivo").textContent =
    formatoCOP(totalEfectivo);

  document.getElementById("totalNequi").textContent = formatoCOP(totalNequi);

  document.getElementById("totalTarjeta").textContent =
    formatoCOP(totalTarjeta);

  document.getElementById("totalTransferencia").textContent =
    formatoCOP(totalTransferencia);
}

/* ===============================
   ELIMINAR POR RANGO
=============================== */

btnEliminarRango.addEventListener("click", eliminarPorRango);

async function eliminarPorRango() {
  const fechaInicio = fechaInicioInput.value;
  const fechaFin = fechaFinInput.value;

  if (!fechaInicio || !fechaFin) {
    alert("Debes seleccionar fecha inicio y fecha fin");
    return;
  }

  const confirmar = confirm(
    `¿Seguro que deseas eliminar las ventas desde ${fechaInicio} hasta ${fechaFin}?`,
  );

  if (!confirmar) return;

  try {
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

    const ids = ventas.map((v) => v.idventa);

    await supabase.from("detalle_venta").delete().in("idventa", ids);
    await supabase.from("ventas").delete().in("idventa", ids);

    alert("Ventas eliminadas correctamente ✅");
    cargarVentas();
  } catch (err) {
    console.error(err);
    alert("Error al eliminar ventas");
  }
}

/* ===============================
   FORMATO COP
=============================== */

function formatoCOP(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor);
}

/* ===============================
   PERMISOS POR ROL
=============================== */

function aplicarPermisosUI() {
  if (rolUsuario === "Trabajador") {
    btnEliminarRango.style.display = "none";

    const thAcciones = document.querySelector("th:last-child");
    if (thAcciones) thAcciones.style.display = "none";

    const thGanancia = document.querySelector("th:nth-last-child(2)");
    if (thGanancia) thGanancia.style.display = "none";

    const thDescuento = document.querySelector("th:nth-last-child(3)");
    if (thDescuento) thDescuento.style.display = "none";

    const cardGanancia = document.getElementById("cardGanancia");
    if (cardGanancia) cardGanancia.style.display = "none";

    const cardDescuentos = document.getElementById("cardDescuentos");
    if (cardDescuentos) cardDescuentos.style.display = "none";
  }
}

/* ===============================
   OBTENER ROL
=============================== */

async function obtenerRolUsuario() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("auth_id", user.id)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  rolUsuario = data.rol;
  aplicarPermisosUI();
}

/* ===============================
   MODO CLARO
=============================== */

const toggleTheme = document.getElementById("toggleTheme");

if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light-mode");
  toggleTheme.checked = true;
}

toggleTheme.addEventListener("change", () => {
  document.body.classList.toggle("light-mode");

  if (document.body.classList.contains("light-mode")) {
    localStorage.setItem("theme", "light");
  } else {
    localStorage.setItem("theme", "dark");
  }
});
