import { supabase } from "../config/supabase.js";


export async function login(correo, clave) {

    const {data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("correo", correo)
    .eq("clave", clave)
    .single();


   if (error) {
    throw new Error("Correo o contraseña incorrectos");
  }

  return data; 
}