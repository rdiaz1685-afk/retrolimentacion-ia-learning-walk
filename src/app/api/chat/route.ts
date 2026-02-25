
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateSystemPrompt } from "@/lib/ai-prompt";
import { getAllData, getCampusData } from "@/lib/google-sheets";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages } = await req.json();
    const user = session.user;

    const apiKey = process.env.GEMINI_API_KEY?.trim().replace(/[\n\r'"]/g, '');

    if (!apiKey) {
        return NextResponse.json({ role: "assistant", content: "Error: No hay GEMINI_API_KEY configurada." });
    }

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
            if (user.campus === "Extracurricular" || user.role === "DIRECTORA") {
                const result = await getCampusData("Extracurricular", session.accessToken!);
                allEvaluations = result.evaluations;
                allUsers = result.users;
            } else if (user.campus) {
                const result = await getCampusData(user.campus, session.accessToken!);
                allEvaluations = result.evaluations;
                allUsers = result.users;
            }

            if (user.role === "DIRECTORA") {
                data = allEvaluations;
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
                }
            } else {
                data = allEvaluations;
            }
        }
    } catch (e) {
        console.error('[CHAT ERROR] Error al obtener datos de Google Sheets:', e);
    }

    const lastMessageRaw = messages[messages.length - 1].content;
    const lastMessage = lastMessageRaw.toLowerCase();

    // Si es un saludo simple o mensaje corto sin contexto de datos, no enviamos historial pesado
    const isSimpleGreeting = lastMessage.length < 15 && (
        lastMessage.includes("hola") ||
        lastMessage.includes("buenos días") ||
        lastMessage.includes("qué tal") ||
        lastMessage.includes("test")
    );

    let relevantData = data;

    if (isSimpleGreeting) {
        // Para saludos, enviamos solo un par de ejemplos o nada de historial pesado
        relevantData = data.slice(-2);
        console.log(`[CHAT DEBUG] Saludo detectado, omitiendo historial pesado.`);
    } else {
        // En búsqueda de maestras... con mayor flexibilidad en los nombres de las columnas
        const teacherMatches = data.filter((e: any) => {
            const maestroName = (e.nombre_maestro || e.maestra || e.Maestra || e.nombre || "").toLowerCase();
            return maestroName && lastMessage.includes(maestroName.split(' ')[0]);
        });

        if (teacherMatches.length > 0) {
            console.log(`[CHAT DEBUG] Filtrando datos relevantes para la pregunta. Encontrados: ${teacherMatches.length}`);
            relevantData = teacherMatches;
        } else if (data.length > 30) {
            // Bajamos el límite a 30 para ser más conservadores con la cuota gratuita
            relevantData = data.slice(-30);
        }
    }

    const systemPrompt = generateSystemPrompt(
        {
            email: user.email!,
            role: (user as any).role!,
            campus: (user as any).campus || null,
            name: userName
        },
        relevantData
    );

    const fullPrompt = `${systemPrompt}\n\nPregunta: ${lastMessageRaw}`;

    try {
        const maxRetries = 3;
        let attempt = 0;
        const candidates = [
            { model: "gemini-1.5-flash", version: "v1beta" }, // 1,500 msgs/día
            { model: "gemini-2.0-flash", version: "v1beta" }, // 20 msgs/día
            { model: "gemini-2.5-flash", version: "v1beta" }  // Experimental
        ];

        while (attempt < maxRetries) {
            attempt++;
            let lastErr: any = null;

            for (const cand of candidates) {
                try {
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel(
                        { model: cand.model },
                        { apiVersion: cand.version }
                    );

                    const result = await model.generateContent({
                        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
                    });

                    const response = await result.response;
                    const text = response.text();

                    if (text) {
                        console.log(`✅ [ATTEMPT ${attempt}] Éxito con: ${cand.model}`);
                        return NextResponse.json({ role: "assistant", content: text });
                    }
                } catch (err: any) {
                    lastErr = err;
                    const msg = err.message || "";

                    if (msg.includes("429") || msg.includes("503") || msg.includes("500")) {
                        console.warn(`⚠️ [ATTEMPT ${attempt}] ${cand.model} ocupado: ${msg}`);
                        continue;
                    }

                    if (msg.includes("404")) continue;

                    console.error(`❌ Error fatal en ${cand.model}:`, msg);
                    break;
                }
            }

            if (attempt < maxRetries) {
                const delay = attempt * 2000;
                console.log(`⏳ Reintentando consulta completa en ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                const errMsg = lastErr?.message || "Error desconocido";
                return NextResponse.json({
                    role: "assistant",
                    content: `⚠️ **Google está saturado.**\n\nIntenté 3 veces con varios modelos pero no responden. \n\n**Causa probable:** ${errMsg}\n**Solución:** Espera 30 segundos y dale un click más. ¡A veces Google tarda en despertar!`
                });
            }
        }
    } catch (err: any) {
        console.error(`[CHAT ERROR] SDK Error:`, err);
        return NextResponse.json({ role: "assistant", content: `🚨 **Error de sistema:** ${err.message}` });
    }
}
