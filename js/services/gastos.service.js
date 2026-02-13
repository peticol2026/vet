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
  const { error } = await supabase
    .from("gastos")
    .insert([gasto]);

  if (error) {
    console.error(error);
    return false;
  }

  return true;
}