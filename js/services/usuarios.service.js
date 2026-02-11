import { supabase } from "../config/supabase.js";

/* =========================
   OBTENER TOKEN ACTUAL
========================= */
async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error("No hay sesión activa");
  }

  return data.session.access_token;
}

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
   CREAR USUARIO (EDGE)
========================= */
export async function crearUsuario({ nombre, email, password, rol }) {

  const token = await getAccessToken();

  const { data, error } = await supabase.functions.invoke(
    "crear-usuario",
    {
      body: { nombre, email, password, rol },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (error) throw error;

  return data;
}

/* =========================
   ACTUALIZAR USUARIO (EDGE)
========================= */
export async function actualizarUsuario(datos) {

  const token = await getAccessToken();

  const { data, error } = await supabase.functions.invoke(
    "actualizar-usuario",
    {
      body: datos,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (error) throw error;

  return data;
}

/* =========================
   ELIMINAR USUARIO (EDGE)
========================= */
export async function eliminarUsuario(idusuario) {

  const token = await getAccessToken();

  const { data, error } = await supabase.functions.invoke(
    "eliminar-usuario",
    {
      body: { idusuario },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (error) throw error;

  return data;
}
