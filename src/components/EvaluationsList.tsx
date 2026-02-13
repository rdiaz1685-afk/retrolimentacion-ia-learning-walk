
"use client";

import { useState } from "react";
import { Search, Download, Info } from "lucide-react";
import { ObservationAction } from "@/components/ObservationAction";
import { ExportPdfButton } from "@/components/ExportPdfButton";

interface Evaluation {
    maestra: string;
    coordinadora: string;
    campus: string;
    aula: string;
    wows: string;
    wonders: string;
    fecha: string;
    objetivo: string;
}

export function EvaluationsList({ data }: { data: Evaluation[] }) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredData = data.filter(obs => {
        const term = searchTerm.toLowerCase();
        return (
            obs.maestra.toLowerCase().includes(term) ||
            obs.coordinadora.toLowerCase().includes(term) ||
            obs.campus.toLowerCase().includes(term) ||
            (obs.aula && obs.aula.toLowerCase().includes(term))
        );
    });

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Listado de Observaciones</h1>
                    <p className="text-sm text-slate-500">Consulta el detalle de los "Wows" y "Wonders".</p>
                </div>
                <div className="flex gap-x-3">
                    <ExportPdfButton data={filteredData} />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-y-4 items-center justify-between bg-slate-50/50">
                    <div className="relative w-full sm:w-64 md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-400 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 transition placeholder:text-slate-400 font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-x-2 text-xs text-slate-500">
                        <Info className="h-4 w-4" />
                        <span>{filteredData.length} registros</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-600 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold">Maestra / Coordinadora</th>
                                <th className="px-6 py-4 font-bold">Campus / Aula</th>
                                <th className="px-6 py-4 font-bold">Wows & Wonders</th>
                                <th className="px-6 py-4 font-bold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        {searchTerm ? "No se encontraron resultados para tu búsqueda." : "No hay datos reales para mostrar. Verifica los permisos de las hojas."}
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((obs, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition truncate">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">{obs.maestra}</div>
                                            <div className="text-xs text-slate-400">{obs.coordinadora}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="mb-1">
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-tight">
                                                    {obs.campus}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-medium uppercase">Aula: {obs.aula || "N/A"}</div>
                                        </td>
                                        <td className="px-6 py-4 max-w-md">
                                            <div className="mb-2">
                                                <span className="text-[10px] font-bold text-yellow-600 mr-2 uppercase">Wow:</span>
                                                <span className="text-sm text-slate-600 line-clamp-1 italic">"{obs.wows}"</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-purple-600 mr-2 uppercase">Wonder:</span>
                                                <span className="text-sm text-slate-600 line-clamp-1 italic">"{obs.wonders}"</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <ObservationAction observation={obs} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
