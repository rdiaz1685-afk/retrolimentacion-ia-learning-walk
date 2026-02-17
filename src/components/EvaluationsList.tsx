
"use client";

import { useState, useMemo } from "react";
import { Search, Info, MapPin, User, Filter } from "lucide-react";
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

    // Filter teachers based on selected campus
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
                <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-end justify-between bg-slate-50/50">
                    <div className="flex flex-wrap gap-4 items-end flex-grow">
                        {/* Search Bar */}
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

                        {/* Campus Filter */}
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

                        {/* Teacher Filter */}
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
