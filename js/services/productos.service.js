import { supabase } from "../config/supabase.js";




export async function obtenerProductos() {

  const { data, error } = await supabase
    .from("productos")
    .select(`
  idProducto,
  nombreProducto,
   codigoBarras,
  precioVenta,
  precioCosto,
  cantidad,
  imagen,
  fechaVencimiento,
  categoria_id,
  categorias (
    nombre
  )
`)
;

  if (error) {
    console.error("Error obteniendo productos:", error);
    return [];
  }

  // 🔥 Normalizamos para que ventas.js siga funcionando
  return data.map(p => ({
    ...p,
    categoriaNombre: p.categorias?.nombre || "Sin categoría"
  }));
}




/* =========================
   SUBIR IMAGEN
========================= */
export async function subirImagen(file) {
  const nombre = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("productos")
    .upload(nombre, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from("productos")
    .getPublicUrl(nombre);

  return data.publicUrl;
}

/* =========================
   CREAR PRODUCTO
========================= */
export async function crearProducto(producto) {
  const { error } = await supabase
    .from("productos")
    .insert([producto]);

  if (error) {
    console.error("Error creando producto:", error);
    throw error;
  }
}

/* =========================
   ELIMINAR PRODUCTO
========================= */

export async function eliminarProducto(idProducto) {
  const { error } = await supabase
    .from("productos")
    .delete()
    .eq("idProducto", idProducto);

  if (error) {
    console.error("Error eliminando producto:", error);
    throw error;
  }
}


/* =========================
   ELIMINAR IMAGEN
========================= */

export async function eliminarImagen(url) {
  if (!url) return;

  // Extrae el nombre del archivo desde la URL
  const path = url.split("/productos/")[1];

  const { error } = await supabase.storage
    .from("productos")
    .remove([path]);

  if (error) {
    console.error("Error eliminando imagen:", error);
  }
}



/* =========================
   ACTUALIZAR PRODUCTO
========================= */

export async function actualizarProducto(idProducto, data) {

  const { error } = await supabase

    .from("productos")
    .update(data)
    .eq("idProducto", idProducto);


    if(error) {

      console.error("Error actualizando producto: ", error);
      throw error;
    }
  
}

/* =========================
   VALIDAR PRODUCTO IGUAL (SIN IMAGEN)
========================= */
export async function buscarProductoIgual(producto) {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("nombreProducto", producto.nombreProducto)
    .eq("codigoBarras", producto.codigoBarras)
    .eq("categoria_id", producto.categoria_id)
    .eq("precioCosto", producto.precioCosto)
    .eq("precioVenta", producto.precioVenta)
    .eq("fechaVencimiento", producto.fechaVencimiento)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error buscando producto:", error);
    throw error;
  }

  return data;
}

