
"use client";

import React from 'react';
import { Target, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface ComplianceData {
    coordinatorName: string;
    campus: string;
    totalAssigned: number;
    completedThisWeek: number;
    percentage: number;
    history: {
        semana: string;
        porcentaje: number;
    }[];
}

interface ComplianceTableProps {
    complianceData: ComplianceData[];
    title?: string;
}

export function ComplianceTable({ complianceData, title = "Cumplimiento de Coordinadores" }: ComplianceTableProps) {
    if (complianceData.length === 0) return null;

    // Función de ayuda para determinar el color según el porcentaje (Semáforo de 4 colores)
    const getColorClass = (percent: number, type: 'bg' | 'text') => {
        if (percent < 50) return type === 'bg' ? 'bg-red-500' : 'text-red-600';
        if (percent < 75) return type === 'bg' ? 'bg-orange-500' : 'text-orange-600';
        if (percent < 90) return type === 'bg' ? 'bg-yellow-300' : 'text-yellow-600';
        return type === 'bg' ? 'bg-emerald-500' : 'text-emerald-600';
    };

    const getTrendColorClass = (percent: number) => {
        if (percent < 50) return 'bg-red-500';
        if (percent < 75) return 'bg-orange-500';
        if (percent < 90) return 'bg-yellow-300';
        return 'bg-emerald-500';
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                        <p className="text-xs text-slate-500 mt-1">Efectividad basada en maestros asignados vs. evaluados semanalmente.</p>
                    </div>

                    {/* Leyenda de Semáforo */}
                    <div className="flex flex-wrap gap-3 items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-1">Rango:</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                            <span className="text-[10px] font-bold text-slate-600">0-49%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                            <span className="text-[10px] font-bold text-slate-600">50-74%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-300"></div>
                            <span className="text-[10px] font-bold text-slate-600">75-89%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] font-bold text-slate-600">90-100%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/30 text-slate-600 text-[10px] uppercase tracking-wider font-bold">
                            <th className="px-6 py-4">Coordinador(a)</th>
                            <th className="px-6 py-4">Campus</th>
                            <th className="px-6 py-4 text-center">Asignados</th>
                            <th className="px-6 py-4 text-center">Evaluados</th>
                            <th className="px-6 py-4">Efectividad Actual</th>
                            <th className="px-6 py-4">Tendencia Histórica</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {complianceData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-semibold text-slate-800 text-sm">
                                    {item.coordinatorName}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">
                                        {item.campus}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">
                                    {item.totalAssigned}
                                </td>
                                <td className="px-6 py-4 text-center text-sm font-bold text-indigo-600">
                                    {item.completedThisWeek}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-x-2">
                                        <div className="flex-grow w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${getColorClass(item.percentage, 'bg')}`}
                                                style={{ width: `${item.percentage}%` }}
                                            />
                                        </div>
                                        <span className={`text-xs font-bold ${getColorClass(item.percentage, 'text')}`}>
                                            {item.percentage.toFixed(0)}%
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-x-1">
                                        {item.history.slice(-4).map((h, i) => (
                                            <div
                                                key={i}
                                                className="group relative"
                                                title={`Semana ${h.semana}: ${h.porcentaje.toFixed(0)}%`}
                                            >
                                                <div
                                                    className={`w-3.5 h-3.5 rounded-sm transition-opacity hover:opacity-100 ${getTrendColorClass(h.porcentaje)}`}
                                                />
                                            </div>
                                        ))}
                                        {item.history.length === 0 && (
                                            <span className="text-[10px] text-slate-400 italic">Sin historial</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
