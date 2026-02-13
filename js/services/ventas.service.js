import { supabase } from "../config/supabase.js";

export async function obtenerTotalVentas(fechaInicio, fechaFin) {

  let query = supabase
    .from("ventas")
    .select(`
      fecha,
      detalle_venta (
        cantidad,
        precio
      )
    `);

  if (fechaInicio && fechaFin) {
    query = query
      .gte("fecha", fechaInicio)
      .lte("fecha", fechaFin);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error obteniendo ventas:", error);
    return 0;
  }

  let totalGeneral = 0;

  data.forEach(venta => {
    venta.detalle_venta.forEach(item => {
      totalGeneral += item.cantidad * item.precio;
    });
  });

  return totalGeneral;
}