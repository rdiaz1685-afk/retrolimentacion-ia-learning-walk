
"use client";

import { Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export function ExportDashboardPdfButton() {
    const handleExport = async () => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // 1. Header
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59);
        doc.text("Reporte Visual de Dashboard", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generado el: ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`, 14, 28);

        // 2. Capture specific element
        const dashboardElement = document.getElementById('visual-dashboard');

        if (!dashboardElement) {
            alert("No se pudo encontrar la sección de gráficas para exportar.");
            return;
        }

        try {
            // Give a small feedback to the user
            const btn = document.activeElement as HTMLButtonElement;
            const originalText = btn.innerText;
            btn.innerText = "Procesando...";
            btn.disabled = true;

            // Wait for any animations to settle
            await new Promise(resolve => setTimeout(resolve, 800));

            const canvas = await html2canvas(dashboardElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                onclone: (clonedDoc) => {
                    // Ensure cloned elements are visible
                    const el = clonedDoc.getElementById('visual-dashboard');
                    if (el) el.style.padding = "20px";
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            doc.addImage(imgData, 'PNG', 10, 35, imgWidth, imgHeight);

            doc.save(`Dashboard_Visual_${new Date().getTime()}.pdf`);

            btn.innerText = originalText;
            btn.disabled = false;

        } catch (error: any) {
            console.error("Error al exportar dashboard:", error);
            alert("Error técnico al generar el reporte. Por favor intenta de nuevo.");

            const btn = document.activeElement as HTMLButtonElement;
            if (btn) {
                btn.innerText = "Error - Reintentar";
                btn.disabled = false;
            }
        }
    };

    return (
        <button
            onClick={handleExport}
            className="flex items-center gap-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow-sm active:scale-95 disabled:opacity-50"
        >
            <Download className="h-4 w-4" /> Exportar Gráficas (PDF)
        </button>
    );
}
