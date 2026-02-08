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