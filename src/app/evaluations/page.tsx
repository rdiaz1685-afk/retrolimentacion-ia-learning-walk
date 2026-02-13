
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
            const { evaluations } = await getAllData(session.accessToken!);
            rawData = evaluations;
        } else if (user.campus) {
            const { evaluations, users } = await getCampusData(user.campus, session.accessToken!);

            if (user.role === "COORDINADORA" && user.email) {
                const currentUser = users.find((u: any) => u.email?.toLowerCase() === user.email?.toLowerCase());
                if (currentUser) {
                    const coordinatorId = currentUser.id_usuario;
                    const coordinatorName = currentUser.nombre;

                    rawData = evaluations.filter((e: any) =>
                        (coordinatorId && e.id_usuario_coordinador === coordinatorId) ||
                        (coordinatorName && e.id_usuario_coordinador === coordinatorName) ||
                        (coordinatorName && e.nombre_coordinador === coordinatorName)
                    );
                } else {
                    rawData = evaluations;
                }
            } else {
                rawData = evaluations;
            }
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
        <div className="p-4 md:p-8">
            <EvaluationsList data={data} />
        </div>
    );
}
