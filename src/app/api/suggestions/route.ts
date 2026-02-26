import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

async function callGeminiSafe(prompt: string, apiKey: string, modelName: string, version: string, attempt = 1): Promise<string> {
    const URL = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
            })
        });

        const data = await response.json();

        if (response.ok) {
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text;
        }

        // Si es error de cuota (429), reintentar con espera estilo Profesoria
        if (response.status === 429 && attempt < 3) {
            console.warn(`[SUGGESTIONS] Límite en ${modelName}. Esperando 10s... (Intento ${attempt})`);
            await new Promise(r => setTimeout(r, 10000));
            return callGeminiSafe(prompt, apiKey, modelName, version, attempt + 1);
        }

        throw new Error(data.error?.message || "Error en respuesta de IA");
    } catch (e: any) {
        if (attempt < 3 && !e.message.includes("429")) {
            return callGeminiSafe(prompt, apiKey, modelName, version, attempt + 1);
        }
        throw e;
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { observation, history = [] } = body;
    const apiKey = process.env.GEMINI_API_KEY?.trim().replace(/[\n\r'"]/g, '');

    if (!apiKey) return NextResponse.json({ error: "No API Key configured" }, { status: 500 });

    const recentHistory = [...history].reverse();
    const historyText = recentHistory.length > 0
        ? recentHistory.slice(0, 3).map((h: any) => `F:${h.fecha} W:${h.wows} ON:${h.wonders}`).join(' | ')
        : "Sin historial.";

    const prompt = `Actúa como experto pedagógico. Analiza trazabilidad.
Docente: ${observation.maestra}
Obs Actual: ${observation.wows} / ${observation.wonders}
Historial: ${historyText}

Genera 3 acciones estratégicas breves (máx 15 palabras cada una).
Responde solo con la lista numerada. Sin introducciones.`;

    try {
        let text = "";
        try {
            // Intentar con v1 (versión estable) antes que v1beta en local
            text = await callGeminiSafe(prompt, apiKey, "gemini-2.0-flash", "v1beta");
        } catch (e) {
            console.warn("[SUGGESTIONS] Falló gemini-2.0-flash, intentando con gemini-2.5-flash...");
            text = await callGeminiSafe(prompt, apiKey, "gemini-2.5-flash", "v1beta");
        }

        return NextResponse.json({ suggestions: text });
    } catch (error: any) {
        const isQuota = error.message.includes("429") || error.message.toLowerCase().includes("quota");
        return NextResponse.json({
            suggestions: isQuota
                ? "⚠️ **Google está saturado (Cuota llena).**\n\nPor favor, espera **10 segundos** e intenta de nuevo."
                : `No se pudieron generar sugerencias. (Detalle: ${error.message.substring(0, 50)})`
        });
    }
}
