
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { google } from "googleapis";
import { CAMPUS_DATA, SHEET_NAME } from "@/config/campus-config";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { campus, data } = body;

        const campusConfig = CAMPUS_DATA[campus as keyof typeof CAMPUS_DATA];
        if (!campusConfig) throw new Error("Campus no encontrado");

        const authClient = new google.auth.OAuth2();
        authClient.setCredentials({ access_token: session.accessToken });
        const sheets = google.sheets({ version: "v4", auth: authClient });

        // 1. Obtener los encabezados actuales de la hoja
        const headerResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: campusConfig.sheet_id,
            range: `${SHEET_NAME}!1:1`,
        });
        const headers = headerResponse.data.values?.[0] || [];

        if (headers.length === 0) throw new Error("No se encontraron encabezados en la hoja");

        // 2. Resolver el ID numérico del coordinador y Campus del maestro
        let coordinatorIdNumeric = data.id_coordinador;
        let teacherCampus = campus; // Default to selected campus

        try {
            const batchResponse = await sheets.spreadsheets.values.batchGet({
                spreadsheetId: campusConfig.sheet_id,
                ranges: ["usuarios!A:D", "maestros!A:E"],
            });
            const [usersRows, teachersRows] = batchResponse.data.valueRanges?.map(r => r.values) || [];

            // Buscar coordinador
            if (usersRows) {
                const userRow = usersRows.find(row =>
                    row[2]?.toLowerCase() === data.id_coordinador?.toLowerCase() ||
                    row[3]?.toLowerCase() === data.id_coordinador?.toLowerCase()
                );
                if (userRow) coordinatorIdNumeric = userRow[0];
            }

            // Buscar campus del maestro (Columna E es índice 4)
            if (teachersRows) {
                const teacherRow = teachersRows.find(row =>
                    row[0]?.toString() === data.id_maestro?.toString()
                );
                if (teacherRow && teacherRow[4]) {
                    teacherCampus = teacherRow[4];
                }
            }
        } catch (e) { console.error("Error mapeando datos adicionales:", e); }

        // 3. Diccionario de traducción: Nombre del campo en la App -> Posibles nombres en el Excel
        const fieldMap: Record<string, string[]> = {
            "id_eval": ["id_eval", "ID"],
            "id_usuario_coordinador": ["id_usuario_coordinador", "Coordinadora", "id_coordinador", "Observer"],
            "id_maestro": ["id_maestro", "Maestra", "maestra", "Teacher"],
            "fecha": ["fecha", "Fecha", "Date"],
            "semana": ["semana", "Semana"],
            "campus": ["campus", "Campus"],
            "observaciones": ["observaciones", "Observaciones", "Notas"],
            "aula": ["Aula", "aula", "Aula / Espacio", "Classroom"],
            "Completado": ["Completado", "Status", "completado"],
            "p1_val": ["# of students engaged"],
            "p1_obs": ["comentarios_p1"],
            "p2_val": ["El alumno entiende el propósito de la clase"],
            "p2_obs": ["comentarios_p2"],
            "p3_val": ["El maestro utiliza material manipulativo"],
            "p3_obs": ["comentarios_p3"],
            "p4_val": ["El maestro selecciona de manera aleatoria la participacion del alumno"],
            "p4_obs": ["comentarios_p4"],
            "p5_val": ["Roles"],
            "p5_obs": ["comentarios_p5", "Obs_Roles"],
            "p6_val": ["Learning Evaluation", "learning evaluation"],
            "p6_obs": ["comentarios_p6", "Obs_Learning"],
            "tax_nivel": ["Taxonomia", "Q_Aplicar_Num", "Nivel más alto alcanzado"],
            "tax_preguntas": ["Q_Analizar_Num", "Total de preguntas realizadas"],
            "colab_val": ["Q_Evaluar_Num", "Trabajo Colaborativo"],
            "colab_obs": ["Q_Crear_Num", "Comentarios Colaborativo"],
            "wows": ["wows", "WOWS_Texto", "Wows", "WOWS"],
            "wonders": ["wonders", "WONDERS_Texto", "Wonders", "WONDERS"]
        };

        // 4. Construir la fila dinámicamente según los encabezados
        const rowData: Record<string, any> = {
            ...data,
            id_eval: `LW-${Date.now().toString(16).slice(-8)}`,
            id_usuario_coordinador: coordinatorIdNumeric,
            campus: teacherCampus,
            Completado: "YES",
            observaciones: data.observaciones || "1"
        };

        const finalRow = headers.map(header => {
            const h = header.toString().trim();
            // Buscar si este encabezado corresponde a alguno de nuestros campos
            for (const [fieldKey, potentialNames] of Object.entries(fieldMap)) {
                if (potentialNames.some(name => name.toLowerCase() === h.toLowerCase())) {
                    return rowData[fieldKey] || "";
                }
            }
            return ""; // Columna desconocida, la dejamos vacía
        });

        // 5. Guardar en Google Sheets
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: campusConfig.sheet_id,
            range: `${SHEET_NAME}!A:A`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [finalRow]
            },
        });

        console.log("Guardado dinámico exitoso:", response.data.updates);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error al guardar evaluación:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
