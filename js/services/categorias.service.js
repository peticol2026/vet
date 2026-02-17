import { supabase } from "../config/supabase.js";

export async function obtenerCategorias() {
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .order("nombre");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function crearCategoria(nombre) {
  const { data, error } = await supabase
    .from("categorias")
    .insert([{ nombre }])
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function eliminarCategoria(id) {
  const { error } = await supabase
    .from("categorias")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function categoriaTieneProductos(id) {
  const { count, error } = await supabase
    .from("productos")
    .select("*", { count: "exact", head: true })
    .eq("categoria_id", id);

  if (error) throw error;

  return count > 0;
}