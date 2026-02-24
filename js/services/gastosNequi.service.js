import { supabase } from "../config/supabase.js";

export async function obtenerGastosNequi(inicio = null, fin = null) {
  let query = supabase.from("gastos_nequi").select("*");

  if (inicio && fin) {
    query = query.gte("fecha", inicio).lte("fecha", fin);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error obteniendo gastos Nequi:", error);
    return [];
  }

  return data;
}

export async function crearGastoNequi(gasto) {
  const { error } = await supabase
    .from("gastos_nequi")
    .insert([gasto]);

  if (error) {
    console.error("Error creando gasto Nequi:", error);
    return false;
  }

  return true;
}

export async function eliminarGastoNequi(id) {

  const { error } = await supabase
    .from("gastos_nequi")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error eliminando gasto Nequi:", error);
    return false;
  }

  return true;
}

export async function eliminarTodosLosGastosNequi() {

  const { error } = await supabase
    .from("gastos_nequi")
    .delete()
    .not("id", "is", null); // 👈 esto sí elimina todo

  if (error) {
    console.error("Error eliminando todos los Nequi:", error);
    return false;
  }

  return true;
}

export async function eliminarGastosNequiPorRango(inicio, fin) {
  const { error } = await supabase
    .from("gastos_nequi")
    .delete()
    .gte("fecha", inicio)
    .lte("fecha", fin);

  if (error) {
    console.error(error);
    return false;
  }

  return true;
}