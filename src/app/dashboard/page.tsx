
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCampusData, getAllData } from "@/lib/google-sheets";
import { DashboardCharts } from "@/components/DashboardCharts";
import { DashboardObservationItem } from "@/components/DashboardObservationItem";
import {
    Users,
    MessageSquare,
    TrendingUp,
    Award,
    Calendar,
    Filter,
    Download
} from "lucide-react";

import { PrintReportButton } from "@/components/PrintReportButton";

export default async function DashboardPage() {
    const session = await auth();

    if (!session) {
        redirect("/");
    }

    const user = session.user;
    let rawData = [];

    try {
        if (user.role === "RECTOR") {
            rawData = await getAllData(session.accessToken!);
        } else if (user.campus) {
            rawData = await getCampusData(user.campus, session.accessToken!);
        }
    } catch (error) {
        console.error("Error loading dashboard data:", error);
    }

    // Map real data to UI fields
    const data = rawData.map((item: any) => ({
        maestra: item.nombre_maestro || item.id_maestro || "Maestra no especificada",
        coordinadora: item.id_usuario_coordinador || "Coordinadora",
        campus: item.campus || user.campus,
        wows: item.WOWS_Texto || "",
        wonders: item.WONDERS_Texto || "",
        fecha: item.fecha || ""
    }));

    // Statistics calculation based on real data
    const stats = [
        { label: "Total Observaciones", value: data.length, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Wows Registrados", value: data.filter(d => d.wows).length, icon: Award, color: "text-yellow-600", bg: "bg-yellow-100" },
        { label: "Wonders Detectados", value: data.filter(d => d.wonders).length, icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-100" },
        { label: "Última Semana", value: rawData[rawData.length - 1]?.semana || "N/A", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
    ];

    return (
        <div className="p-8">
            {/* Header exclusivo para impresión (oculto en pantalla) */}
            <div className="hidden print:block mb-8 border-b pb-4 print-header-only">
                <h1 className="text-2xl font-bold text-slate-900">Reporte de Desempeño - Learning Walk</h1>
                <p className="text-slate-600">Generado por: {user.name} • Fecha: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="flex items-center justify-between mb-8 print:hidden">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Bienvenido, {user.name}</h1>
                    <p className="text-slate-500">
                        {user.role === "RECTOR"
                            ? "Reporte consolidado de todos los campus."
                            : `Panel de control - Campus ${user.campus}`}
                    </p>
                </div>
                <div className="flex gap-x-2">
                    <PrintReportButton />
                </div>
            </div>

            <div id="visual-dashboard" className="space-y-8 print-container">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => (
                        <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-x-4">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <DashboardCharts data={data} role={user.role} />
            </div>

            <div className="grid grid-cols-1 gap-8 mt-8 print:hidden">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Observaciones Semana Actual (Nombres Reales)</h2>
                    <div className="space-y-4">
                        {(() => {
                            // Filter logic for current week
                            // Assuming 'semana' is a number or string like "1", "2", ... "10"
                            // We will try to find the max week number from the data and show only that.
                            // If 'semana' is not reliable, we'd need date parsing.
                            // Based on 'rawData' having 'semana', let's use that.

                            const maxWeek = rawData.reduce((max: number, item: any) => {
                                const w = parseInt(item.semana);
                                return !isNaN(w) && w > max ? w : max;
                            }, 0);

                            const currentWeekData = maxWeek > 0
                                ? data.filter((_, idx) => parseInt(rawData[idx]?.semana) === maxWeek)
                                : data.slice().reverse().slice(0, 20); // Fallback to last 20 if no valid weeks found

                            // If we filtered by week, we still might want to show them in some order (e.g. latest first?)
                            // The original data seems to be chronological.
                            const displayData = maxWeek > 0 ? currentWeekData.reverse() : currentWeekData;

                            if (displayData.length === 0) {
                                return <p className="text-slate-500 text-center py-8">No se encontraron datos para la semana actual.</p>;
                            }

                            return displayData.map((obs, i) => (
                                <DashboardObservationItem
                                    key={i}
                                    maestra={obs.maestra}
                                    campus={obs.campus}
                                    fecha={obs.fecha}
                                    wowText={obs.wows}
                                    wonderText={obs.wonders}
                                />
                            ));
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}
