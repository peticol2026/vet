import {
  obtenerProductos,
  crearProducto,
  subirImagen,
  eliminarProducto,
  eliminarImagen
} from "./services/productos.service.js";

import { mostrarToast } from "./ui/toast.ui.js";



import {
  renderProductos,
  initModal,
  initFormulario
} from "./ui/productos.ui.js";

/* =========================
   CARGAR PRODUCTOS
========================= */
async function cargarProductos() {
  const productos = await obtenerProductos();
  renderProductos(productos, borrarProducto);

}

/* =========================
   GUARDAR PRODUCTO (ORQUESTADOR)
========================= */
async function guardarProducto(producto) {
  try {
    let imagenUrl = null;

    // 1️⃣ Subir imagen a Supabase Storage (si existe)
    if (producto.imagenFile) {
      imagenUrl = await subirImagen(producto.imagenFile);
    }

    // 2️⃣ Armar objeto final para BD
    const productoFinal = {
      nombreProducto: producto.nombreProducto,
      categoria: producto.categoria,
      precioCosto: producto.precioCosto,
      precioVenta: producto.precioVenta,
      cantidad: producto.cantidad,
      fechaVencimiento: producto.fechaVencimiento,
      imagen: imagenUrl // 👈 URL pública
    };

    // 3️⃣ Guardar en Supabase
    await crearProducto(productoFinal);

    // 4️⃣ Recargar lista
    await cargarProductos();

    // 5️⃣ Cerrar modal
    document.getElementById("productModal").classList.add("hidden");

    // 6️⃣ Limpiar formulario
    document.getElementById("productForm").reset();

  } catch (error) {
    console.error(error);
    alert("Error al guardar producto");
  }
}


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



/* =========================
   INIT
========================= */
initModal();
initFormulario(guardarProducto);
cargarProductos();
