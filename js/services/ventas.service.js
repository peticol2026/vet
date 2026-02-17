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


export async function eliminarVenta(id) {

  // Primero eliminar detalle_venta
  const { error: errorDetalle } = await supabase
    .from("detalle_venta")
    .delete()
    .eq("venta_id", id);

  if (errorDetalle) {
    console.error("Error eliminando detalle:", errorDetalle);
    return false;
  }

  // Luego eliminar venta
  const { error } = await supabase
    .from("ventas")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error eliminando venta:", error);
    return false;
  }

  return true;
}