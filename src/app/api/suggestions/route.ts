
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { observation } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY?.trim().replace(/[\n\r'"]/g, '');

    if (!apiKey) {
        return NextResponse.json({ error: "No API Key configured" }, { status: 500 });
    }

    const prompt = `
        Eres un experto pedagógico realizando Learning Walks.
        Analiza esta observación específica y sugiere 3 acciones breves y concretas para el docente.
        
        Contexto:
        - Maestra: ${observation.maestra}
        - Objetivo: ${observation.objetivo}
        - Wow (Fortaleza): ${observation.wows}
        - Wonder (Área de oportunidad): ${observation.wonders}

        Responde ÚNICAMENTE con una lista numerada de 3 acciones muy breves (máximo 15 palabras cada una).
        No saludes ni des explicaciones extra.
    `;

    // List of models to try, prioritizing newer/faster ones that are available
    const models = ["gemini-1.5-pro", "gemini-2.0-flash", "gemini-1.5-flash"];
    let lastError = null;

    for (const model of models) {
        try {
            console.log(`[SUGGESTIONS DEBUG] Trying model: ${model} for ${observation.maestra}`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const result = await response.json();

            if (result.error) {
                console.error(`[SUGGESTIONS ERROR] Model ${model} failed:`, result.error.message);
                lastError = result.error;

                // If quota exceeded (429), try next model immediately
                if (result.error.code === 429 || result.error.message.includes('quota')) {
                    continue;
                }
                // For other errors, maybe break or continue depending on specific error codes, 
                // but let's try next model just in case it helps.
                continue;
            }

            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                console.warn(`[SUGGESTIONS WARN] Model ${model} returned no text.`);
                continue;
            }

            // Success!
            return NextResponse.json({ suggestions: text });

        } catch (error) {
            console.error(`[SUGGESTIONS EXCEPTION] Error with model ${model}:`, error);
            lastError = error;
            continue;
        }
    }

    // If all models failed
    const errorMessage = lastError?.message || "Unknown error";
    if (errorMessage.includes('quota') || errorMessage.includes('429')) {
        return NextResponse.json({ suggestions: "⚠️ La cuota de IA está llena por el momento. Por favor espera un minuto e intenta de nuevo." });
    }

    return NextResponse.json({ suggestions: `No se pudieron generar sugerencias. Error: ${errorMessage}` });
}
