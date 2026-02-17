
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCampusData, getAllData } from "@/lib/google-sheets";
import { EvaluationsList } from "@/components/EvaluationsList";
import { CAMPUS_DATA } from "@/config/campus-config";

export default async function EvaluationsPage() {
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

    // Filter evaluations by role
    let filteredEvaluations = rawEvaluations;
    if (user.role === "COORDINADORA" && user.email) {
        const currentUser = users.find((u: any) => u.email?.toLowerCase() === user.email?.toLowerCase());
        if (currentUser) {
            const coordinatorId = currentUser.id_usuario;
            filteredEvaluations = rawEvaluations.filter((e: any) => e.id_usuario_coordinador === coordinatorId);
        }
    }

    // Map real data to UI fields
    const data = filteredEvaluations.map((item: any) => ({
        maestra: item.nombre_maestro || item.id_maestro || "Maestra no especificada",
        id_maestro: item.id_maestro,
        coordinadora: item.nombre_coordinador || item.id_usuario_coordinador || "Coordinadora",
        campus: item.campus || user.campus,
        aula: item.nombre_aula || item.Aula || "",
        objetivo: item.Objetive || "",
        wows: item.WOWS_Texto || "",
        wonders: item.WONDERS_Texto || "",
        fecha: item.fecha || ""
    }));

    const availableCampuses = Object.keys(CAMPUS_DATA);

    return (
        <div className="p-4 md:p-8">
            <EvaluationsList
                data={data}
                allTeachers={teachers}
                availableCampuses={availableCampuses}
            />
        </div>
    );
}
