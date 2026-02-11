import { supabase } from "../config/supabase.js";

/* =========================
   OBTENER USUARIOS
========================= */
export async function obtenerUsuarios() {

  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener usuarios:", error);
    return [];
  }

  return data;
}

/* =========================
   CREAR USUARIO
========================= */
export async function crearUsuario({ nombre, email, password, rol }) {
  // 1️⃣ Crear en Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error("Error al crear usuario en auth:", authError);
    throw authError;
  }

  const user = authData.user;

  // 2️⃣ Insertar en tu tabla REAL
  const { error } = await supabase.from("usuarios").insert({
    idusuario: authData.user.id,
    nombre,
    correo: email,
    clave: password,
    rol,
  });

  if (error) {
    console.error("Error al insertar usuario:", error);
    throw error;
  }

  return true;
}

/* =========================
   ACTUALIZAR USUARIO
========================= */
export async function actualizarUsuario(id, datos) {

  const { error } = await supabase
    .from("usuarios")
    .update(datos)
    .eq("idusuario", id);  

  if (error) {
    console.error("Error al actualizar usuario:", error);
    throw error;
  }

  return true;
}

/* =========================
   ELIMINAR USUARIO
========================= */
export async function eliminarUsuario(id) {

  const { error } = await supabase
    .from("usuarios")
    .delete()
    .eq("idusuario", id); 

  if (error) {
    console.error("Error al eliminar usuario:", error);
    throw error;
  }

  return true;
}
