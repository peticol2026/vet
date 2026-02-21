import { supabase } from "../config/supabase.js";

export async function obtenerCitas() {
  const { data, error } = await supabase
    .from("citas_peluqueria")
    .select("*")
    .order("fecha_servicio", { ascending: true });

  if (error) {
    console.error("Error obteniendo citas:", error);
    return [];
  }

  return data;
}

export async function crearCita(cita) {
  const { error } = await supabase
    .from("citas_peluqueria")
    .insert([cita]);

  if (error) {
    console.error("Error creando cita:", error);
    throw error;
  }
}

export async function eliminarCita(id) {
  const { error } = await supabase
    .from("citas_peluqueria")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error eliminando cita:", error);
    throw error;
  }
}

export async function eliminarTodasLasCitas() {
  const { error } = await supabase
    .from("citas_peluqueria")
    .delete()
    .not("id", "is", null); // elimina todos los registros

  if (error) {
    console.error("Error eliminando todas las citas:", error);
    throw error;
  }
}