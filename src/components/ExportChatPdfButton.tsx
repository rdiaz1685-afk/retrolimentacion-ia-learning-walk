
"use client";

import { Download } from "lucide-react";
import jsPDF from "jspdf";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface ExportChatPdfButtonProps {
    messages: Message[];
}

export function ExportChatPdfButton({ messages }: ExportChatPdfButtonProps) {
    const handleExport = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const maxLineWidth = pageWidth - margin * 2;

        let y = 30;

        // Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(79, 70, 229); // Indigo-600
        doc.text("Master Academic", margin, y);
        y += 10;

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text("Análisis y Retroalimentación de Learning Walk", margin, y);
        y += 15;

        // Line
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, y, pageWidth - margin, y);
        y += 15;

        // Messages
        messages.forEach((msg) => {
            const isUser = msg.role === "user";

            // Role label - Check if there's space for at least the label
            if (y > doc.internal.pageSize.getHeight() - margin - 15) {
                doc.addPage();
                y = 30;
            }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(isUser ? 79 : 100);
            const label = isUser ? "USUARIO" : "ASISTENTE MASTER ACADEMIC";
            doc.text(label, margin, y);
            y += 7;

            // Content
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59); // Slate-800

            const lines = doc.splitTextToSize(msg.content, maxLineWidth);

            lines.forEach((line: string) => {
                if (y > doc.internal.pageSize.getHeight() - margin - 10) {
                    doc.addPage();
                    y = 30;
                    // Re-set styles on new page
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(11);
                    doc.setTextColor(30, 41, 59);
                }
                doc.text(line, margin, y);
                y += 6;
            });

            y += 10; // Space between messages

            // Separator line
            if (y < doc.internal.pageSize.getHeight() - margin - 5) {
                doc.setDrawColor(241, 245, 249);
                doc.line(margin, y - 5, pageWidth - margin, y - 5);
            }
        });

        // Documentation Footer
        const totalPages = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184); // Slate-400
            doc.text(
                `Colegio Cambridge de Monterrey • Generado el ${new Date().toLocaleDateString()} • Página ${i} de ${totalPages}`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: "center" }
            );
        }

        doc.save("analisis_master_academic.pdf");
    };

    return (
        <button
            onClick={handleExport}
            disabled={messages.length === 0}
            className="flex items-center gap-x-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Download className="h-4 w-4" /> Exportar Análisis
        </button>
    );
}
