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

export async function categoriaTieneProductos(idCategoria) {
  const { data, error } = await supabase
    .from("productos")
    .select("idProducto")
    .eq("categoria_id", idCategoria)
    .limit(1);

  if (error) {
    console.error(error);
    return true; // por seguridad
  }

  return data.length > 0;
}