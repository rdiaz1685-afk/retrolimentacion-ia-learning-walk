
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
        if (user.role === "RECTOR") {
            const { evaluations } = await getAllData(session.accessToken!);
            data = evaluations;
            console.log('[CHAT DEBUG] Datos obtenidos:', data.length, 'observaciones');
        } else if (user.campus) {
            const { evaluations, users } = await getCampusData(user.campus, session.accessToken!);

            if (user.role === "COORDINADORA" && user.email) {
                const currentUser = users.find((u: any) => u.email?.toLowerCase() === user.email?.toLowerCase());
                if (currentUser) {
                    const coordinatorId = currentUser.id_usuario;
                    const coordinatorName = currentUser.nombre;
                    userName = coordinatorName;

                    data = evaluations.filter((e: any) =>
                        (coordinatorId && e.id_usuario_coordinador === coordinatorId) ||
                        (coordinatorName && e.id_usuario_coordinador === coordinatorName) ||
                        (coordinatorName && e.nombre_coordinador === coordinatorName)
                    );
                    console.log(`[CHAT DEBUG] Filtrando para coordinadora ${coordinatorName} (ID: ${coordinatorId}). Datos:`, data.length);
                } else {
                    data = evaluations;
                }
            } else {
                data = evaluations;
            }
        }
    } catch (e) {
        console.error('[CHAT ERROR] Error al obtener datos de Google Sheets:', e);
    }



    console.log('[CHAT DEBUG] Total de datos para la IA:', data.length);

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
        { model: "gemini-1.5-pro-latest", version: "v1beta" },
        { model: "gemini-1.5-flash-latest", version: "v1beta" },
        { model: "gemini-pro", version: "v1beta" }
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
