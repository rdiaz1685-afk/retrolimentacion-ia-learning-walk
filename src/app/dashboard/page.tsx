
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
    let context: any = { evaluations: [], teachers: [], users: [] };

    try {
        if (user.role === "RECTOR") {
            context = await getAllData(session.accessToken!);
        } else if (user.campus) {
            context = await getCampusData(user.campus, session.accessToken!);
        }
    } catch (error) {
        console.error("Error loading dashboard data:", error);
    }

    const { evaluations: rawEvaluations, teachers, users } = context;

    // Filter evaluations by role
    let filteredEvaluations = rawEvaluations;
    let progressData = undefined;

    if (user.role === "COORDINADORA" && user.email) {
        // 1. Find the current coordinator's ID in the users list
        const currentUser = users.find((u: any) => u.email?.toLowerCase() === user.email?.toLowerCase());

        if (currentUser) {
            const coordinatorId = currentUser.id_usuario;

            // 2. Find teachers assigned to this coordinator
            // We'll try some common column names: id_usuario_coordinador, id_coordinadora, id_coordinador
            const assignedTeachers = teachers.filter((t: any) =>
                t.id_usuario_coordinador === coordinatorId ||
                t.id_coordinadora === coordinatorId ||
                t.id_coordinador === coordinatorId
            );

            if (assignedTeachers.length > 0) {
                // 3. Find which of these teachers have been evaluated
                const evaluatedTeacherIds = new Set(rawEvaluations.map((e: any) => e.id_maestro));
                const evaluatedCount = assignedTeachers.filter((t: any) => evaluatedTeacherIds.has(t.id_maestro)).length;
                const pendingCount = assignedTeachers.length - evaluatedCount;

                progressData = [
                    { name: "Evaluadas", value: evaluatedCount },
                    { name: "Pendientes", value: pendingCount }
                ];

                // Also filter the observations list to only show theirs
                filteredEvaluations = rawEvaluations.filter((e: any) => e.id_usuario_coordinador === coordinatorId);
            }
        }
    }

    // Map real data to UI fields
    const data = filteredEvaluations.map((item: any) => ({
        maestra: item.nombre_maestro || item.id_maestro || "Maestra no especificada",
        coordinadora: item.nombre_coordinador || item.id_usuario_coordinador || "Coordinadora",
        campus: item.campus || user.campus,
        wows: item.WOWS_Texto || "",
        wonders: item.WONDERS_Texto || "",
        fecha: item.fecha || ""
    }));

    // Statistics calculation based on real data
    const stats = [
        { label: "Total Observaciones", value: data.length, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Wows Registrados", value: data.filter((d: any) => d.wows).length, icon: Award, color: "text-yellow-600", bg: "bg-yellow-100" },
        { label: "Wonders Detectados", value: data.filter((d: any) => d.wonders).length, icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-100" },
        { label: "Última Semana", value: rawEvaluations[rawEvaluations.length - 1]?.semana || "N/A", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
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

                <DashboardCharts data={data} role={user.role} progressData={progressData} />
            </div>

            <div className="grid grid-cols-1 gap-8 mt-8 print:hidden">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Observaciones Semana Actual (Nombres Reales)</h2>
                    <div className="space-y-4">
                        {(() => {
                            // Filter logic for current week
                            const maxWeek = rawEvaluations.reduce((max: number, item: any) => {
                                const w = parseInt(item.semana);
                                return !isNaN(w) && w > max ? w : max;
                            }, 0);

                            const currentWeekData = maxWeek > 0
                                ? data.filter((_: any, idx: number) => parseInt(filteredEvaluations[idx]?.semana) === maxWeek)
                                : data.slice().reverse().slice(0, 20);

                            const displayData = maxWeek > 0 ? currentWeekData.reverse() : currentWeekData;

                            if (displayData.length === 0) {
                                return <p className="text-slate-500 text-center py-8">No se encontraron datos para la semana actual.</p>;
                            }

                            return displayData.map((obs: any, i: number) => (
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
