const express = require("express");
const ExcelJS = require("exceljs");

const app = express();
const path = require("path");

app.use(express.json());
app.use(express.static(path.join(__dirname, "../../")));


app.post("/reporte", async (req, res) => {

  try {

    const { ventas, gastos, fechaInicio, fechaFin } = req.body;

    const workbook = new ExcelJS.Workbook();

    /* =========================
       💰 HOJA VENTAS
    ========================== */

    const hojaVentas = workbook.addWorksheet("Ventas");

    hojaVentas.columns = [
      { header: "ID Venta", key: "id", width: 15 },
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "Total Venta", key: "total", width: 20 }
    ];

    // 🎨 Encabezado con color
    hojaVentas.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1F4E78" }
      };
    });

    ventas.forEach(v => {
      hojaVentas.addRow({
        id: v.idventa,
        fecha: new Date(v.fecha),
        total: Number(v.total)
      });
    });

    hojaVentas.getColumn("total").numFmt = '"$"#,##0.00';

    hojaVentas.addRow({});
    hojaVentas.addRow({
      fecha: "TOTAL:",
      total: { formula: `SUM(C2:C${hojaVentas.rowCount})` }
    }).font = { bold: true };


    /* =========================
       💸 HOJA GASTOS
    ========================== */

    const hojaGastos = workbook.addWorksheet("Gastos");

    hojaGastos.columns = [
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "Tipo", key: "tipo", width: 20 },
      { header: "Monto", key: "monto", width: 20 }
    ];

    hojaGastos.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "9C0006" }
      };
    });

    gastos.forEach(g => {
      hojaGastos.addRow({
        fecha: new Date(g.fecha),
        tipo: g.tipo,
        monto: Number(g.monto)
      });
    });

    hojaGastos.getColumn("monto").numFmt = '"$"#,##0.00';


    /* =========================
       📊 DASHBOARD
    ========================== */

    const hojaDashboard = workbook.addWorksheet("Dashboard");

    const totalVentas = ventas.reduce((a,v)=>a+Number(v.total||0),0);
    const totalGastos = gastos.reduce((a,g)=>a+Number(g.monto||0),0);
    const ganancia = totalVentas - totalGastos;

    hojaDashboard.addRow(["REPORTE FINANCIERO"]);
    hojaDashboard.addRow([]);
    hojaDashboard.addRow(["Rango:", `${fechaInicio} a ${fechaFin}`]);
    hojaDashboard.addRow([]);
    hojaDashboard.addRow(["Total Ventas", totalVentas]);
    hojaDashboard.addRow(["Total Gastos", totalGastos]);
    hojaDashboard.addRow(["Ganancia Neta", ganancia]);

    hojaDashboard.getColumn(2).numFmt = '"$"#,##0.00';
    hojaDashboard.getRow(1).font = { bold: true, size: 16 };


    /* =========================
       💾 ENVIAR ARCHIVO
    ========================== */

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Reporte_Empresarial.xlsx"
    );

    await workbook.xlsx.write(res);

    res.end();

  } catch (error) {
    console.error(error);
    res.status(500).send("Error generando reporte");
  }

});

app.listen(3000, () => console.log("Servidor corriendo en puerto 3000"));
