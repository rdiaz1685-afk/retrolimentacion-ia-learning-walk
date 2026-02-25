
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

import { getCampusData, getAllData } from "@/lib/google-sheets";
import { EvaluationsList } from "@/components/EvaluationsList";
import { CAMPUS_DATA } from "@/config/campus-config";
import { ComplianceTable } from "@/components/ComplianceTable";
import { RefreshButton } from "@/components/RefreshButton";
import { FortnightSelector } from "@/components/WeekSelector";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function EvaluationsPage({
    searchParams: searchParamsPromise
}: {
    searchParams: Promise<{ semana?: string; quincena?: string }>
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
        console.error("Error loading evaluations data:", error);
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

    const selectedWeek = searchParams.semana || ""; // Mantener por compatibilidad

    // --- LÓGICA DE CUMPLIMIENTO QUINCENAL (14 DÍAS DE GRACIA) ---
    const today = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;

    const parseDate = (dateStr: string) => {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    };

    const fortnights: number[] = availableFortnights;

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

            const fortnightlyHistory = fortnights.map((f: any) => {
                const evalThisFortnight = rawEvaluations.filter((e: any) => {
                    const eFortnight = Math.ceil(Number(e.semana) / 2);
                    return (e.id_usuario_coordinador === coordinatorId || e.coordinadora === coord.nombre) &&
                        eFortnight === f &&
                        e.campus === coordinatorCampus;
                });
                const uniqueEvaluated = new Set(evalThisFortnight.map((e: any) => e.id_maestro)).size;
                return { semana: `Q${f}`, porcentaje: (uniqueEvaluated / myTeachers.length) * 100 };
            });

            // CUMPLIMIENTO PARA LA QUINCENA SELECCIONADA
            const evalInSelectedFortnight = rawEvaluations.filter((e: any) => {
                const eFortnight = Math.ceil(Number(e.semana) / 2);
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

    // Mapeo de datos para la UI
    const allMappedData = rawEvaluations.map((item: any) => ({
        maestra: item.nombre_maestro || item.id_maestro || "Maestra no especificada",
        id_maestro: item.id_maestro,
        coordinadora: item.nombre_coordinador || item.id_usuario_coordinador || "Coordinadora",
        campus: item.campus || user.campus,
        aula: item.nombre_aula || item.Aula || "",
        objetivo: item.Objetive || item.objetivo || "",
        wows: item.WOWS_Texto || "",
        wonders: item.WONDERS_Texto || "",
        fecha: item.fecha || "",
        semana: String(item.semana),
        quincena: Math.ceil(getWeekNumber(item.semana) / 2)
    }));

    // Filtrar el listado por el rol y la QUINCENA seleccionada
    let displayData = allMappedData.filter((obs: any) => obs.quincena === selectedFortnight);

    if (user.role === "COORDINADORA" && user.email) {
        const currentUser = users.find((u: any) => u.email?.toLowerCase() === user.email?.toLowerCase());
        if (currentUser) {
            const coordinatorId = currentUser.id_usuario;
            displayData = displayData.filter((e: any) => e.id_usuario_coordinador === coordinatorId || e.coordinadora === currentUser.nombre);
        }
    }

    const availableCampuses = Object.keys(CAMPUS_DATA) as string[];

    return (
        <div className="p-4 md:p-8 space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Evaluaciones y Cumplimiento</h1>
                    <p className="text-sm text-slate-500">Auditoría de la <span className="font-bold text-indigo-600">Semana {String(selectedWeek)}</span></p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/evaluations/new"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                    >
                        <Plus className="h-4 w-4" /> Nueva Observación Extracurricular
                    </Link>
                    <FortnightSelector fortnights={availableFortnights} currentFortnight={selectedFortnight} />
                    <RefreshButton />
                </div>
            </div>

            {/* Sección de Auditoría de Cumplimiento (Sincronizada) */}
            {(user.role === "RECTOR" || user.role === "DIRECTORA" || user.role === "COORDINADORA") && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <ComplianceTable
                        title="Efectividad de Observación (Ventana 14 días)"
                        complianceData={(complianceData as any[]).filter(c => {
                            if (user.role !== "COORDINADORA") return true;
                            return c?.coordinatorName?.toLowerCase().includes(user.name?.toLowerCase() || "");
                        })}
                    />
                </div>
            )}

            <EvaluationsList
                data={displayData}
                fullHistory={allMappedData}
                allTeachers={teachers}
                availableCampuses={availableCampuses}
            />
        </div>
    );
}
