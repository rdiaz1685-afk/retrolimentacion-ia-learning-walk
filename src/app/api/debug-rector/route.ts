import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllData } from "@/lib/google-sheets";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;
    if (user.role !== "RECTOR") {
        return NextResponse.json({ error: "Solo para RECTOR" }, { status: 403 });
    }

    console.log("[DEBUG-RECTOR] Iniciando diagnóstico completo...");

    try {
        const { evaluations } = await getAllData(session.accessToken!);

        // Agrupar por campus
        const byCampus: Record<string, number> = {};
        evaluations.forEach((e: any) => {
            const c = e.campus || "sin-campus";
            byCampus[c] = (byCampus[c] || 0) + 1;
        });

        // Muestra las primeras 2 filas de cada campus para verificar campos
        const samples: Record<string, any> = {};
        evaluations.forEach((e: any) => {
            const c = e.campus || "sin-campus";
            if (!samples[c]) {
                samples[c] = {
                    keys: Object.keys(e),
                    wows: e.WOWS_Texto || e.WOWS || e.Wows || "(no encontrado)",
                    wonders: e.WONDERS_Texto || e.WONDERS || e.Wonders || "(no encontrado)",
                    maestra: e.nombre_maestro || e.maestra || e.Maestra || "(no encontrado)"
                };
            }
        });

        return NextResponse.json({
            totalEvaluaciones: evaluations.length,
            porCampus: byCampus,
            muestraPorCampus: samples,
            accessToken: session.accessToken ? "PRESENTE" : "AUSENTE"
        }, { status: 200 });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
