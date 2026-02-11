
"use client";

import { Download } from "lucide-react";

export function PrintReportButton() {
    return (
        <button
            onClick={() => window.print()}
            className="flex items-center gap-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow-sm active:scale-95 print:hidden"
        >
            <Download className="h-4 w-4" /> Exportar Reporte Visual (PDF)
        </button>
    );
}
