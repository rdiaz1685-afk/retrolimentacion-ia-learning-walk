
import { google } from "googleapis";
import { CAMPUS_DATA, SHEET_NAME } from "@/config/campus-config";

export async function getCampusData(campusName: string, accessToken: string) {
    const campus = CAMPUS_DATA[campusName as keyof typeof CAMPUS_DATA];
    if (!campus) return [];

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: "v4", auth });

    try {
        // 1. Fetch Evaluations
        const evalResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: campus.sheet_id,
            range: `${SHEET_NAME}!A:ZZ`, // Expanded range to include more columns
        });

        // 2. Fetch Teachers Mapping
        const teachersMap: Record<string, string> = {};
        try {
            const teachersResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: campus.sheet_id,
                range: `maestros!A:E`,
            });
            const tRows = teachersResponse.data.values;
            if (tRows && tRows.length > 0) {
                const tHeaders = tRows[0];
                const idIndex = tHeaders.indexOf("id_maestro");
                const nameIndex = tHeaders.indexOf("nombre");

                if (idIndex !== -1 && nameIndex !== -1) {
                    tRows.slice(1).forEach(row => {
                        teachersMap[row[idIndex]] = row[nameIndex];
                    });
                }
            }
        } catch (e) {
            console.warn(`Pestaña 'maestros' no encontrada en campus ${campusName}`);
        }

        // 3. Fetch Users (Coordinators) Mapping
        const usersMap: Record<string, string> = {};
        try {
            const usersResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: campus.sheet_id,
                range: `usuarios!A:F`,
            });
            const uRows = usersResponse.data.values;
            if (uRows && uRows.length > 0) {
                const uHeaders = uRows[0];
                const idIndex = uHeaders.indexOf("id_usuario");
                const nameIndex = uHeaders.indexOf("nombre");

                if (idIndex !== -1 && nameIndex !== -1) {
                    uRows.slice(1).forEach(row => {
                        usersMap[row[idIndex]] = row[nameIndex];
                    });
                }
            }
        } catch (e) {
            console.warn(`Pestaña 'usuarios' no encontrada en campus ${campusName}`);
        }

        // 4. Fetch Classrooms (Aulas) Mapping
        const classroomsMap: Record<string, string> = {};
        try {
            const classroomsResponse = await sheets.spreadsheets.values.get({
                spreadsheetId: campus.sheet_id,
                range: `aulas!A:D`,
            });
            const cRows = classroomsResponse.data.values;
            if (cRows && cRows.length > 0) {
                const cHeaders = cRows[0];
                const idIndex = cHeaders.indexOf("id_aula");
                const nameIndex = cHeaders.indexOf("nombre_aula");

                if (idIndex !== -1 && nameIndex !== -1) {
                    cRows.slice(1).forEach(row => {
                        classroomsMap[row[idIndex]] = row[nameIndex];
                    });
                }
            }
        } catch (e) {
            console.warn(`Pestaña 'aulas' no encontrada en campus ${campusName}`);
        }

        const rows = evalResponse.data.values;
        if (!rows || rows.length === 0) return [];

        const headers = rows[0];
        const data = rows.slice(1).map((row) => {
            const obj: any = {};
            headers.forEach((header, index) => {
                obj[header.trim()] = row[index];
            });

            // Replace ID with Name if available
            if (obj.id_maestro && teachersMap[obj.id_maestro]) {
                obj.nombre_maestro = teachersMap[obj.id_maestro];
            } else {
                obj.nombre_maestro = obj.id_maestro; // Fallback to ID
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

        return data;
    } catch (error: any) {
        if (error.code === 401 || (error.response && error.response.status === 401)) {
            console.warn(`[AUTH ERROR] Access token expired or invalid for ${campusName}. Redirecting to login...`);
            // In a server component, we can't easily force a redirect here, but we can return empty 
            // and let the UI handle the "no data" state, or the page itself can check session validity.
            return [];
        }
        console.error(`Error fetching data for campus ${campusName}:`, error);
        return [];
    }
}

export async function getAllData(accessToken: string) {
    const allData: any[] = [];
    for (const campusName of Object.keys(CAMPUS_DATA)) {
        const data = await getCampusData(campusName, accessToken);
        allData.push(...data.map(item => ({ ...item, campus: campusName })));
    }
    return allData;
}
