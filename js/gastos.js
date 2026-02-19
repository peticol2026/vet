import { supabase } from "./config/supabase.js";

import { obtenerTotalVentas } 
from "./services/ventas.service.js";

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

  const totalVentas = await obtenerTotalVentas(inicio, fin);
  const gastos = await obtenerGastos(inicio, fin);

  let totalGastos = 0;
  gastos.forEach(g => totalGastos += Number(g.monto));

  const totalFinal = totalVentas - totalGastos;

  totalVentasEl.textContent = formatoCOP(totalVentas);
  totalGastosEl.textContent = formatoCOP(totalGastos);
  totalFinalEl.textContent = formatoCOP(totalFinal);

  totalFinalEl.classList.remove("saldo-positivo", "saldo-negativo");

  if (totalFinal >= 0) {
    totalFinalEl.classList.add("saldo-positivo");
  } else {
    totalFinalEl.classList.add("saldo-negativo");
  }

  renderGastos(gastos);
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

  const ok = await crearGasto({
    tipo,
    descripcion,
    monto,
    registrado_por: registradoPor
  });

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

  if (!gastos.length) {
    alert("No hay gastos para eliminar.");
    return;
  }

  abrirModal(
    `Se eliminarán ${gastos.length} registros. ¿Continuar?`,
    async () => {

      document.querySelectorAll("#tablaGastos tr")
        .forEach(tr => tr.classList.add("fade-out"));

      setTimeout(async () => {
        await eliminarTodosLosGastos();
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

  if (!gastos.length) {
    alert("No hay registros en ese rango.");
    return;
  }

  abrirModal(
    `Se eliminarán ${gastos.length} registros desde ${fechaInicio} hasta ${fechaFin}.`,
    async () => {

      document.querySelectorAll("#tablaGastos tr")
        .forEach(tr => tr.classList.add("fade-out"));

      setTimeout(async () => {
        await eliminarGastosPorRango(inicio, fin);
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

    // Ocultar botón eliminar todos
    btnEliminarTodos.style.display = "none";

    // Ocultar botón eliminar por rango
    btnEliminarRango.style.display = "none";

    // Ocultar columna Acciones (thead)
    const thAcciones = document.querySelector("th:last-child");
    if (thAcciones) thAcciones.style.display = "none";
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


/* =========================
   INIT
========================= */

init();

async function init() {
  await obtenerRolUsuario();
  await cargarResumen();
  initBackButton();
}
