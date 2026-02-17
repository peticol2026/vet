import { supabase } from "../config/supabase.js";

export async function obtenerGastos(fechaInicio, fechaFin) {

  let query = supabase
    .from("gastos")
    .select("*")
    .order("fecha", { ascending: false });

  if (fechaInicio && fechaFin) {
    query = query
      .gte("fecha", fechaInicio)
      .lte("fecha", fechaFin);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error obteniendo gastos:", error);
    return [];
  }

  return data;
}

export async function crearGasto(gasto) {

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("gastos")
    .insert([
      {
        ...gasto,
        user_id: user.id
      }
    ]);

  if (error) {
    console.error(error);
    return false;
  }

  return true;
}

export async function eliminarGasto(id) {

  const { error } = await supabase
    .from("gastos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    return false;
  }

  return true;
}

export async function eliminarTodosLosGastos() {

  const { error } = await supabase
    .from("gastos")
    .delete()
    .not("id", "is", null); // borra todo

  if (error) {
    console.error("Error eliminando todos los gastos:", error);
    return false;
  }

  return true;
}

export async function eliminarGastosPorRango(fechaInicio, fechaFin) {

  const { error } = await supabase
    .from("gastos")
    .delete()
    .gte("fecha", fechaInicio)
    .lte("fecha", fechaFin);

  if (error) {
    console.error("Error eliminando por rango:", error);
    return false;
  }

  return true;
}