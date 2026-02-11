
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
    try {
        console.log('[CHAT DEBUG] Usuario:', user.email, 'Rol:', user.role, 'Campus:', user.campus);
        if (user.role === "RECTOR") {
            console.log('[CHAT DEBUG] Obteniendo datos de TODOS los campus...');
            data = await getAllData(session.accessToken!);
            console.log('[CHAT DEBUG] Datos obtenidos:', data.length, 'observaciones');
        } else if (user.campus) {
            console.log('[CHAT DEBUG] Obteniendo datos del campus:', user.campus);
            data = await getCampusData(user.campus, session.accessToken!);
            console.log('[CHAT DEBUG] Datos obtenidos:', data.length, 'observaciones');
        }
    } catch (e) {
        console.error('[CHAT ERROR] Error al obtener datos de Google Sheets:', e);
    }



    console.log('[CHAT DEBUG] Total de datos para la IA:', data.length);

    const systemPrompt = generateSystemPrompt(
        { email: user.email!, role: (user as any).role!, campus: (user as any).campus || null },
        data // Enviar TODAS las observaciones para análisis completo
    );

    const lastMessage = messages[messages.length - 1].content;
    const fullPrompt = `${systemPrompt}\n\nPregunta: ${lastMessage}`;

    const candidates = [
        { model: "gemini-2.5-flash", version: "v1beta" },
        { model: "gemini-flash-latest", version: "v1beta" },
        { model: "gemini-pro-latest", version: "v1beta" }
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
