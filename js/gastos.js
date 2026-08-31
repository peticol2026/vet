import { supabase } from "./config/supabase.js";

import { 
  obtenerTotalVentas,
  obtenerTotalVentasNequi,
  obtenerTotalVentasEfectivo 
} from "./services/ventas.service.js";
import {
  obtenerGastosNequi,
  crearGastoNequi,
  eliminarGastoNequi,
  eliminarTodosLosGastosNequi,
  eliminarGastosNequiPorRango
} from "./services/gastosNequi.service.js";

import {
  obtenerGastos,
  crearGasto,
  eliminarTodosLosGastos,
  eliminarGastosPorRango,
  eliminarGasto
} from "./services/gastos.service.js";

import { initBackButton } from "./ui/backButton.ui.js";


let rolUsuario = null;

/* =========================
   ELEMENTOS DOM
========================= */

const totalVentasEl = document.getElementById("totalVentas");
const totalGastosEl = document.getElementById("totalGastos");
const totalFinalEl = document.getElementById("totalFinal");
const tablaGastos = document.getElementById("tablaGastos");
const btnGuardar = document.getElementById("btnGuardarGasto");
const btnEliminarTodos = document.getElementById("btnEliminarTodos");
const btnEliminarRango = document.getElementById("btnEliminarRango");

const modal = document.getElementById("modalEliminar");
const modalMensaje = document.getElementById("modalMensaje");
const btnCancelar = document.getElementById("btnCancelarEliminar");
const btnConfirmar = document.getElementById("btnConfirmarEliminar");
const tablaNequi = document.getElementById("tablaGastosNequi");
const totalNequiEl = document.getElementById("totalNequi");
const totalNequiTablaEl = document.getElementById("totalNequiTabla");

const totalGastosEfectivoEl = document.getElementById("totalGastosEfectivo");
const totalVentasEfectivoEl = document.getElementById("totalVentasEfectivo");
const saldoEfectivoEl = document.getElementById("saldoEfectivo");

const totalVentasNequiEl =
  document.getElementById("totalVentasNequi");

const saldoNequiEl =
  document.getElementById("saldoNequi");

const toggleTheme = document.getElementById("toggleTheme");

/* =========================
   FORMATO
========================= */

function formatoCOP(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0
  }).format(valor);
}

/* =========================
   RESUMEN
========================= */

async function cargarResumen(fechaInicio = null, fechaFin = null) {

  let inicio = null;
  let fin = null;

  if (fechaInicio && fechaFin) {
    inicio = fechaInicio + "T00:00:00";
    fin = fechaFin + "T23:59:59";
  }

  // 1. Consultar BD directamente
  const totalVentasGlobal = await obtenerTotalVentas(inicio, fin);
  const totalVentasNequi = await obtenerTotalVentasNequi(inicio, fin);
  const totalVentasEfectivo = await obtenerTotalVentasEfectivo(inicio, fin);

  const gastos = await obtenerGastos(inicio, fin);
  const gastosNequi = await obtenerGastosNequi(inicio, fin);

  // 2. Sumar Gastos
  let totalGastosNequi = 0;
  gastosNequi.forEach(g => totalGastosNequi += Number(g.monto));

  let totalGastosEfectivo = 0;
  gastos.forEach(g => totalGastosEfectivo += Number(g.monto));

  // 3. Calcular Saldos
  const saldoNequi = totalVentasNequi - totalGastosNequi;
  const saldoEfectivo = totalVentasEfectivo - totalGastosEfectivo;

  // 4. Pintar datos Nequi
  if (totalNequiEl) totalNequiEl.textContent = formatoCOP(totalGastosNequi);
  if (totalVentasNequiEl) totalVentasNequiEl.textContent = formatoCOP(totalVentasNequi);
  if (saldoNequiEl) saldoNequiEl.textContent = formatoCOP(saldoNequi);

  // 5. Pintar datos Efectivo
  if (totalGastosEfectivoEl) totalGastosEfectivoEl.textContent = formatoCOP(totalGastosEfectivo);
  if (totalVentasEfectivoEl) totalVentasEfectivoEl.textContent = formatoCOP(totalVentasEfectivo);
  if (saldoEfectivoEl) saldoEfectivoEl.textContent = formatoCOP(saldoEfectivo);

  // 6. Tarjetas Globales (Superior)
  const totalGastosGlobal = totalGastosEfectivo + totalGastosNequi;
  const totalFinalGlobal = totalVentasGlobal - totalGastosGlobal;

  totalVentasEl.textContent = formatoCOP(totalVentasGlobal);
  totalGastosEl.textContent = formatoCOP(totalGastosGlobal);
  totalFinalEl.textContent = formatoCOP(totalFinalGlobal);

  totalFinalEl.classList.remove("saldo-positivo", "saldo-negativo");
  if (totalFinalGlobal >= 0) {
    totalFinalEl.classList.add("saldo-positivo");
  } else {
    totalFinalEl.classList.add("saldo-negativo");
  }

  renderGastos(gastos);
  renderGastosNequi(gastosNequi);
}

/* =========================
   RENDER TABLA
========================= */

function renderGastos(gastos) {

  tablaGastos.innerHTML = "";

  gastos.forEach(gasto => {

    tablaGastos.innerHTML += `
      <tr data-id="${gasto.id}">
        <td>${new Date(gasto.fecha).toLocaleString("es-CO")}</td>
        <td>${gasto.descripcion || "-"}</td>
        <td>${formatoCOP(gasto.monto)}</td>
        <td>${gasto.registrado_por}</td>
        <td>${gasto.tipo}</td>
        <td ${rolUsuario === "Trabajador" ? 'style="display:none"' : ""}>
            ${
              rolUsuario !== "Trabajador"
                ? `<button class="btn-delete-row" data-id="${gasto.id}">✕</button>`
                : ""
            }
        </td>

      </tr>
    `;
  });
}

function renderGastosNequi(gastosNequi) {

  if (!tablaNequi) return;

  tablaNequi.innerHTML = "";

  let total = 0;

  gastosNequi.forEach(gasto => {

    total += Number(gasto.monto);

    tablaNequi.innerHTML += `
      <tr data-id="${gasto.id}">
        <td>${new Date(gasto.fecha).toLocaleString("es-CO")}</td>
        <td>${gasto.descripcion || "-"}</td>
        <td>${formatoCOP(gasto.monto)}</td>
        <td>${gasto.registrado_por || "-"}</td>
        <td>${gasto.tipo || "Nequi"}</td>
        <td ${rolUsuario === "Trabajador" ? 'style="display:none"' : ""}>
          ${
            rolUsuario !== "Trabajador"
              ? `<button class="btn-delete-row btn-delete-nequi" data-id="${gasto.id}">✕</button>`
              : ""
          }
        </td>
      </tr>
    `;
  });

  if (totalNequiTablaEl) {
    totalNequiTablaEl.textContent = formatoCOP(total);
  }
}

/* =========================
   GUARDAR GASTO
========================= */

btnGuardar.addEventListener("click", async () => {

  const tipo = document.getElementById("tipoGasto").value;
  const descripcion = document.getElementById("descripcionGasto").value;
  const monto = document.getElementById("montoGasto").value;
  const registradoPor = document.getElementById("registradoPor").value;

  if (!tipo || !monto || !registradoPor) {
    alert("Completa los campos obligatorios");
    return;
  }

 let ok = false;

if (tipo === "Nequi") {
  ok = await crearGastoNequi({
    tipo,
    descripcion,
    monto,
    registrado_por: registradoPor
  });
} else {
  ok = await crearGasto({
    tipo,
    descripcion,
    monto,
    registrado_por: registradoPor
  });
}

  if (ok) {
    document.getElementById("tipoGasto").value = "";
    document.getElementById("descripcionGasto").value = "";
    document.getElementById("montoGasto").value = "";
    document.getElementById("registradoPor").value = "";
    cargarResumen();
  }
});

/* =========================
   MODAL REUTILIZABLE
========================= */

let accionConfirmada = null;

function abrirModal(mensaje, callback) {
  modalMensaje.textContent = mensaje;
  accionConfirmada = callback;
  modal.classList.add("show");
}

function cerrarModal() {
  modal.classList.remove("show");
  accionConfirmada = null;
}

btnCancelar.addEventListener("click", cerrarModal);

btnConfirmar.addEventListener("click", async () => {
  if (accionConfirmada) await accionConfirmada();
  cerrarModal();
});

modal.addEventListener("click", e => {
  if (e.target === modal) cerrarModal();
});

/* =========================
   ELIMINAR INDIVIDUAL
========================= */

tablaGastos.addEventListener("click", (e) => {

  const btn = e.target.closest(".btn-delete-row");
  if (!btn) return;

  const id = btn.dataset.id;
  const fila = btn.closest("tr");

  abrirModal("¿Seguro que deseas eliminar este gasto?", async () => {

    fila.classList.add("fade-out");

    setTimeout(async () => {
      await eliminarGasto(id);
      cargarResumen();
    }, 300);

  });
});

/* =========================
   ELIMINAR TODOS
========================= */

btnEliminarTodos.addEventListener("click", async () => {

  const gastos = await obtenerGastos();
  const gastosNequi = await obtenerGastosNequi();

  const totalRegistros = gastos.length + gastosNequi.length;

  if (!totalRegistros) {
    alert("No hay gastos para eliminar.");
    return;
  }

  abrirModal(
    `Se eliminarán ${totalRegistros} registros. ¿Continuar?`,
    async () => {

      document.querySelectorAll("#tablaGastos tr, #tablaGastosNequi tr")
        .forEach(tr => tr.classList.add("fade-out"));

      setTimeout(async () => {
        await eliminarTodosLosGastos();
        await eliminarTodosLosGastosNequi();
        cargarResumen();
      }, 400);

    }
  );
});

/* =========================
   ELIMINAR POR RANGO
========================= */

btnEliminarRango.addEventListener("click", async () => {

  const fechaInicio = document.getElementById("fechaInicio").value;
  const fechaFin = document.getElementById("fechaFin").value;

  if (!fechaInicio || !fechaFin) {
    alert("Selecciona ambas fechas.");
    return;
  }

  const inicio = fechaInicio + "T00:00:00";
  const fin = fechaFin + "T23:59:59";

  const gastos = await obtenerGastos(inicio, fin);
  const gastosNequi = await obtenerGastosNequi(inicio, fin);

  const totalRegistros = gastos.length + gastosNequi.length;

  if (!totalRegistros) {
    alert("No hay registros en ese rango.");
    return;
  }

  abrirModal(
    `Se eliminarán ${totalRegistros} registros desde ${fechaInicio} hasta ${fechaFin}.`,
    async () => {

      document.querySelectorAll("#tablaGastos tr, #tablaGastosNequi tr")
        .forEach(tr => tr.classList.add("fade-out"));

      setTimeout(async () => {
        await eliminarGastosPorRango(inicio, fin);
        await eliminarGastosNequiPorRango(inicio, fin);
        cargarResumen();
      }, 400);

    }
  );
});

/* =========================
   FILTROS RÁPIDOS
========================= */

document.querySelectorAll(".filtros-tiempo button")
  .forEach(btn => {

    btn.addEventListener("click", () => {

      document.querySelectorAll(".filtros-tiempo button")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");

      const filtro = btn.dataset.filtro;
      const { inicio, fin } = obtenerRango(filtro);

      cargarResumen(
        inicio ? inicio.split("T")[0] : null,
        fin ? fin.split("T")[0] : null
      );
    });
  });

function obtenerRango(filtro) {

  const ahora = new Date();
  let inicio;
  let fin = new Date();

  switch (filtro) {
    case "dia":
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      break;

    case "semana":
      inicio = new Date(ahora);
      inicio.setDate(ahora.getDate() - ahora.getDay());
      inicio.setHours(0,0,0,0);
      break;

    case "mes":
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      break;

    case "anio":
      inicio = new Date(ahora.getFullYear(), 0, 1);
      break;

    default:
      return { inicio: null, fin: null };
  }

  return {
    inicio: inicio.toISOString(),
    fin: fin.toISOString()
  };
}

/* =========================
   MODO CLARO / OSCURO
========================= */

if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light-mode");
  toggleTheme.checked = true;
}

toggleTheme.addEventListener("change", () => {

  if (toggleTheme.checked) {
    document.body.classList.add("light-mode");
    localStorage.setItem("theme", "light");
  } else {
    document.body.classList.remove("light-mode");
    localStorage.setItem("theme", "dark");
  }
});

function aplicarPermisosUI() {
  if (rolUsuario === "Trabajador") {

    btnEliminarTodos.style.display = "none";
    btnEliminarRango.style.display = "none";

    document.querySelectorAll("th:last-child").forEach(th => {
      th.style.display = "none";
    });

  }
}


async function obtenerRolUsuario() {
  const { data: { user } } = await supabase.auth.getUser();
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


tablaNequi.addEventListener("click", (e) => {

  const btn = e.target.closest(".btn-delete-nequi");
  if (!btn) return;

  const id = btn.dataset.id;
  const fila = btn.closest("tr");

  abrirModal("¿Eliminar este gasto Nequi?", async () => {

    fila.classList.add("fade-out");

    setTimeout(async () => {
      await eliminarGastoNequi(id);
      cargarResumen();
    }, 300);

  });

});



/* =========================
   INIT
========================= */

init();

async function init() {
  await obtenerRolUsuario();
  await cargarResumen();
  initBackButton();
}
