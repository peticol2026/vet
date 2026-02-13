import { obtenerTotalVentas } from "./services/ventas.service.js";
import { obtenerGastos, crearGasto } from "./services/gastos.service.js";

const totalVentasEl = document.getElementById("totalVentas");
const totalGastosEl = document.getElementById("totalGastos");
const totalFinalEl = document.getElementById("totalFinal");
const tablaGastos = document.getElementById("tablaGastos");
const btnGuardar = document.getElementById("btnGuardarGasto");

function formatoCOP(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0
  }).format(valor);
}



async function cargarResumen(filtro = "todo", fechaInicio = null, fechaFin = null) {

  let inicio = null;
  let fin = null;

  if (fechaInicio && fechaFin) {
    inicio = new Date(fechaInicio);
    inicio.setHours(0,0,0,0);

    fin = new Date(fechaFin);
    fin.setHours(23,59,59,999);
  } else {
    const rango = obtenerRango(filtro);
    inicio = rango.inicio ? new Date(rango.inicio) : null;
    fin = rango.fin ? new Date(rango.fin) : null;
  }

  const totalVentas = await obtenerTotalVentas(
    inicio ? inicio.toISOString() : null,
    fin ? fin.toISOString() : null
  );

  const gastos = await obtenerGastos(
    inicio ? inicio.toISOString() : null,
    fin ? fin.toISOString() : null
  );

  let totalGastos = 0;

  gastos.forEach(g => {
    totalGastos += Number(g.monto);
  });

  const totalFinal = totalVentas - totalGastos;

  totalVentasEl.textContent = formatoCOP(totalVentas);
  totalGastosEl.textContent = formatoCOP(totalGastos);
  totalFinalEl.textContent = formatoCOP(totalFinal);

  if (totalFinal < 0) {
    totalFinalEl.classList.add("negativo");
  } else {
    totalFinalEl.classList.remove("negativo");
  }

  renderGastos(gastos);
}


function renderGastos(gastos) {

  tablaGastos.innerHTML = "";

  gastos.forEach(gasto => {

    tablaGastos.innerHTML += `
      <tr>
        <td>${new Date(gasto.fecha).toLocaleString("es-CO")}</td>
        <td>${gasto.tipo}</td>
        <td>${gasto.descripcion || "-"}</td>
        <td>${formatoCOP(gasto.monto)}</td>
        <td>${gasto.registrado_por}</td>
      </tr>
    `;
  });
}

// 🔥 Evento botón guardar
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

cargarResumen();

function obtenerRangoFechas(periodo) {

  const hoy = new Date();
  let inicio = null;

  if (periodo === "dia") {
    inicio = new Date(hoy.setHours(0,0,0,0));
  }

  if (periodo === "semana") {
    const primerDia = hoy.getDate() - hoy.getDay();
    inicio = new Date(hoy.setDate(primerDia));
    inicio.setHours(0,0,0,0);
  }

  if (periodo === "mes") {
    inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  }

  if (periodo === "anio") {
    inicio = new Date(hoy.getFullYear(), 0, 1);
  }

  return inicio;
}

function obtenerRango(filtro) {

  const ahora = new Date();
  let inicio;
  let fin = new Date();

  switch (filtro) {

    case "dia":
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      break;

    case "semana":
      const diaSemana = ahora.getDay();
      inicio = new Date(ahora);
      inicio.setDate(ahora.getDate() - diaSemana);
      inicio.setHours(0,0,0,0);
      break;

    case "mes":
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      break;

    case "anio":
      inicio = new Date(ahora.getFullYear(), 0, 1);
      break;

    case "todo":
    default:
      return { inicio: null, fin: null };
  }

  return {
    inicio: inicio.toISOString(),
    fin: fin.toISOString()
  };
}

document.querySelectorAll(".filtros-tiempo button")
  .forEach(btn => {

    btn.addEventListener("click", () => {
      const filtro = btn.dataset.filtro;
      cargarResumen(filtro);
    });

});

document.getElementById("btnFiltrarFechas")
  .addEventListener("click", () => {

    const fechaInicio = document.getElementById("fechaInicio").value;
    const fechaFin = document.getElementById("fechaFin").value;

    if (!fechaInicio || !fechaFin) {
      alert("Selecciona ambas fechas");
      return;
    }

    cargarResumen(null, fechaInicio, fechaFin);
});


document.querySelectorAll(".filtros-tiempo button")
  .forEach(btn => {

    btn.addEventListener("click", () => {

      document.querySelectorAll(".filtros-tiempo button")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");

      const filtro = btn.dataset.filtro;
      cargarResumen(filtro);
    });

});