import { login } from "../services/auth.service.js";
import {showToast} from "./toast.ui.js"

const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const correo = document.getElementById("correo").value.trim();
  const clave = document.getElementById("clave").value.trim();


  if(!correo || !clave){

    showToast("Completa todos los campos", "error");
    return;

  }


  try {
    const usuario = await login(correo, clave);


    localStorage.setItem("usuario", JSON.stringify(usuario));

    
     setTimeout(() => {
      if (usuario.rol === "Administrador") {
        window.location.href = "indexAdmin.html";
      } else {
        window.location.href = "indexAdmin.html";
      }
    }, 1500);

  } catch (error) {
    showToast("❌ Correo o contraseña incorrectos", "error");
  }
});
