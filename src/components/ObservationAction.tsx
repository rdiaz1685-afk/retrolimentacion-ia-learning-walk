
"use client";

import { useState } from "react";
import { Eye, Loader2, Sparkles, X } from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";

interface ObservationActionProps {
    observation: {
        maestra: string;
        objetivo: string;
        wows: string;
        wonders: string;
    };
}

export function ObservationAction({ observation }: ObservationActionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleOpen = async () => {
        setIsOpen(true);
        if (!suggestions) {
            setIsLoading(true);
            try {
                const response = await axios.post("/api/suggestions", { observation });
                setSuggestions(response.data.suggestions);
            } catch (error) {
                console.error("Error generating suggestions:", error);
                setSuggestions("No se pudieron generar sugerencias en este momento.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <>
            <button
                onClick={handleOpen}
                className="p-2 hover:bg-white rounded-lg transition border border-transparent hover:border-slate-200 group active:scale-95"
            >
                <Eye className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full m-4 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-x-2">
                                <div className="p-1.5 bg-indigo-100 rounded-md">
                                    <Sparkles className="h-4 w-4 text-indigo-600" />
                                </div>
                                <h3 className="font-semibold text-slate-800">Sugerencias de IA</h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-slate-200 rounded-full transition"
                            >
                                <X className="h-4 w-4 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-4 text-sm text-slate-500">
                                Analizando observación de <span className="font-semibold text-slate-700">{observation.maestra}</span>...
                            </div>

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                    <p className="text-sm text-slate-400 animate-pulse">Generando acciones breves...</p>
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed font-medium">
                                        <div
                                            dangerouslySetInnerHTML={{ __html: suggestions?.replace(/\n/g, "<br/>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") || "" }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium text-sm"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
