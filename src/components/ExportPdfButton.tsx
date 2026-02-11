
"use client";

import { Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportPdfButtonProps {
    data: any[];
}

export function ExportPdfButton({ data }: ExportPdfButtonProps) {
    const handleExport = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Reporte de Observaciones - Learning Walk", 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30);

        const tableData = data.map(item => [
            item.maestra,
            item.campus,
            item.aula || "N/A",
            item.wows || "-",
            item.wonders || "-"
        ]);

        autoTable(doc, {
            head: [['Maestra', 'Campus', 'Aula', 'Wow', 'Wonder']],
            body: tableData,
            startY: 40,
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 25 },
                2: { cellWidth: 20 },
                3: { cellWidth: 'auto' }, // Allow wows to expand
                4: { cellWidth: 'auto' }  // Allow wonders to expand
            }
        });

        doc.save("observaciones_learning_walk.pdf");
    };

    return (
        <button
            onClick={handleExport}
            className="flex items-center gap-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow-sm active:scale-95"
        >
            <Download className="h-4 w-4" /> Exportar PDF
        </button>
    );
}
