import { supabase } from "../config/supabase.js";

export async function login(email, password) {

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  console.log("DATA:", data);
  console.log("ERROR:", error);

  if (error) throw error;

  const { data: usuarioDB, error: errorDB } = await supabase
    .from("usuarios")
    .select("*")
    .eq("auth_id", data.user.id)
    .single();

  if (errorDB) throw errorDB;

  return usuarioDB;
}
