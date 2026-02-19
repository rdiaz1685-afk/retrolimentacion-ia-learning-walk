"use client";

import { useState, useMemo } from "react";
import { Search, Info, MapPin, User, FileJson, CheckSquare, Square, Trash2, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { ObservationAction } from "@/components/ObservationAction";
import { ExportPdfButton } from "@/components/ExportPdfButton";

interface Evaluation {
    maestra: string;
    id_maestro?: string;
    coordinadora: string;
    campus: string;
    aula: string;
    wows: string;
    wonders: string;
    fecha: string;
    objetivo: string;
}

interface Teacher {
    id_maestro: string;
    nombre: string;
    campus?: string;
}

export function EvaluationsList({
    data,
    allTeachers = [],
    availableCampuses = []
}: {
    data: Evaluation[],
    allTeachers?: Teacher[],
    availableCampuses?: string[]
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCampus, setSelectedCampus] = useState("all");
    const [selectedTeacher, setSelectedTeacher] = useState("all");

    // Multi-selection state
    const [selectedObservations, setSelectedObservations] = useState<Evaluation[]>([]);

    const filteredTeachersList = useMemo(() => {
        if (selectedCampus === "all") return allTeachers;
        return allTeachers.filter(t => t.campus === selectedCampus);
    }, [allTeachers, selectedCampus]);

    const filteredData = useMemo(() => {
        return data.filter(obs => {
            const matchesSearch = searchTerm === "" ||
                obs.maestra.toLowerCase().includes(searchTerm.toLowerCase()) ||
                obs.coordinadora.toLowerCase().includes(searchTerm.toLowerCase()) ||
                obs.campus.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (obs.aula && obs.aula.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesCampus = selectedCampus === "all" || obs.campus === selectedCampus;

            const matchesTeacher = selectedTeacher === "all" ||
                obs.maestra === selectedTeacher ||
                obs.id_maestro === selectedTeacher;

            return matchesSearch && matchesCampus && matchesTeacher;
        });
    }, [data, searchTerm, selectedCampus, selectedTeacher]);

    const handleCampusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCampus(e.target.value);
        setSelectedTeacher("all");
    };

    // Selection logic
    const toggleSelection = (obs: Evaluation) => {
        const isSelected = selectedObservations.some(o => o.fecha === obs.fecha && o.maestra === obs.maestra);
        if (isSelected) {
            setSelectedObservations(prev => prev.filter(o => !(o.fecha === obs.fecha && o.maestra === obs.maestra)));
        } else {
            setSelectedObservations(prev => [...prev, obs]);
        }
    };

    const clearSelection = () => setSelectedObservations([]);

    const exportToJson = () => {
        const dataStr = JSON.stringify(selectedObservations, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `analisis-comparativo-${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    return (
        <>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-y-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Listado de Observaciones</h1>
                    <p className="text-sm text-slate-500">Filtrado inteligente y exportación para IA.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {selectedObservations.length > 0 && (
                        <div className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-md animate-in fade-in slide-in-from-right-4">
                            <span className="text-xs font-bold">{selectedObservations.length} seleccionadas</span>
                            <div className="w-[1px] h-4 bg-indigo-400 mx-1"></div>
                            <button
                                onClick={exportToJson}
                                className="hover:text-indigo-200 transition-colors flex items-center gap-1 text-xs font-bold"
                                title="Exportar JSON para chat IA"
                            >
                                <FileJson className="h-4 w-4" /> Exportar para IA
                            </button>
                            <button
                                onClick={clearSelection}
                                className="hover:text-red-200 transition-colors p-1"
                                title="Limpiar selección"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                    <ExportPdfButton data={filteredData} />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-12">
                <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-end justify-between bg-slate-50/50">
                    <div className="flex flex-wrap gap-4 items-end flex-grow">
                        <div className="relative w-full md:w-80">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Búsqueda rápida</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    placeholder="Nombre, coordinación, aula..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="w-full sm:w-48">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Campus</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                <select
                                    value={selectedCampus}
                                    onChange={handleCampusChange}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                                >
                                    <option value="all">Todos los Campus</option>
                                    {availableCampuses.map(campus => (
                                        <option key={campus} value={campus}>{campus}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="w-full sm:w-64">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Maestro(a)</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                <select
                                    value={selectedTeacher}
                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                                >
                                    <option value="all">Todos los Maestros</option>
                                    {filteredTeachersList
                                        .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""))
                                        .map(teacher => (
                                            <option key={teacher.id_maestro} value={teacher.nombre}>
                                                {teacher.nombre}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-x-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
                        <Info className="h-4 w-4" />
                        <span>{filteredData.length} registros</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-600 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold text-center w-12">
                                    <CheckSquare className="h-4 w-4 mx-auto text-slate-300" />
                                </th>
                                <th className="px-6 py-4 font-bold">Maestra / Coordinadora</th>
                                <th className="px-6 py-4 font-bold">Campus / Aula</th>
                                <th className="px-6 py-4 font-bold">Wows & Wonders</th>
                                <th className="px-6 py-4 font-bold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center max-w-sm mx-auto">
                                            <div className="bg-amber-50 p-4 rounded-full mb-4">
                                                <Info className="h-8 w-8 text-amber-500" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-2">No se encontraron registros</h3>
                                            <p className="text-sm text-slate-500 mb-6">
                                                Si sabes que hay datos pero no aparecen, es posible que tu conexión de Google haya expirado.
                                            </p>
                                            <button
                                                onClick={() => signOut({ callbackUrl: "/" })}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
                                            >
                                                <LogOut className="h-4 w-4" /> Refrescar Conexión
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No se encontraron resultados para los filtros aplicados.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((obs, i) => {
                                    const isSelected = selectedObservations.some(o => o.fecha === obs.fecha && o.maestra === obs.maestra);
                                    return (
                                        <tr key={i} className={`group transition ${isSelected ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50'}`}>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => toggleSelection(obs)}
                                                    className={`transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-300 group-hover:text-slate-400'}`}
                                                >
                                                    {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                                                </button>
                                            </td>
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
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
