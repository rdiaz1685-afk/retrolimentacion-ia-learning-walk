
import { google } from "googleapis";
import { CAMPUS_DATA, SHEET_NAME } from "@/config/campus-config";

export async function getCampusData(campusName: string, accessToken: string) {
    const campus = CAMPUS_DATA[campusName as keyof typeof CAMPUS_DATA];
    if (!campus) return { evaluations: [], teachers: [], users: [] };

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: "v4", auth });

    const rowToObj = (rows: any[][] | null | undefined) => {
        if (!rows || rows.length === 0) return [];
        const headers = rows[0].map(h => h.trim());
        return rows.slice(1).map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
                obj[header] = row[index];
            });
            return obj;
        });
    };

    try {
        // 1. Fetch Evaluations
        const evalResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: campus.sheet_id,
            range: `${SHEET_NAME}!A:ZZ`,
        });
        const evaluationsRaw = rowToObj(evalResponse.data.values);

        // 2. Fetch Teachers
        let teachers: any[] = [];
        try {
            const teachersResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: campus.sheet_id,
                range: `maestros!A:ZZ`,
            });
            teachers = rowToObj(teachersResponse.data.values);
        } catch (e) {
            console.warn(`Pestaña 'maestros' no encontrada en campus ${campusName}`);
        }

        // 3. Fetch Users
        let users: any[] = [];
        try {
            const usersResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: campus.sheet_id,
                range: `usuarios!A:ZZ`,
            });
            users = rowToObj(usersResponse.data.values);
        } catch (e) {
            console.warn(`Pestaña 'usuarios' no encontrada en campus ${campusName}`);
        }

        // 4. Fetch Classrooms
        let classrooms: any[] = [];
        try {
            const classroomsResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: campus.sheet_id,
                range: `aulas!A:ZZ`,
            });
            classrooms = rowToObj(classroomsResponse.data.values);
        } catch (e) {
            console.warn(`Pestaña 'aulas' no encontrada en campus ${campusName}`);
        }

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

        const evaluations = evaluationsRaw.map((obj: any) => {
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

        return { evaluations, teachers, users, classrooms };
    } catch (error: any) {
        if (error.code === 401 || (error.response && error.response.status === 401)) {
            console.warn(`[AUTH ERROR] Access token expired or invalid for ${campusName}.`);
            return { evaluations: [], teachers: [], users: [] };
        }
        console.error(`Error fetching data for campus ${campusName}:`, error);
        return { evaluations: [], teachers: [], users: [] };
    }
}

export async function getAllData(accessToken: string) {
    const allEvaluations: any[] = [];
    const allTeachers: any[] = [];
    const allUsers: any[] = [];

    for (const campusName of Object.keys(CAMPUS_DATA)) {
        const { evaluations, teachers, users } = await getCampusData(campusName, accessToken);
        allEvaluations.push(...evaluations.map(item => ({ ...item, campus: campusName })));
        allTeachers.push(...teachers.map(item => ({ ...item, campus: campusName })));
        allUsers.push(...users.map(item => ({ ...item, campus: campusName })));
    }
    return { evaluations: allEvaluations, teachers: allTeachers, users: allUsers };
}
