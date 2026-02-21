import { obtenerCitas, crearCita, eliminarCita, eliminarTodasLasCitas } from "../services/citas.service.js";

document.addEventListener("DOMContentLoaded", async () => {

  const calendarEl = document.getElementById("calendar");

  const modal = document.getElementById("modalCita");
  const modalDetalle = document.getElementById("modalDetalle");

  const btnGuardar = document.getElementById("guardarCita");
  const btnCancelar = document.getElementById("cancelarCita");
  const btnCerrarDetalle = document.getElementById("cerrarDetalle");


let mesActual = null;

  const citas = await obtenerCitas();

    let citaActualId = null;
    

  // 🔥 Eventos con datos completos
const eventos = citas.map(c => {

  const colores = {
    perro: "#ff6a00",
    gato: "#111827",
    conejo: "#7c3aed",
    ave: "#0ea5e9",
    reptil: "#16a34a",
    hurón: "#db2777",
    cobayo: "#f59e0b"
  };

  const colorEspecie = colores[c.especie] || "#ff6a00";

  return {
    title: `${c.nombre_perro} · ${c.hora_servicio}`,
    start: `${c.fecha_servicio}T${c.hora_servicio}`,
    backgroundColor: colorEspecie,
    borderColor: colorEspecie,
    textColor: "#ffffff",
    extendedProps: c
  };
});

  const calendar = new FullCalendar.Calendar(calendarEl, {
  initialView: "dayGridMonth",
  locale: "es",
  buttonText: {
    today: "Hoy",
    month: "Mes",
    week: "Semana",
    day: "Día"
  },
  height: "auto",
  selectable: true,
  events: eventos,

  datesSet: function(info) {

  const nuevoMes = info.start.getMonth();
  const calendarUI = document.querySelector('.fc');

  if (mesActual !== null) {

    calendarUI.classList.remove('flip-next', 'flip-prev');
    void calendarUI.offsetWidth; // reset animación

    if (
      nuevoMes > mesActual ||
      (mesActual === 11 && nuevoMes === 0)
    ) {
      calendarUI.classList.add('flip-next');
    } else if (
      nuevoMes < mesActual ||
      (mesActual === 0 && nuevoMes === 11)
    ) {
      calendarUI.classList.add('flip-prev');
    }
  }

  mesActual = nuevoMes;
},

  eventDidMount: function(info) {
  info.el.style.borderRadius = "14px";
  info.el.style.padding = "6px 10px";
  info.el.style.fontWeight = "500";
},

    // 📅 Click en día vacío → crear cita
    dateClick: function(info) {
      document.getElementById("fechaServicio").value = info.dateStr;
      modal.classList.remove("hidden");
    },

    // 📌 Click en evento → ver detalle
    eventClick: function(info) {

      const cita = info.event.extendedProps;
      citaActualId = cita.id;
      const contenido = document.getElementById("detalleContenido");

      contenido.innerHTML = `
  <div class="detalle-item">
    <span class="detalle-label">🐶 Mascota</span>
    <span class="detalle-value">${cita.nombre_perro}</span>
  </div>

  <div class="detalle-item">
    <span class="detalle-label">🧬 Especie</span>
    <span class="detalle-value">
      ${
        cita.especie
          ? cita.especie.charAt(0).toUpperCase() + cita.especie.slice(1)
          : "No especificada"
      }
    </span>
  </div>

  <div class="detalle-item">
    <span class="detalle-label">🐾 Raza</span>
    <span class="detalle-value">${cita.raza}</span>
  </div>

  <div class="detalle-item">
    <span class="detalle-label">👤 Propietario</span>
    <span class="detalle-value">${cita.nombre_propietario}</span>
  </div>

  <div class="detalle-item">
    <span class="detalle-label">📞 Teléfono</span>
    <span class="detalle-value">${cita.telefono}</span>
  </div>

  <div class="detalle-item">
    <span class="detalle-label">📅 Fecha</span>
    <span class="detalle-value">${cita.fecha_servicio}</span>
  </div>

  <div class="detalle-item">
    <span class="detalle-label">⏰ Hora</span>
    <span class="detalle-value">${cita.hora_servicio}</span>
  </div>

  <div class="detalle-item">
    <span class="detalle-label">📌 Estado</span>
    <span class="detalle-value">${cita.estado ?? "Pendiente"}</span>
  </div>

  <div class="detalle-item">
    <span class="detalle-label">📝 Notas</span>
    <span class="detalle-value">${cita.notas ?? "Sin notas"}</span>
  </div>
`;

      modalDetalle.classList.remove("hidden");
    }

  });


  

  calendar.render();

  

  // 🗑️ Eliminar TODAS las citas
const btnEliminarTodo = document.getElementById("btnEliminarTodo");

btnEliminarTodo.addEventListener("click", async () => {

  const confirmar = confirm("⚠️ ¿Seguro que deseas eliminar TODAS las citas? Esta acción no se puede deshacer.");

  if (!confirmar) return;

  await eliminarTodasLasCitas();

  location.reload();
});



  const btnEliminar = document.getElementById("eliminarCitaBtn");

btnEliminar.addEventListener("click", async () => {

  if (!citaActualId) return;

  const confirmar = confirm("¿Seguro que deseas eliminar esta cita?");
  if (!confirmar) return;

  await eliminarCita(citaActualId);

  location.reload();
});

  // ❌ Cancelar creación
  btnCancelar.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // ❌ Cerrar detalle
  if (btnCerrarDetalle) {
    btnCerrarDetalle.addEventListener("click", () => {
      modalDetalle.classList.add("hidden");
    });
  }

  // 💾 Guardar cita
 btnGuardar.addEventListener("click", async () => {

  const especieInput = document.getElementById("especie");
  const errorEspecie = document.getElementById("errorEspecie");

  let especieValor = especieInput.value.trim();

  // Reset visual
  especieInput.classList.remove("input-error");
  errorEspecie.classList.add("hidden");

  // ❌ Validación
  if (!especieValor) {
    especieInput.classList.add("input-error");
    errorEspecie.classList.remove("hidden");
    return;
  }

  // 🔽 Guardar en minúsculas
  const especieNormalizada = especieValor.toLowerCase();

  const nuevaCita = {
    nombre_perro: document.getElementById("nombrePerro").value,
    especie: especieNormalizada,
    raza: document.getElementById("raza").value,
    nombre_propietario: document.getElementById("nombrePropietario").value,
    telefono: document.getElementById("telefono").value,
    fecha_servicio: document.getElementById("fechaServicio").value,
    hora_servicio: document.getElementById("horaServicio").value,
    notas: document.getElementById("notas").value,
    estado: "pendiente"
  };

  await crearCita(nuevaCita);
  location.reload();
});

document.getElementById("especie").addEventListener("input", function() {
  this.classList.remove("input-error");
  document.getElementById("errorEspecie").classList.add("hidden");
});


});