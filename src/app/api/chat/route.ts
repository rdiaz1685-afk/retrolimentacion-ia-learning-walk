
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateSystemPrompt } from "@/lib/ai-prompt";
import { getAllData, getCampusData } from "@/lib/google-sheets";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages } = await req.json();
    const user = session.user;

    // Limpieza total de la API Key
    const apiKey = process.env.GEMINI_API_KEY?.trim().replace(/[\n\r'"]/g, '');

    if (!apiKey) {
        return NextResponse.json({ role: "assistant", content: "Error: No hay GEMINI_API_KEY configurada." });
    }

    let data = [];
    let userName = user.name || "Usuario";

    try {
        console.log('[CHAT DEBUG] Usuario:', user.email, 'Rol:', user.role, 'Campus:', user.campus);

        let allEvaluations: any[] = [];
        let allUsers: any[] = [];

        if (user.role === "RECTOR") {
            const result = await getAllData(session.accessToken!);
            allEvaluations = result.evaluations;
            allUsers = result.users;
            data = allEvaluations; // Rector ve todo
            console.log('[CHAT DEBUG] Rector obteniendo todo:', data.length);
        } else {
            // Para otros roles, primero obtenemos los datos
            if (user.campus === "Extracurricular" || user.role === "DIRECTORA") {
                // Si es directora o está en extracurricular, necesitamos ver los datos de esa sede
                // O si es Directora de Extracurricular específicamente
                const result = await getCampusData("Extracurricular", session.accessToken!);
                allEvaluations = result.evaluations;
                allUsers = result.users;
            } else if (user.campus) {
                const result = await getCampusData(user.campus, session.accessToken!);
                allEvaluations = result.evaluations;
                allUsers = result.users;
            }

            // Aplicamos filtros de seguridad
            if (user.role === "DIRECTORA") {
                // La directora puede ver todo lo de su campus (en este caso Extracurricular o el asignado)
                data = allEvaluations;
                console.log('[CHAT DEBUG] Directora viendo todo su campus. Datos:', data.length);
            } else if (user.role === "COORDINADORA" && user.email) {
                const currentUser = allUsers.find((u: any) => u.email?.toLowerCase() === user.email?.toLowerCase());
                if (currentUser) {
                    const coordinatorId = String(currentUser.id_usuario);
                    const coordinatorName = currentUser.nombre;
                    userName = coordinatorName;

                    data = allEvaluations.filter((e: any) =>
                        String(e.id_usuario_coordinador) === coordinatorId ||
                        e.nombre_coordinador === coordinatorName ||
                        e.coordinadora === coordinatorName ||
                        String(e.id_coordinador) === coordinatorId
                    );
                    console.log(`[CHAT DEBUG] Filtrando para coordinadora ${coordinatorName}. Datos:`, data.length);
                }
            } else {
                data = allEvaluations;
            }
        }
    } catch (e) {
        console.error('[CHAT ERROR] Error al obtener datos de Google Sheets:', e);
    }




    console.log('[CHAT DEBUG] Total de datos para la IA:', data.length);

    // Detección automática de sesión expirada
    if (data.length === 0) {
        return NextResponse.json({
            role: "assistant",
            content: "⚠️ **No pude encontrar observaciones.**\n\nEsto suele suceder cuando la conexión de seguridad con Google ha expirado (dura 60 min).\n\n**Solución rápida:**\n1. Cierra sesión en el menú de la izquierda.\n2. Vuelve a entrar con tu cuenta de Google.\n\nAl hacerlo, mis permisos se refrescarán y podré ver tus datos de nuevo."
        });
    }


    const systemPrompt = generateSystemPrompt(
        {
            email: user.email!,
            role: (user as any).role!,
            campus: (user as any).campus || null,
            name: userName
        },
        data // Enviar TODAS las observaciones para análisis completo
    );

    const lastMessage = messages[messages.length - 1].content;
    const fullPrompt = `${systemPrompt}\n\nPregunta: ${lastMessage}`;

    const candidates = [
        { model: "gemini-flash-latest", version: "v1beta" },
        { model: "gemini-2.0-flash", version: "v1beta" },
        { model: "gemini-3.1-pro-preview", version: "v1beta" }
    ];

    for (const cand of candidates) {
        try {
            const url = `https://generativelanguage.googleapis.com/${cand.version}/models/${cand.model}:generateContent?key=${apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: fullPrompt }] }]
                })
            });

            const result = await response.json();

            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                return NextResponse.json({ role: "assistant", content: result.candidates[0].content.parts[0].text });
            }

            if (result.error) {
                console.error(`Error con modelo ${cand.model}:`, result.error.message);
                if (cand === candidates[candidates.length - 1]) {
                    const code = result.error.code;
                    const message = result.error.message;
                    return NextResponse.json({
                        role: "assistant",
                        content: `🚨 **Error de Google AI (${code}):** ${message}\n\nSugerencia: Intenta reiniciar el servidor de desarrollo (npm run dev) para que tome la nueva API Key.`
                    });
                }
                continue; // Intentar con el siguiente modelo
            }
        } catch (err: any) {
            console.error(`Error de red con ${cand.model}:`, err.message);
            if (cand === candidates[candidates.length - 1]) {
                return NextResponse.json({ role: "assistant", content: `Error de red: ${err.message}` });
            }
        }
    }

    return NextResponse.json({ role: "assistant", content: "Estado vacío o modelos agotados. Intenta reiniciar el servidor." });
}
