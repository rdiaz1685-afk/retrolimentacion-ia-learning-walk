
import { google } from "googleapis";
import { CAMPUS_DATA, SHEET_NAME } from "@/config/campus-config";
import { unstable_noStore as noStore } from "next/cache";

export async function getCampusData(campusName: string, accessToken: string) {
    noStore();
    const campus = CAMPUS_DATA[campusName as keyof typeof CAMPUS_DATA];
    if (!campus) return { evaluations: [], teachers: [], users: [], classrooms: [] };

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: "v4", auth });

    const rowToObj = (rows: any[][] | null | undefined) => {
        if (!rows || rows.length === 0) return [];
        const headers = rows[0].map(h => h.trim());
        return rows.slice(1)
            .filter(row => {
                if (!row || row.length === 0) return false;
                // Una fila es válida si tiene contenido en al menos 3 columnas (para evitar filas con un solo espacio accidental)
                const meaningfulCells = row.filter(cell =>
                    cell !== "" &&
                    cell !== undefined &&
                    cell !== null &&
                    String(cell).trim().length > 0
                );
                return meaningfulCells.length >= 3;
            })
            .map(row => {
                const obj: any = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index];
                });
                return obj;
            });
    };

    try {
        // Optimización: Rangos amplios (A:ZZ) para asegurar capturar WOWS/WONDERS al final de la hoja
        const ranges = [
            `${SHEET_NAME}!A:ZZ`,
            `maestros!A:ZZ`,
            `usuarios!A:ZZ`,
            `aulas!A:ZZ`
        ];

        const batchResponse = await sheets.spreadsheets.values.batchGet({
            spreadsheetId: campus.sheet_id,
            ranges: ranges,
        });

        const valueRanges = batchResponse.data.valueRanges || [];

        const evaluationsRaw = rowToObj(valueRanges[0]?.values);
        const teachersRaw = rowToObj(valueRanges[1]?.values);
        const usersRaw = rowToObj(valueRanges[2]?.values);
        const classroomsRaw = rowToObj(valueRanges[3]?.values);

        // DEBUG: Imprimir encabezados para identificar columnas de WOWS/WONDERS
        if (valueRanges[0]?.values?.[0]) {
            console.log(`[SHEETS DEBUG] Headers for ${campusName}:`, valueRanges[0].values[0]);
        }

        const teachers = teachersRaw;
        const users = usersRaw;
        const classrooms = classroomsRaw;

        // Helper to find a value by multiple possible keys
        const getVal = (obj: any, keys: string[]) => {
            for (const k of keys) {
                if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
            }
            return undefined;
        };

        // Mappings for enrichment with flexible keys
        const teachersMap = Object.fromEntries(teachers.map(t => [
            getVal(t, ["id_maestro", "id_maestra", "ID"]),
            getVal(t, ["nombre", "Nombre", "nombre_maestro"])
        ]).filter(([id]) => id));

        const usersMap = Object.fromEntries(users.map(u => [
            getVal(u, ["id_usuario", "id_coordinador", "id_coordinadora", "ID"]),
            getVal(u, ["nombre", "Nombre", "nombre_usuario"])
        ]).filter(([id]) => id));

        const classroomsMap = Object.fromEntries(classrooms.map(c => [
            getVal(c, ["id_aula", "ID"]),
            getVal(c, ["nombre_aula", "nombre", "Nombre"])
        ]).filter(([id]) => id));

        // Normalización de objetos para asegurar campos consistentes en la UI
        const normalizedTeachers = teachers.map(t => ({
            ...t,
            id_maestro: getVal(t, ["id_maestro", "id_maestra", "ID"]),
            id_usuario_coordinador: getVal(t, ["id_usuario_coordinador", "Coordinadora", "id_coordinador", "id_coordinadora"]),
            nombre: getVal(t, ["nombre", "Nombre", "nombre_maestro"])
        }));

        const normalizedUsers = users.map(u => ({
            ...u,
            id_usuario: getVal(u, ["id_usuario", "id_coordinador", "id_coordinadora", "ID"]),
            nombre: getVal(u, ["nombre", "Nombre", "nombre_usuario"]),
            email: getVal(u, ["email", "Email", "Correo", "correo"])
        }));

        const normalizedClassrooms = classrooms.map(c => ({
            ...c,
            id_aula: getVal(c, ["id_aula", "ID"]),
            nombre_aula: getVal(c, ["nombre_aula", "nombre", "Nombre"])
        }));

        const evaluations = evaluationsRaw
            .filter((obj: any) => getVal(obj, ["id_maestro", "Maestra", "maestra"]))
            .map((obj: any) => {
                // Find IDs using multiple common keys
                const maestroId = getVal(obj, ["id_maestro", "Maestra", "maestra"]);
                const coordinadorId = getVal(obj, ["id_usuario_coordinador", "Coordinadora", "coordinadora", "id_coordinador"]);
                const aulaId = getVal(obj, ["Aula", "id_aula", "aula"]);

                // Enrichment
                obj.nombre_maestro = (maestroId && teachersMap[maestroId]) || maestroId || "Desconocida";
                obj.nombre_coordinador = (coordinadorId && usersMap[coordinadorId]) || coordinadorId || "Desconocida";
                obj.nombre_aula = (aulaId && classroomsMap[aulaId]) || aulaId || "Desconocida";

                // Ensure these keys exist for consistent access in UI
                obj.id_maestro = maestroId;
                obj.id_usuario_coordinador = coordinadorId;

                return obj;
            });

        return {
            evaluations,
            teachers: normalizedTeachers,
            users: normalizedUsers,
            classrooms: normalizedClassrooms
        };
    } catch (error: any) {
        const status = error.code || error.response?.status || error.status || "unknown";
        const msg = error.message || error.response?.data?.error?.message || "error desconocido";
        console.error(`[getCampusData] ERROR campus "${campusName}" - HTTP ${status}: ${msg}`);
        return { evaluations: [], teachers: [], users: [], classrooms: [] };
    }
}

export async function getAllData(accessToken: string) {
    noStore();
    const allEvaluations: any[] = [];
    const allTeachers: any[] = [];
    const allUsers: any[] = [];

    console.log("[getAllData] Iniciando fetch de campus:", Object.keys(CAMPUS_DATA));

    for (const campusName of Object.keys(CAMPUS_DATA)) {
        try {
            const { evaluations, teachers, users } = await getCampusData(campusName, accessToken);
            console.log(`[getAllData] "${campusName}": ${evaluations.length} evaluaciones`);
            allEvaluations.push(...evaluations.map(item => ({ ...item, campus: campusName })));
            allTeachers.push(...teachers.map(item => ({ ...item, campus: campusName })));
            allUsers.push(...users.map(item => ({ ...item, campus: campusName })));
        } catch (err: any) {
            console.error(`[getAllData] ERROR en "${campusName}":`, err?.message || err);
        }
    }

    console.log(`[getAllData] TOTAL acumulado: ${allEvaluations.length} evaluaciones`);
    return { evaluations: allEvaluations, teachers: allTeachers, users: allUsers };
}

