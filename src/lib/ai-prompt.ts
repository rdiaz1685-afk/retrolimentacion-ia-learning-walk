
export function generateSystemPrompt(user: { email: string; role: string; campus: string | null; name?: string; scope?: string }, data: any[]) {
    const { role, campus, name, scope } = user;

    // Procesar TODAS las observaciones para generar estadísticas
    const totalObservaciones = data.length;

    // ... (rest of the processing logic remains the same)
    // (I'll keep the logic as is but ensure I skip the intermediate dots for brevity in the tool call if possible, 
    // but the tool requires the full target content to be replaced)

    // (Actually I'll just replace the signature and the final return string to avoid errors)

    // Agrupar por campus
    const campusStats: Record<string, any> = {};
    data.forEach(item => {
        const campusName = item.campus || 'Sin campus';
        if (!campusStats[campusName]) {
            campusStats[campusName] = {
                total: 0,
                wows: 0,
                wonders: 0,
                maestros: new Set(),
                wowsTextos: [],
                wondersTextos: []
            };
        }
        campusStats[campusName].total++;
        campusStats[campusName].maestros.add(item.nombre_maestro || item.id_maestro);

        // DEBUG: Log para ver qué está pasando con los Wows
        if (item.WOWS_Texto) {
            console.log(`[DEBUG] Campus: ${campusName}, Wow encontrado:`, item.WOWS_Texto.substring(0, 50));
            campusStats[campusName].wows++;
            campusStats[campusName].wowsTextos.push({
                maestra: item.nombre_maestro || item.id_maestro,
                texto: item.WOWS_Texto,
                fecha: item.fecha
            });
        }
        if (item.WONDERS_Texto) {
            campusStats[campusName].wonders++;
            campusStats[campusName].wondersTextos.push({
                maestra: item.nombre_maestro || item.id_maestro,
                texto: item.WONDERS_Texto,
                fecha: item.fecha
            });
        }
    });

    // DEBUG: Mostrar estadísticas finales
    console.log('[DEBUG] Estadísticas por campus:', JSON.stringify(
        Object.keys(campusStats).map(c => ({
            campus: c,
            total: campusStats[c].total,
            wows: campusStats[c].wows,
            wonders: campusStats[c].wonders
        })),
        null,
        2
    ));

    // Convertir Sets a arrays y contar
    Object.keys(campusStats).forEach(c => {
        campusStats[c].maestrosUnicos = campusStats[c].maestros.size;
        delete campusStats[c].maestros;
    });

    // Tomar las últimas 100 observaciones completas para análisis detallado
    const recentObservations = data.slice(-100).map(item => ({
        maestra: item.nombre_maestro || item.id_maestro,
        campus: item.campus,
        fecha: item.fecha,
        semana: item.semana,
        wow: item.WOWS_Texto,
        wonder: item.WONDERS_Texto
    }));

    const estadisticas = JSON.stringify({
        totalObservaciones,
        campusStats,
        observacionesRecientes: recentObservations
    });

    return `
Eres un Master Académico especializado en Learning Walk. Tu objetivo es dar retroalimentación constructiva y propuestas de mejora basadas en los "Wows" (fortalezas) y "Wonders" (áreas de oportunidad).

CONTEXTO DEL USUARIO:
- Nombre: ${name || "Usuario"}
- Rol: ${role}
- Campus: ${campus || "Todos los Campus"}

IMPORTANTE: 
${role === 'COORDINADORA'
            ? `Todos los datos proporcionados son observaciones realizadas PERSONALMENTE por ti (${name}). Si el usuario pregunta "cuántas observaciones he realizado", responde basándote en el total de este conjunto de datos.`
            : 'Tienes acceso a los datos consolidados del campus.'}

DATOS COMPLETOS DISPONIBLES:
${estadisticas}

REGLAS:
1. Analiza TODAS las observaciones disponibles, no solo las recientes.
2. Si eres Rector, compara fortalezas y áreas de oportunidad entre campus.
3. Identifica patrones recurrentes en los "Wonders" para sugerir estrategias pedagógicas concretas.
4. Menciona maestros por sus nombres reales cuando sea relevante.
5. Mantén un tono profesional y de mentoría académica.
6. Sé específico y basado en datos: menciona números y porcentajes cuando sea útil.
`;
}
