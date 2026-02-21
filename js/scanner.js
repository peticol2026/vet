import { supabase } from "./config/supabase.js";

// =============================
// ELEMENTOS
// =============================

const modoConsultaBtn = document.getElementById("modoConsulta");
const modoRegistroBtn = document.getElementById("modoRegistro");

const scannerInput = document.getElementById("scannerInput");
const resultado = document.getElementById("resultado");
const formRegistro = document.getElementById("formRegistro");

const regCodigo = document.getElementById("regCodigo");
const regNombre = document.getElementById("regNombre");
const regCosto = document.getElementById("regCosto");
const regVenta = document.getElementById("regVenta");
const regCantidad = document.getElementById("regCantidad");
const btnGuardarRegistro = document.getElementById("btnGuardarRegistro");

// =============================
// ESTADO
// =============================

let modoActual = "consulta";

// =============================
// CAMBIO DE MODOS
// =============================

modoConsultaBtn.addEventListener("click", () => {
  modoActual = "consulta";

  modoConsultaBtn.classList.add("modo-activo");
  modoRegistroBtn.classList.remove("modo-activo");

  resultado.innerHTML = "";
  formRegistro.style.display = "none";

  scannerInput.focus();
});

modoRegistroBtn.addEventListener("click", () => {
  modoActual = "registro";

  modoRegistroBtn.classList.add("modo-activo");
  modoConsultaBtn.classList.remove("modo-activo");

  resultado.innerHTML = "";
  formRegistro.style.display = "none";

  scannerInput.focus();
});

// =============================
// DETECTAR ESCANEO
// =============================

scannerInput.addEventListener("keydown", async (e) => {

  if (e.key === "Enter") {

    const codigo = scannerInput.value.trim();
    if (!codigo) return;

    if (modoActual === "consulta") {
      await buscarProductoConsulta(codigo);
    }

    if (modoActual === "registro") {

      const productoExistente = await buscarProductoPorCodigo(codigo);

      // 🟢 SI EXISTE → SUMAR STOCK
      if (productoExistente) {
        await sumarStock(productoExistente);
      }

      // 🔴 SI NO EXISTE → MOSTRAR FORMULARIO
      else {
        resultado.innerHTML = `
          <div class="mensaje-error">
            Producto no existe. Regístralo abajo 👇
          </div>
        `;

        mostrarFormularioRegistro(codigo);
      }
    }

    scannerInput.value = "";
  }
});

// =============================
// CONSULTA
// =============================

async function buscarProductoConsulta(codigo) {

  const { data, error } = await supabase
    .from("productos")
    .select(`
      idProducto,
      nombreProducto,
      precioVenta,
      precioCosto,
      cantidad,
      fechaVencimiento
    `)
    .eq("codigoBarras", codigo)
    .maybeSingle();

  if (error) {
    console.error(error);
    resultado.innerHTML = `<p style="color:red;">Error buscando producto</p>`;
    return;
  }

  if (!data) {
    resultado.innerHTML = `
      <div class="mensaje-error">
        Producto no registrado
      </div>
    `;
    return;
  }

  resultado.innerHTML = `
    <div class="resultado-card">
      <h3>${data.nombreProducto}</h3>
      <p class="precio">Precio venta: $${data.precioVenta}</p>
      <p>Precio costo: $${data.precioCosto}</p>
      <p class="${data.cantidad > 5 ? "stock-ok" : "stock-bajo"}">
        Stock: ${data.cantidad}
      </p>
      <p>Vence: ${data.fechaVencimiento ?? "N/A"}</p>
    </div>
  `;
}

// =============================
// BUSCAR POR CÓDIGO
// =============================

async function buscarProductoPorCodigo(codigo) {

  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("codigoBarras", codigo)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

// =============================
// SUMAR STOCK
// =============================

async function sumarStock(producto) {

  const nuevaCantidad = producto.cantidad + 1;

  const { error } = await supabase
    .from("productos")
    .update({ cantidad: nuevaCantidad })
    .eq("idProducto", producto.idProducto);

  if (error) {
    console.error(error);
    alert("Error actualizando stock");
    return;
  }

  resultado.innerHTML = `
    <div class="resultado-card">
      <h3>${producto.nombreProducto}</h3>
      <p class="stock-ok">
        Stock actualizado: ${nuevaCantidad}
      </p>
    </div>
  `;
}

// =============================
// MOSTRAR FORMULARIO
// =============================

function mostrarFormularioRegistro(codigo) {

  formRegistro.style.display = "block";

  regCodigo.value = codigo;
  regNombre.value = "";
  regCosto.value = "";
  regVenta.value = "";
  regCantidad.value = "1";

  regNombre.focus();
}

// =============================
// GUARDAR NUEVO PRODUCTO
// =============================

btnGuardarRegistro.addEventListener("click", async () => {

  const nuevoProducto = {
    codigoBarras: regCodigo.value,
    nombreProducto: regNombre.value,
    precioCosto: parseFloat(regCosto.value),
    precioVenta: parseFloat(regVenta.value),
    cantidad: parseInt(regCantidad.value)
  };

  const { error } = await supabase
    .from("productos")
    .insert([nuevoProducto]);

  if (error) {
    console.error(error);
    alert("Error guardando producto");
    return;
  }

  resultado.innerHTML = `
    <div class="resultado-card">
      <h3>${nuevoProducto.nombreProducto}</h3>
      <p class="stock-ok">
        Producto creado correctamente ✅
      </p>
    </div>
  `;

  formRegistro.style.display = "none";
});