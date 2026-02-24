
"use client";

import { useState } from "react";
import { X, Trophy, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardObservationItemProps {
    maestra: string;
    campus: string;
    fecha: string;
    wowText?: string;
    wonderText?: string;
    objetivo?: string;
    history?: any[];
}

import { ObservationAction } from "./ObservationAction";

export function DashboardObservationItem({
    maestra, campus, fecha, wowText, wonderText, objetivo = "General", history = []
}: DashboardObservationItemProps) {
    const [activeModal, setActiveModal] = useState<'wow' | 'wonder' | null>(null);

    return (
        <>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition group">
                <div>
                    <p className="font-semibold text-slate-900 group-hover:text-indigo-700 transition">{maestra}</p>
                    <p className="text-xs text-slate-500 font-medium">{campus} • {fecha || "Fecha no registrada"}</p>
                </div>
                <div className="flex items-center gap-x-2">
                    {wowText && (
                        <button
                            onClick={() => setActiveModal('wow')}
                            className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-lg uppercase tracking-wide hover:bg-yellow-200 transition active:scale-95 flex items-center gap-x-1"
                        >
                            <Trophy className="h-3 w-3" />
                            Wow
                        </button>
                    )}
                    {wonderText && (
                        <button
                            onClick={() => setActiveModal('wonder')}
                            className="px-3 py-1.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg uppercase tracking-wide hover:bg-purple-200 transition active:scale-95 flex items-center gap-x-1"
                        >
                            <Lightbulb className="h-3 w-3" />
                            Wonder
                        </button>
                    )}
                    <div className="w-[1px] h-6 bg-slate-200 mx-1 hidden sm:block" />
                    <ObservationAction
                        observation={{
                            maestra,
                            campus,
                            fecha,
                            wows: wowText || "",
                            wonders: wonderText || "",
                            objetivo
                        }}
                        history={history}
                    />
                </div>
            </div>

            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-slate-900/5">
                        <div className={cn(
                            "p-4 border-b flex items-center justify-between",
                            activeModal === 'wow' ? "bg-yellow-50 border-yellow-100" : "bg-purple-50 border-purple-100"
                        )}>
                            <div className="flex items-center gap-x-2">
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    activeModal === 'wow' ? "bg-yellow-100 text-yellow-700" : "bg-purple-100 text-purple-700"
                                )}>
                                    {activeModal === 'wow' ? <Trophy className="h-5 w-5" /> : <Lightbulb className="h-5 w-5" />}
                                </div>
                                <div>
                                    <h3 className={cn(
                                        "font-bold text-lg",
                                        activeModal === 'wow' ? "text-yellow-800" : "text-purple-800"
                                    )}>
                                        {activeModal === 'wow' ? "Puntos Fuertes (Wow)" : "Área de Oportunidad (Wonder)"}
                                    </h3>
                                    <p className={cn(
                                        "text-xs font-medium",
                                        activeModal === 'wow' ? "text-yellow-600" : "text-purple-600"
                                    )}>
                                        {maestra}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="p-1 hover:bg-white/50 rounded-full transition"
                            >
                                <X className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 shadow-inner">
                                <p className="text-slate-700 leading-relaxed font-medium text-base">
                                    "{activeModal === 'wow' ? wowText : wonderText}"
                                </p>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setActiveModal(null)}
                                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition font-semibold text-sm shadow-lg hover:shadow-xl active:scale-95"
                                >
                                    Entendido
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
