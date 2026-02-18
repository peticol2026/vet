import { supabase } from "./config/supabase.js";

const LIMITE_REGISTROS = 15000;

const ventasCountEl = document.getElementById("ventasCount");
const gastosCountEl = document.getElementById("gastosCount");
const productosCountEl = document.getElementById("productosCount");
const barraUso = document.getElementById("barraUso");
const usoTexto = document.getElementById("usoTexto");
const alerta = document.getElementById("alertaEspacio");

const btnLimpiar = document.getElementById("btnLimpiar");


// =============================
// CONTADOR
// =============================
async function contar(tabla) {
  const { count, error } = await supabase
    .from(tabla)
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error(error);
    return 0;
  }

  return count || 0;
}


// =============================
// CARGAR ESPACIO
// =============================
async function cargarEspacio() {
  const ventas = await contar("ventas");
  const gastos = await contar("gastos");
  const productos = await contar("productos");

  const total = ventas + gastos + productos;
  const porcentaje = Math.min((total / LIMITE_REGISTROS) * 100, 100);

  ventasCountEl.textContent = ventas;
  gastosCountEl.textContent = gastos;
  productosCountEl.textContent = productos;

  barraUso.style.width = porcentaje + "%";
  usoTexto.textContent = total + " registros usados";

  alerta.classList.remove("hidden", "warning", "danger");

  // 🔥 Revisamos si ya mostramos alerta antes
  const alertaMostrada = localStorage.getItem("alertaEspacio");

  if (porcentaje >= 90) {

    alerta.classList.add("danger");
    alerta.textContent = "🚨 Espacio casi lleno. Limpia datos antiguos.";

    // Solo mostrar alert() una vez
    if (!alertaMostrada) {
      alert("🚨 Tu base de datos está al 90% de capacidad.");
      localStorage.setItem("alertaEspacio", "mostrada");
    }

  } else if (porcentaje >= 70) {

    alerta.classList.add("warning");
    alerta.textContent = "⚠ La base está creciendo.";

  } else {

    alerta.classList.add("hidden");

    // 🔄 Si baja del 70%, reseteamos para que vuelva a avisar en el futuro
    localStorage.removeItem("alertaEspacio");
  }

  generarGraficoMensual();

}



// =============================
// ELIMINAR TODO (LIBERAR ESPACIO)
// =============================
if (btnLimpiar) {
  btnLimpiar.addEventListener("click", async () => {

    const confirmar = confirm(
      "⚠ Esto eliminará TODAS las ventas, detalles y gastos.\n\n¿Estás seguro?"
    );

    if (!confirmar) return;

    try {

      // 1️⃣ Primero borrar detalle_venta
      const { error: errorDetalle } = await supabase
        .from("detalle_venta")
        .delete()
        .not("iddetalle", "is", null);

      if (errorDetalle) throw errorDetalle;

      // 2️⃣ Luego ventas
      const { error: errorVentas } = await supabase
        .from("ventas")
        .delete()
        .not("idventa", "is", null);

      if (errorVentas) throw errorVentas;

      // 3️⃣ Luego gastos
      const { error: errorGastos } = await supabase
        .from("gastos")
        .delete()
        .not("id", "is", null);

      if (errorGastos) throw errorGastos;

      alert("✅ Base de datos limpiada correctamente");

      localStorage.removeItem("alertaEspacio");


      await cargarEspacio();

    } catch (error) {
      console.error(error);
      alert("❌ Error al limpiar la base");
    }
  });
}




// =============================
// GRAFICO SIMPLE
// =============================
let graficoInstance = null;

async function generarGraficoMensual() {

  const { data, error } = await supabase
    .from("ventas")
    .select("fecha");

  if (error) {
    console.error(error);
    return;
  }

  const meses = Array(12).fill(0);

  data.forEach(v => {
    const mes = new Date(v.fecha).getMonth();
    meses[mes]++;
  });

  const ctx = document.getElementById("graficoCrecimiento").getContext("2d");

  // destruir gráfico anterior si existe
  if (graficoInstance) {
    graficoInstance.destroy();
  }

  graficoInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [
        "Ene","Feb","Mar","Abr","May","Jun",
        "Jul","Ago","Sep","Oct","Nov","Dic"
      ],
      datasets: [{
        label: "Ventas por mes",
        data: meses,
        borderRadius: 12,
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;

          if (!chartArea) return "#ff9505";

          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "#ff9505");
          gradient.addColorStop(1, "#ff3c00");

          return gradient;
        }
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: "white"
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: "white"
          },
          grid: {
            display: false
          }
        },
        y: {
          ticks: {
            color: "white"
          },
          grid: {
            color: "rgba(255,255,255,0.05)"
          }
        }
      },
      animation: {
        duration: 1200,
        easing: "easeOutQuart"
      }
    }
  });
}




// =============================
// LIMPIEZA AUTOMÁTICA MENSUAL
// =============================
function limpiezaAutomatica() {

  const ultimaLimpieza = localStorage.getItem("ultimaLimpieza");
  const ahora = new Date();

  if (
    !ultimaLimpieza ||
    new Date(ultimaLimpieza).getMonth() !== ahora.getMonth()
  ) {
    if (btnLimpiar) btnLimpiar.click();
    localStorage.setItem("ultimaLimpieza", ahora.toISOString());
  }
}


// =============================
// INICIO
// =============================
limpiezaAutomatica();
cargarEspacio();
