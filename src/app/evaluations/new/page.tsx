
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCampusData, getAllData } from "@/lib/google-sheets";
import { EvaluationForm } from "@/components/EvaluationForm";
import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { CAMPUS_DATA } from "@/config/campus-config";

export default async function NewEvaluationPage({
    searchParams
}: {
    searchParams: Promise<{ campus?: string }>
}) {
    const params = await searchParams;
    const session = await auth();

    if (!session) {
        redirect("/");
    }

    const user = session.user;
    const role = user.role || "GUEST";

    // Solo manejamos Extracurricular por ahora en este formulario.
    // Los demás campus siguen usando AppSheet pero sus datos se consultan aquí.
    const selectedCampus = "Extracurricular";

    let campusData: any = { teachers: [], classrooms: [], users: [] };
    try {
        // Obtenemos los datos del campus Extracurricular para llenar los selectores
        campusData = await getCampusData(selectedCampus, session.accessToken!);
    } catch (error) {
        console.error("Error loading campus data for extracurricular form:", error);
    }

    // Buscamos el ID numérico del usuario actual en la lista de coordinadores
    const currentUser = campusData.users.find((u: any) =>
        u.email?.toLowerCase() === user.email?.toLowerCase() ||
        u.correo?.toLowerCase() === user.email?.toLowerCase()
    );

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
                <div>
                    <Link
                        href="/evaluations"
                        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-bold mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" /> Volver al listado
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Nueva Observación Extracurricular</h1>
                    <p className="text-sm text-slate-500">
                        Este formulario es exclusivo para <span className="font-bold text-indigo-600 uppercase">Extracurricular</span>.
                    </p>
                </div>
            </div>

            <EvaluationForm
                teachers={campusData.teachers}
                classrooms={campusData.classrooms}
                campus={selectedCampus}
                coordinator={{
                    id: String(currentUser?.id_usuario || user.email || "Unknown"),
                    name: currentUser?.nombre || user.name || "Coordinadora",
                    role: role,
                    email: user.email ?? undefined
                }}
            />
        </div>
    );
}
