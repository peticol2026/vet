import {obtenerProductos, crearProducto, subirImagen,  eliminarProducto,  eliminarImagen, actualizarProducto, buscarProductoIgual} from "./services/productos.service.js";
import { mostrarToast } from "./ui/toast.ui.js";
import {renderProductos, initModal ,initFormulario } from "./ui/productos.ui.js";
import { initBackButton } from "./ui/backButton.ui.js";
import {
  obtenerCategorias,
  crearCategoria,
  eliminarCategoria,
  categoriaTieneProductos
} from "./services/categorias.service.js";


let productoEditando = null;
let productosGlobales = [];



    // **********************************************************************************************************************************
        //  FUNCIONES
    // ***********************************************************************************************************************************


async function cargarProductos() {
  const productos = await obtenerProductos();

  productosGlobales = productos;

  renderProductos(productos, borrarProducto, editarProducto);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const vencidos = productos.filter(p => {
    if (!p.fechaVencimiento) return false;
    const f = new Date(p.fechaVencimiento);
    f.setHours(0, 0, 0, 0);
    return f <= hoy;
  });

  if (vencidos.length > 0) {
    mostrarToast(
      `⚠️ Tienes ${vencidos.length} producto(s) vencido(s)`,
      "error"
    );
  }
}


// PROCESO PARA LA BARRA DE BUSQUEDA DE PRODUCTOS

const inputBuscar = document.getElementById("searchProduct");

if (inputBuscar) {
  inputBuscar.addEventListener("input", () => {
    const texto = inputBuscar.value.toLowerCase().trim();

    const filtrados = productosGlobales.filter(
      (producto) =>
        producto.nombreProducto?.toLowerCase().includes(texto) ||
        producto.categoriaNombre?.toLowerCase().includes(texto),
    );

    renderProductos(filtrados, borrarProducto, editarProducto);
  });
}



// GUARDAR PRODUCTOS
async function guardarProducto(producto) {
  try {
    // 🔎 Buscar si ya existe un producto igual (SIN IMAGEN)
    const productoExistente = await buscarProductoIgual(producto);

    // 🟡 CASO 1: YA EXISTE → SUMAR CANTIDAD
    if (productoExistente && !productoEditando) {
      const nuevaCantidad =
        productoExistente.cantidad + producto.cantidad;

      await actualizarProducto(productoExistente.idProducto, {
        cantidad: nuevaCantidad
      });

      mostrarToast("Cantidad actualizada correctamente", "success");
    }

    // 🟢 CASO 2: NO EXISTE o está editando → CREAR / ACTUALIZAR
    else {
      let imagenUrl = productoEditando?.imagen || null;

      if (producto.imagenFile) {
        if (productoEditando?.imagen) {
          await eliminarImagen(productoEditando.imagen);
        }
        imagenUrl = await subirImagen(producto.imagenFile);
      }

      const productoFinal = {
        nombreProducto: producto.nombreProducto,
        categoria_id: producto.categoria_id,
        precioCosto: producto.precioCosto,
        precioVenta: producto.precioVenta,
        cantidad: producto.cantidad,
        fechaVencimiento: producto.fechaVencimiento,
        imagen: imagenUrl
      };

      if (productoEditando) {
        await actualizarProducto(productoEditando.idProducto, productoFinal);
      } else {
        await crearProducto(productoFinal);
      }
    }

    // 🔄 RESET
    productoEditando = null;
    document.getElementById("productForm").reset();
    document.getElementById("modalTitle").textContent = "Agregar producto";
    document.getElementById("productModal").classList.add("hidden");

    await cargarProductos();

  } catch (error) {
    console.error(error);
    alert("Error al guardar producto");
  }
}


// BORRAR PRODUCTOS

async function borrarProducto(producto) {
  try {
    // 1️⃣ eliminar imagen
    await eliminarImagen(producto.imagen);

    // 2️⃣ eliminar registro
    await eliminarProducto(producto.idProducto);

    // 3️⃣ recargar
    await cargarProductos();

    // 4️⃣ toast
    mostrarToast("Producto eliminado correctamente", "success");

  } catch (error) {
    console.error(error);
    mostrarToast("Error al eliminar producto", "error");
  }
}



// EDITAR PRODUCTOS

function editarProducto(producto) {
  productoEditando = producto;

  document.getElementById("modalTitle").textContent = "Editar producto";
  document.getElementById("productModal").classList.remove("hidden");

  document.getElementById("nombreProducto").value = producto.nombreProducto;
 document.getElementById("categoria").value = producto.categoria_id;
  document.getElementById("precioCosto").value = producto.precioCosto;
  document.getElementById("precioVenta").value = producto.precioVenta;
  document.getElementById("cantidad").value = producto.cantidad;
  document.getElementById("fechaVencimiento").value =
    producto.fechaVencimiento ?? "";


  // PROCESO INTERNO PARA CUANDO SE EDITA O CAMBIA LA IMAGEN 

  const preview = document.getElementById("imagenPreview");
  const btnQuitarImagen = document.getElementById("btnQuitarImagen");

  if (producto.imagen) {
    preview.src = producto.imagen;
    preview.style.display = "block";
    btnQuitarImagen.style.display = "block";
  } else {
    preview.style.display = "none";
    btnQuitarImagen.style.display = "none";
  }

}

async function cargarCategorias() {

  const select = document.getElementById("categoria");
  const categorias = await obtenerCategorias();

  select.innerHTML = `<option value="">Seleccionar categoría</option>`;

  categorias.forEach(cat => {
    select.innerHTML += `
      <option value="${cat.id}">
        ${cat.nombre}
      </option>
    `;
  });



  // Opción especial
  select.innerHTML += `
    <option value="__nueva__">➕ Agregar categoría</option>
  `;

  select.innerHTML += `
  <option value="__eliminar__">🗑 Administrar categorías</option>
`;
}

document.getElementById("categoria")
  .addEventListener("change", async (e) => {

    // ➕ CREAR CATEGORÍA
    if (e.target.value === "__nueva__") {

      const nombre = prompt("Nombre de la nueva categoría:");

      if (!nombre) {
        e.target.value = "";
        return;
      }

      try {
        const nueva = await crearCategoria(nombre.trim());
        await cargarCategorias();
        e.target.value = nueva.id;
      } catch (err) {
        alert("Error creando categoría");
        console.error(err);
      }
    }

    // 🗑 ELIMINAR CATEGORÍA
    if (e.target.value === "__eliminar__") {

  const categorias = await obtenerCategorias();

  const lista = categorias
    .map(c => `${c.id} - ${c.nombre}`)
    .join("\n");

  const id = prompt(
    "Escribe el ID de la categoría que deseas eliminar:\n\n" + lista
  );

  if (!id) {
  e.target.value = "";
  return;
}



const idNumero = id.trim();

if (!idNumero) {
  e.target.value = "";
  return;
}

await eliminarCategoria(idNumero);


  try {
    await eliminarCategoria(idNumero);
    await cargarCategorias();
    alert("Categoría eliminada");
  } catch (err) {
    alert("No se puede eliminar (puede estar en uso)");
  }

  e.target.value = "";
}

  });


const productModal = document.getElementById("productModal");
const modalCard = productModal.querySelector(".modal-card");

productModal.addEventListener("click", (e) => {
  if (!modalCard.contains(e.target)) {
    cerrarModal();
  }
});

function cerrarModal() {
  productModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}




/* =========================
   INIT
========================= */
initModal();
initFormulario(guardarProducto);
cargarProductos();
initBackButton();
cargarCategorias();
