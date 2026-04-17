/**
 * SERVICIO DE GENERACIÓN DE TICKETS CON CÓDIGO DE BARRAS - ALMACENCONTROL
 */

import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import JsBarcode from "https://esm.sh/jsbarcode";

/**
 * Genera un PDF con Código de Barras 1D.
 * @param {Object} data - { id, nombre, fecha, responsable, tipo }
 */
export const generarTicketPDF = async (data) => {
    try {
        const { id, nombre, fecha, responsable, tipo } = data;
        const folio = `AC-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;

        const doc = new jsPDF({
            unit: 'pt',
            format: [226, 500]
        });

        const width = 226;
        const margin = 25;
        let y = 40;

        // --- ENCABEZADO ---
        doc.setFillColor(30, 58, 138);
        doc.roundedRect(margin, y - 15, 30, 30, 4, 4, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text("A", margin + 9, y + 7);
        doc.setTextColor(30, 58, 138);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("ALMACÉN CONTROL", margin + 40, y + 5);

        y += 40;
        doc.setDrawColor(230);
        doc.line(margin, y, width - margin, y);
        
        y += 15;
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`FOLIO: ${folio}`, margin, y);
        doc.text(`${new Date(fecha).toLocaleDateString()}`, width - margin, y, { align: "right" });

        // --- MOVIMIENTO ---
        y += 25;
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, width - (margin * 2), 30, 'F');
        y += 18;
        doc.setTextColor(30, 58, 138);
        doc.setFontSize(9);
        doc.text(tipo.toUpperCase(), width / 2, y, { align: "center" });

        // --- DATOS ---
        y += 35;
        doc.setTextColor(100); doc.setFontSize(8);
        doc.text("PRODUCTO:", margin, y);
        y += 12;
        doc.setTextColor(0); doc.setFontSize(10); doc.setFont("helvetica", "bold");
        const splitNombre = doc.splitTextToSize(nombre, width - (margin * 2));
        doc.text(splitNombre, margin, y);
        y += (splitNombre.length * 12);

        y += 15;
        doc.setFont("helvetica", "normal"); doc.setTextColor(100);
        doc.text("RESPONSABLE:", margin, y);
        y += 12;
        doc.setTextColor(0); doc.setFontSize(9);
        doc.text(responsable || "Admin", margin, y);

        // --- GENERACIÓN DE CÓDIGO DE BARRAS ---
        y += 40;
        doc.setDrawColor(30, 58, 138);
        doc.line(margin, y, width - margin, y);
        
        y += 20;
        doc.setTextColor(30, 58, 138);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("ESCANEÉ PARA VER DETALLES EN APP", width / 2, y, { align: "center" });

        // Crear un canvas invisible para generar el código de barras
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, id, {
            format: "CODE128",
            width: 2,
            height: 60,
            displayValue: true, // Mostrar el ID debajo de las barras
            fontSize: 10,
            margin: 0
        });

        const barcodeData = canvas.toDataURL("image/png");
        y += 10;
        // Ajustar imagen del código de barras al ancho del ticket
        doc.addImage(barcodeData, 'PNG', margin, y, width - (margin * 2), 70);
        
        y += 90;
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.setFont("helvetica", "italic");
        doc.text("Este código vincula directamente con la ficha digital.", width / 2, y, { align: "center" });

        doc.save(`Ticket_Barras_${folio}.pdf`);
    } catch (error) {
        console.error("Error PDF:", error);
    }
};
