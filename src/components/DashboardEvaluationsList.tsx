"use client";

import React, { useState, useMemo } from 'react';
import { Filter, User, MapPin, Search, FileJson, CheckSquare, Square, Trash2, Info } from 'lucide-react';
import { DashboardObservationItem } from './DashboardObservationItem';

interface Evaluation {
    maestra: string;
    id_maestro?: string;
    coordinadora: string;
    campus: string;
    wows: string;
    wonders: string;
    fecha: string;
    semana?: string;
    objetivo?: string;
}

interface Teacher {
    id_maestro: string;
    nombre: string;
    campus?: string;
}

interface DashboardEvaluationsListProps {
    initialData: Evaluation[];
    allTeachers: Teacher[];
    availableCampuses: string[];
    userRole: string;
}

export const DashboardEvaluationsList = ({
    initialData,
    allTeachers,
    availableCampuses,
    userRole
}: DashboardEvaluationsListProps) => {
    const [selectedCampus, setSelectedCampus] = useState<string>("all");
    const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Multi-selection state
    const [selectedObservations, setSelectedObservations] = useState<Evaluation[]>([]);

    // Filter teachers based on selected campus
    const filteredTeachersList = useMemo(() => {
        if (selectedCampus === "all") return allTeachers;
        return allTeachers.filter(t => t.campus === selectedCampus);
    }, [allTeachers, selectedCampus]);

    // Apply filtering to evaluations
    const filteredData = useMemo(() => {
        return initialData.filter(item => {
            const matchesSearch = searchTerm === "" ||
                item.maestra.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.coordinadora.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.campus.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCampus = selectedCampus === "all" || item.campus === selectedCampus;

            const matchesTeacher = selectedTeacher === "all" ||
                item.maestra === selectedTeacher ||
                item.id_maestro === selectedTeacher;

            return matchesSearch && matchesCampus && matchesTeacher;
        });
    }, [initialData, selectedCampus, selectedTeacher, searchTerm]);

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
        const exportFileDefaultName = `analisis-ia-dashboard-${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 mt-8 mb-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Historial de Observaciones</h2>
                    <p className="text-slate-500 text-sm mt-1">Selecciona registros para comparar y analizar con la IA.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {selectedObservations.length > 0 && (
                        <div className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-md animate-in fade-in slide-in-from-right-4">
                            <span className="text-xs font-bold">{selectedObservations.length} seleccionadas</span>
                            <div className="w-[1px] h-4 bg-indigo-400 mx-1"></div>
                            <button
                                onClick={exportToJson}
                                className="hover:text-indigo-200 transition-colors flex items-center gap-1 text-xs font-bold"
                            >
                                <FileJson className="h-4 w-4" /> Exportar para IA
                            </button>
                            <button
                                onClick={clearSelection}
                                className="hover:text-red-200 transition-colors p-1"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {/* Search Bar */}
                <div className="relative flex-grow min-w-[200px]">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Buscador</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            placeholder="Buscar por nombre o coordinación..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>
                </div>

                {/* Campus Filter */}
                <div className="relative min-w-[180px]">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Campus</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <select
                            value={selectedCampus}
                            onChange={handleCampusChange}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
                        >
                            <option value="all">Todos los Campus</option>
                            {availableCampuses.map(campus => (
                                <option key={campus} value={campus}>{campus}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Teacher Filter */}
                <div className="relative min-w-[220px]">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Maestro(a)</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <select
                            value={selectedTeacher}
                            onChange={(e) => setSelectedTeacher(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
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

            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredData.length > 0 ? (
                    filteredData.slice().reverse().map((obs, i) => {
                        const isSelected = selectedObservations.some(o => o.fecha === obs.fecha && o.maestra === obs.maestra);
                        return (
                            <div key={`${obs.maestra}-${i}`} className="flex items-start gap-4">
                                <button
                                    onClick={() => toggleSelection(obs)}
                                    className={`mt-6 transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-400'}`}
                                >
                                    {isSelected ? <CheckSquare className="h-6 w-6" /> : <Square className="h-6 w-6" />}
                                </button>
                                <div className="flex-grow">
                                    <DashboardObservationItem
                                        maestra={obs.maestra}
                                        campus={obs.campus}
                                        fecha={obs.fecha}
                                        wowText={obs.wows}
                                        wonderText={obs.wonders}
                                        objetivo={obs.objetivo}
                                        history={initialData.filter(h => h.maestra === obs.maestra)}
                                    />
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Filter className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No se encontraron observaciones con estos filtros.</p>
                        <button
                            onClick={() => { setSelectedCampus("all"); setSelectedTeacher("all"); setSearchTerm(""); }}
                            className="mt-4 text-blue-600 font-semibold text-sm hover:underline"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
