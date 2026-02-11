
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCampusData, getAllData } from "@/lib/google-sheets";
import { EvaluationsList } from "@/components/EvaluationsList";

export default async function EvaluationsPage() {
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
        console.error("Error loading evaluations data:", error);
    }

    // Map real data to UI fields
    const data = rawData.map((item: any) => ({
        maestra: item.nombre_maestro || item.id_maestro || "Maestra no especificada",
        coordinadora: item.nombre_coordinador || item.id_usuario_coordinador || "Coordinadora",
        campus: item.campus || user.campus,
        aula: item.nombre_aula || item.Aula || "",
        objetivo: item.Objetive || "",
        wows: item.WOWS_Texto || "",
        wonders: item.WONDERS_Texto || "",
        fecha: item.fecha || ""
    }));

    return (
        <div className="p-8">
            <EvaluationsList data={data} />
        </div>
    );
}
