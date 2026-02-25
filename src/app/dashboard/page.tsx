
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

import { getCampusData, getAllData } from "@/lib/google-sheets";
import { DashboardCharts } from "@/components/DashboardCharts";
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
import { DashboardEvaluationsList } from "@/components/DashboardEvaluationsList";
import { CAMPUS_DATA } from "@/config/campus-config";
import { ComplianceTable } from "@/components/ComplianceTable";
import { RefreshButton } from "@/components/RefreshButton";
import { FortnightSelector } from "@/components/WeekSelector";

export default async function DashboardPage({
    searchParams: searchParamsPromise
}: {
    searchParams: Promise<{ quincena?: string }>
}) {
    const searchParams = await searchParamsPromise;
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

    // Helper para extraer el número de semana de forma robusta
    const getWeekNumber = (val: any) => {
        if (!val) return 0;
        const str = String(val).toLowerCase();
        const match = str.match(/\d+/);
        return match ? Number(match[0]) : 0;
    };

    // --- LÓGICA DE QUINCENAS ---
    const allWeeksNum = ([...new Set(rawEvaluations.map((e: any) => getWeekNumber(e.semana)))] as number[])
        .filter(w => w > 0)
        .sort((a, b) => a - b);

    const availableFortnights = ([...new Set(allWeeksNum.map(w => Math.ceil(w / 2)))] as number[]).sort((a, b) => a - b);
    const lastFortnight = availableFortnights[availableFortnights.length - 1] || 0;
    const selectedFortnight = searchParams.quincena ? Number(searchParams.quincena) : lastFortnight;

    const msPerDay = 24 * 60 * 60 * 1000;
    const today = new Date();

    const parseDate = (dateStr: string) => {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    };

    const complianceData = users
        .filter((u: any) => u.id_usuario && (u.nombre || u.email))
        .map((coord: any) => {
            const coordinatorId = coord.id_usuario;
            const coordinatorCampus = coord.campus;

            const myTeachers = teachers.filter((t: any) =>
                (t.id_usuario_coordinador === coordinatorId ||
                    t.id_coordinadora === coordinatorId ||
                    t.id_coordinador === coordinatorId) &&
                t.campus === coordinatorCampus
            );

            if (myTeachers.length === 0) return null;

            const fortnightlyHistory = availableFortnights.map((f: any) => {
                const evalThisFortnight = rawEvaluations.filter((e: any) => {
                    const eWeek = getWeekNumber(e.semana);
                    const eFortnight = Math.ceil(eWeek / 2);
                    return (e.id_usuario_coordinador === coordinatorId || e.coordinadora === coord.nombre) &&
                        eFortnight === f &&
                        e.campus === coordinatorCampus;
                });
                const uniqueEvaluated = new Set(evalThisFortnight.map((e: any) => e.id_maestro)).size;
                return { semana: `Q${f}`, porcentaje: (uniqueEvaluated / myTeachers.length) * 100 };
            });

            // CUMPLIMIENTO PARA LA QUINCENA SELECCIONADA
            const evalInSelectedFortnight = rawEvaluations.filter((e: any) => {
                const eWeek = getWeekNumber(e.semana);
                const eFortnight = Math.ceil(eWeek / 2);
                return (e.id_usuario_coordinador === coordinatorId || e.coordinadora === coord.nombre) &&
                    eFortnight === selectedFortnight &&
                    e.campus === coordinatorCampus;
            });
            const uniqueEvaluatedCount = new Set(evalInSelectedFortnight.map((e: any) => e.id_maestro)).size;

            return {
                coordinatorName: coord.nombre || coord.email,
                campus: coordinatorCampus || "N/A",
                totalAssigned: myTeachers.length,
                completedThisWeek: uniqueEvaluatedCount,
                percentage: (uniqueEvaluatedCount / myTeachers.length) * 100,
                history: fortnightlyHistory
            };
        })
        .filter(Boolean);

    // Filtrado de evaluaciones por rol y SELECCIÓN DE QUINCENA
    let filteredEvaluations = rawEvaluations.filter((e: any) => {
        const week = getWeekNumber(e.semana);
        return week > 0 && Math.ceil(week / 2) === selectedFortnight;
    });
    let progressData = undefined;

    if (user.role === "COORDINADORA" && user.email) {
        const currentUser = users.find((u: any) => u.email?.toLowerCase() === user.email?.toLowerCase());
        if (currentUser) {
            const coordinatorId = currentUser.id_usuario;

            // Evaluaciones de la coordinadora en la quincena seleccionada
            filteredEvaluations = filteredEvaluations.filter((e: any) => e.id_usuario_coordinador === coordinatorId || e.coordinadora === currentUser.nombre);

            const myTeachers = teachers.filter((t: any) => t.id_usuario_coordinador === coordinatorId);
            const evaluatedCountInFortnight = new Set(filteredEvaluations.map((e: any) => e.id_maestro)).size;

            progressData = [
                { name: "Evaluadas", value: evaluatedCountInFortnight },
                { name: "Pendientes", value: Math.max(0, myTeachers.length - evaluatedCountInFortnight) }
            ];
        }
    }

    const data = filteredEvaluations.map((item: any) => ({
        maestra: item.nombre_maestro || item.id_maestro || "Maestra no especificada",
        id_maestro: item.id_maestro,
        coordinadora: item.nombre_coordinador || item.id_usuario_coordinador || "Coordinadora",
        campus: item.campus || user.campus,
        wows: item.WOWS_Texto || "",
        wonders: item.WONDERS_Texto || "",
        fecha: item.fecha || "",
        semana: item.semana,
        objetivo: item.objetivo
    }));

    const availableCampuses = Object.keys(CAMPUS_DATA);

    const lastWeek = allWeeksNum[allWeeksNum.length - 1];
    const stats = [
        { label: "Obs. Quincena", value: filteredEvaluations.length, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Wows (Quincena)", value: filteredEvaluations.filter((d: any) => d.WOWS_Texto).length, icon: Award, color: "text-yellow-600", bg: "bg-yellow-100" },
        { label: "Wonders (Quincena)", value: filteredEvaluations.filter((d: any) => d.WONDERS_Texto).length, icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-100" },
        { label: "Total Histórico", value: rawEvaluations.length, icon: TrendingUp, color: "text-slate-600", bg: "bg-slate-100" },
    ];

    return (
        <div className="p-4 md:p-8">
            <div className="hidden print:block mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold text-slate-900">Reporte de Desempeño - Learning Walk</h1>
                <p className="text-slate-600">Generado por: {user.name} • Fecha: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-4 mb-8 print:hidden">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Bienvenido, {user.name}</h1>
                    <p className="text-sm md:text-base text-slate-500">
                        {user.role === "RECTOR"
                            ? `Reporte consolidado - Quincena ${selectedFortnight}`
                            : `Panel de control - Campus ${user.campus} - Quincena ${selectedFortnight}`}
                    </p>
                </div>
                <div className="flex items-center gap-x-2">
                    <FortnightSelector fortnights={availableFortnights} currentFortnight={selectedFortnight} />
                    <RefreshButton />
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

                <DashboardCharts
                    data={data}
                    fullHistory={rawEvaluations}
                    role={user.role}
                    progressData={progressData}
                />

                {(user.role === "RECTOR" || user.role === "DIRECTORA" || user.role === "COORDINADORA") && (
                    <ComplianceTable
                        complianceData={user.role === "COORDINADORA"
                            ? complianceData.filter((c: any) => c?.coordinatorName?.toLowerCase().includes(user.name?.toLowerCase() || ""))
                            : complianceData
                        }
                    />
                )}
            </div>

            <DashboardEvaluationsList
                initialData={data}
                allTeachers={teachers}
                availableCampuses={availableCampuses}
                userRole={user.role || ""}
            />
        </div>
    );
}
