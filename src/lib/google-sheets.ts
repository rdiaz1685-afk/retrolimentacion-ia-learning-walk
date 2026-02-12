
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

        // Mappings for enrichment
        const teachersMap = Object.fromEntries(teachers.map(t => [t.id_maestro, t.nombre]));
        const usersMap = Object.fromEntries(users.map(u => [u.id_usuario, u.nombre]));
        const classroomsMap = Object.fromEntries(classrooms.map(c => [c.id_aula, c.nombre_aula]));

        const evaluations = evaluationsRaw.map((obj: any) => {
            // Replace ID with Name if available
            if (obj.id_maestro && teachersMap[obj.id_maestro]) {
                obj.nombre_maestro = teachersMap[obj.id_maestro];
            } else {
                obj.nombre_maestro = obj.id_maestro;
            }

            if (obj.id_usuario_coordinador && usersMap[obj.id_usuario_coordinador]) {
                obj.nombre_coordinador = usersMap[obj.id_usuario_coordinador];
            } else {
                obj.nombre_coordinador = obj.id_usuario_coordinador;
            }

            if (obj.Aula && classroomsMap[obj.Aula]) {
                obj.nombre_aula = classroomsMap[obj.Aula];
            } else {
                obj.nombre_aula = obj.Aula;
            }

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
