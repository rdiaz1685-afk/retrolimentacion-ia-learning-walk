
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCampusData, getAllData } from "@/lib/google-sheets";
import { EvaluationsList } from "@/components/EvaluationsList";
import { CAMPUS_DATA } from "@/config/campus-config";
import { ComplianceTable } from "@/components/ComplianceTable";
import { RefreshButton } from "@/components/RefreshButton";
import { WeekSelector } from "@/components/WeekSelector";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function EvaluationsPage({
    searchParams: searchParamsPromise
}: {
    searchParams: Promise<{ semana?: string }>
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

    // --- LÓGICA DE SEMANAS ---
    const allWeeks = [...new Set(rawEvaluations.map((e: any) => String(e.semana)))]
        .filter(w => w && w !== "undefined")
        .sort((a, b) => Number(a) - Number(b));

    const lastWeek = allWeeks[allWeeks.length - 1] || "";
    const selectedWeek = searchParams.semana || lastWeek;

    // --- LÓGICA DE CUMPLIMIENTO (Sincronizada con la semana seleccionada) ---
    const complianceData = users
        .filter((u: any) => u.id_usuario && (u.nombre || u.email))
        .map((coord: any) => {
            const coordinatorId = coord.id_usuario;
            const myTeachers = teachers.filter((t: any) =>
                t.id_usuario_coordinador === coordinatorId ||
                t.id_coordinadora === coordinatorId ||
                t.id_coordinador === coordinatorId
            );

            if (myTeachers.length === 0) return null;

            const weeklyHistory = allWeeks.map((week: any) => {
                const evalThisWeek = rawEvaluations.filter((e: any) =>
                    (e.id_usuario_coordinador === coordinatorId || e.coordinadora === coord.nombre) &&
                    String(e.semana) === week
                );
                const uniqueEvaluated = new Set(evalThisWeek.map((e: any) => e.id_maestro)).size;
                return { semana: week, porcentaje: (uniqueEvaluated / myTeachers.length) * 100 };
            });

            // Cumplimiento para la semana SELECCIONADA
            const selectedEvalCount = new Set(
                rawEvaluations
                    .filter((e: any) =>
                        (e.id_usuario_coordinador === coordinatorId || e.coordinadora === coord.nombre) &&
                        String(e.semana) === selectedWeek
                    )
                    .map((e: any) => e.id_maestro)
            ).size;

            return {
                coordinatorName: coord.nombre || coord.email,
                campus: coord.campus || user.campus || "N/A",
                totalAssigned: myTeachers.length,
                completedThisWeek: selectedEvalCount,
                percentage: (selectedEvalCount / myTeachers.length) * 100,
                history: weeklyHistory
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
        semana: String(item.semana)
    }));

    // Filipar el listado por el rol y la semana seleccionada
    let displayData = allMappedData.filter((obs: any) => obs.semana === selectedWeek);

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
                    <WeekSelector weeks={allWeeks} currentWeek={String(selectedWeek)} />
                    <RefreshButton />
                </div>
            </div>

            {/* Sección de Auditoría de Cumplimiento (Sincronizada) */}
            {(user.role === "RECTOR" || user.role === "DIRECTORA" || user.role === "COORDINADORA") && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <ComplianceTable
                        title={`Cumplimiento Semana ${String(selectedWeek)}`}
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
