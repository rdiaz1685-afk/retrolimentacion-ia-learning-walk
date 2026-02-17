"use client";

import React, { useState, useMemo } from 'react';
import { Filter, User, MapPin } from 'lucide-react';
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

    // Filter teachers based on selected campus
    const filteredTeachersList = useMemo(() => {
        if (selectedCampus === "all") return allTeachers;
        return allTeachers.filter(t => t.campus === selectedCampus);
    }, [allTeachers, selectedCampus]);

    // Apply filtering to evaluations
    const filteredData = useMemo(() => {
        return initialData.filter(item => {
            const matchesCampus = selectedCampus === "all" || item.campus === selectedCampus;

            // Check for teacher match using either name or ID
            const matchesTeacher = selectedTeacher === "all" ||
                item.maestra === selectedTeacher ||
                item.id_maestro === selectedTeacher;

            return matchesCampus && matchesTeacher;
        });
    }, [initialData, selectedCampus, selectedTeacher]);

    // Handle campus change - reset teacher
    const handleCampusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCampus = e.target.value;
        setSelectedCampus(newCampus);
        setSelectedTeacher("all");
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 mt-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Historial de Observaciones</h2>
                    <p className="text-slate-500 text-sm mt-1">Filtra por campus y maestros para ver detalles específicos.</p>
                </div>

                <div className="flex flex-wrap gap-4">
                    {/* Campus Filter */}
                    <div className="relative min-w-[180px]">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Campus</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            <select
                                value={selectedCampus}
                                onChange={handleCampusChange}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
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
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
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
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredData.length > 0 ? (
                    filteredData.slice().reverse().map((obs, i) => (
                        <DashboardObservationItem
                            key={`${obs.maestra}-${i}`}
                            maestra={obs.maestra}
                            campus={obs.campus}
                            fecha={obs.fecha}
                            wowText={obs.wows}
                            wonderText={obs.wonders}
                        />
                    ))
                ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Filter className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No se encontraron observaciones con estos filtros.</p>
                        <button
                            onClick={() => { setSelectedCampus("all"); setSelectedTeacher("all"); }}
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
