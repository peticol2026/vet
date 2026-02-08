import { supabase } from "../config/supabase.js";




export async function  obtenerProductos () {

            const {data, error } = await supabase

                .from("productos")
                .select(`          
                    idProducto,
                    nombreProducto,
                    precioCosto,
                    precioVenta,
                    cantidad,
                    fechaVencimiento,
                    idUsuario,
                    codigoBarras,
                    imagen,
                    categoria  
                    `);

                    if(error){
                        console.error("Error al obtener productos:", error);
                        return[];
                    }
                return data;

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
