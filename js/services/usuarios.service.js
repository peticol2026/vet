import { supabase } from "../config/supabase.js";

export async function obtenerServicios() {
    
const { data, error } = await supabase

.from("servicios")
.select("*");

if(error){

    console.error("Error al obtener servicios:" , error);

    return [];

}

return data;

}