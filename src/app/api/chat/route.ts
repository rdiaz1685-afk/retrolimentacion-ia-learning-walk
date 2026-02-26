import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateSystemPrompt } from "@/lib/ai-prompt";
import { getAllData, getCampusData } from "@/lib/google-sheets";

async function callGeminiSafe(prompt: string, apiKey: string, modelName: string, version: string, attempt = 1): Promise<string> {
    const URL = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
            })
        });

        const data = await response.json();

        if (response.ok) {
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text;
        }

        if (response.status === 429 && attempt < 3) {
            console.warn(`[CHAT] Límite en ${modelName}. Esperando 10s... (Intento ${attempt})`);
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

    const { messages } = await req.json();
    const user = session.user;
    const apiKey = process.env.GEMINI_API_KEY?.trim().replace(/[\n\r'"]/g, '');

    if (!apiKey) return NextResponse.json({ role: "assistant", content: "Error: No hay API_KEY configurada." });

    let data = [];
    let userName = user.name || "Usuario";

    try {
        let allEvaluations: any[] = [];
        let allUsers: any[] = [];

        if (user.role === "RECTOR") {
            const result = await getAllData(session.accessToken!);
            allEvaluations = result.evaluations;
            allUsers = result.users;
            data = allEvaluations;
        } else {
            const campusToFetch = (user.campus === "Extracurricular" || user.role === "DIRECTORA") ? "Extracurricular" : (user.campus || "");
            if (campusToFetch) {
                const result = await getCampusData(campusToFetch, session.accessToken!);
                allEvaluations = result.evaluations;
                allUsers = result.users;
            }

            if (user.role === "DIRECTORA") {
                data = allEvaluations;
            } else if (user.role === "COORDINADORA" && user.email) {
                const currentUser = allUsers.find((u: any) => u.email?.toLowerCase() === user.email?.toLowerCase());
                if (currentUser) {
                    const coordId = String(currentUser.id_usuario);
                    userName = currentUser.nombre;
                    data = allEvaluations.filter((e: any) =>
                        String(e.id_usuario_coordinador) === coordId || e.coordinadora === userName
                    );
                }
            } else {
                data = allEvaluations;
            }
        }
    } catch (e) {
        console.error('[CHAT ERROR] Sheets error:', e);
    }

    const lastMessageRaw = messages[messages.length - 1].content;
    const isSimpleGreeting = lastMessageRaw.length < 15 && /hola|buenos|tal|test/i.test(lastMessageRaw);
    const msgLower = lastMessageRaw.toLowerCase();

    let relevantData: any[] = [];

    if (isSimpleGreeting) {
        relevantData = data.slice(-2);
    } else if ((user as any).role === "RECTOR") {
        // Para el RECTOR: agrupar por campus con totales reales antes de cortar
        const byCampus: Record<string, any[]> = {};
        data.forEach((e: any) => {
            const c = e.campus || "Sin campus";
            if (!byCampus[c]) byCampus[c] = [];
            byCampus[c].push(e);
        });

        // Totales reales por campus (ANTES del corte) — para contexto del prompt
        const realTotals: Record<string, number> = {};
        Object.keys(byCampus).forEach(c => { realTotals[c] = byCampus[c].length; });

        // Detectar campus mencionados en la pregunta
        const campusKeywords: Record<string, string[]> = {
            "Cumbres": ["cumbres"],
            "Mitras": ["mitras"],
            "Dominio": ["dominio"],
            "Norte": ["norte"],
            "Anahuac": ["anahuac", "anáhuac"],
            "Extracurricular": ["extracurricular"]
        };

        const mentionedCampus = Object.keys(campusKeywords).filter(campusName =>
            campusKeywords[campusName].some(kw => msgLower.includes(kw))
        );

        if (mentionedCampus.length > 0) {
            // Campus específicos: enviar hasta 200 observaciones por campus (límite ai-prompt)
            mentionedCampus.forEach(campusName => {
                const campusData = byCampus[campusName] || [];
                relevantData.push(...campusData.slice(-200));
            });
        } else {
            // Pregunta general: hasta 50 registros de CADA campus
            Object.keys(byCampus).forEach(campusName => {
                relevantData.push(...byCampus[campusName].slice(-50));
            });
        }

        // Inyectar totales reales como primer elemento con metadata
        // para que la IA sepa cuántas observaciones existen en total por campus
        (relevantData as any)._campusTotals = realTotals;
    } else {
        relevantData = data.slice(-30);
    }

    // Filtro adicional por nombre de maestra si se menciona explícitamente
    const specificTeacher = data.filter((e: any) => {
        const name = (e.nombre_maestro || e.maestra || "").toLowerCase();
        return name && name.length > 3 && msgLower.includes(name.split(' ')[0]);
    });
    if (specificTeacher.length > 0) relevantData = specificTeacher;

    // Contexto adicional de totales reales para el prompt del RECTOR
    const campusTotals: Record<string, number> = (relevantData as any)._campusTotals || {};
    const campusTotalsContext = Object.keys(campusTotals).length > 0
        ? `\n\nNOTA IMPORTANTE DE CONTEXTO:\nLos totales reales de observaciones históricas por campus son: ${JSON.stringify(campusTotals)}.\nEn el análisis siguiente se incluyen las últimas ${relevantData.length} observaciones (muestra representativa). Al mencionar totales, usa los totales reales, NO el número de observaciones de la muestra.\n`
        : "";

    const systemPrompt = generateSystemPrompt({
        email: user.email!,
        role: (user as any).role!,
        campus: (user as any).campus || null,
        name: userName
    }, relevantData);

    // LOG DE DIAGNÓSTICO: muestra cuántos registros por campus van a la IA
    const campusCount: Record<string, number> = {};
    relevantData.forEach((e: any) => {
        const c = e.campus || "sin-campus";
        campusCount[c] = (campusCount[c] || 0) + 1;
    });
    console.log(`[CHAT] Rol: ${(user as any).role} | "${lastMessageRaw.substring(0, 60)}" | Registros a IA:`, campusCount);

    const fullPrompt = `${systemPrompt}${campusTotalsContext}\n\nPregunta: ${lastMessageRaw}`;

    try {
        let text = "";
        try {
            // Intentar primero con la versión v1 (estable)
            text = await callGeminiSafe(fullPrompt, apiKey, "gemini-2.0-flash", "v1beta");
        } catch (e) {
            console.warn("[CHAT] Falló gemini-2.0-flash, intentando con gemini-2.5-flash...");
            text = await callGeminiSafe(fullPrompt, apiKey, "gemini-2.5-flash", "v1beta");
        }

        return NextResponse.json({ role: "assistant", content: text });
    } catch (err: any) {
        return NextResponse.json({
            role: "assistant",
            content: `⚠️ **Saturación en Google.**\n\nDetalle: ${err.message}\n\n*Consejo: Espera 10 segundos y reintenta. Es el límite de la versión gratuita.*`
        });
    }
}
