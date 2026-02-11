import { supabase } from "./config/supabase.js";

const tabla = document.getElementById("tablaVentas");
const totalGeneralEl = document.getElementById("totalGeneral");

const fechaInicioInput = document.getElementById("fechaInicio");
const fechaFinInput = document.getElementById("fechaFin");
const filtroMetodo = document.getElementById("filtroMetodo");
const filtroCategoria = document.getElementById("filtroCategoria");

document.getElementById("btnFiltrar")
  .addEventListener("click", cargarVentas);

cargarVentas();


async function cargarVentas() {

  tabla.innerHTML = "";

  let query = supabase
  .from("ventas")
  .select(`
  idventa,
  fecha,
  metodo_pago,
  idusuario,
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
`);




  const { data, error } = await query;

  if (error) {
    console.error(error);
    return;
  }

  const fechaInicio = fechaInicioInput.value;
  const fechaFin = fechaFinInput.value;
  const metodoFiltro = filtroMetodo.value;
  const categoriaFiltro = filtroCategoria.value.toLowerCase();

  let totalGeneral = 0;
  let totalEfectivo = 0;
  let totalNequi = 0;
  let totalTarjeta = 0;
  let totalTransferencia = 0;

  data.forEach(venta => {
  


  const fechaVenta = new Date(venta.fecha);

  venta.detalle_venta.forEach(item => {

    const totalItem = item.cantidad * item.precio;
    const metodo = venta.metodo_pago;

    totalGeneral += totalItem;

    if (metodo === "Efectivo") totalEfectivo += totalItem;
    if (metodo === "Nequi") totalNequi += totalItem;
    if (metodo === "Tarjeta") totalTarjeta += totalItem;
    if (metodo === "Transferencia") totalTransferencia += totalItem;

    tabla.innerHTML += `
      <tr>
        <td>${fechaVenta.toLocaleString("es-CO")}</td>
        <td>${item.productos.nombreProducto}</td>
        <td>${item.productos.categoria || "-"}</td>
        <td>${item.cantidad}</td>
        <td>${formatoCOP(item.precio)}</td>
        <td>${formatoCOP(totalItem)}</td>
        <td>${venta.usuarios ? venta.usuarios.nombre : "Sin usuario"}</td>
        <td>${metodo}</td>
      </tr>
    `;
  });

});


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


