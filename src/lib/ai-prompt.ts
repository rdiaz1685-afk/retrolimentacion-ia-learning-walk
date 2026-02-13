
export function generateSystemPrompt(user: { email: string; role: string; campus: string | null; name?: string; scope?: string }, data: any[]) {
    const { role, campus, name, scope } = user;

    // Procesar TODAS las observaciones para generar estadísticas
    const totalObservaciones = data.length;

    // ... (rest of the processing logic remains the same)
    // (I'll keep the logic as is but ensure I skip the intermediate dots for brevity in the tool call if possible, 
    // but the tool requires the full target content to be replaced)

    // (Actually I'll just replace the signature and the final return string to avoid errors)

    // Función para determinar el nivel basado en el nombre del aula (segundo carácter)
    const getNivel = (nombreAula: string) => {
        if (!nombreAula || nombreAula.length < 2) return 'Desconocido';
        const car = nombreAula.charAt(1).toUpperCase();
        switch (car) {
            case 'K': return 'Preescolar';
            case 'N': return 'Prenursery';
            case 'D': return 'Toddlers';
            case 'P': return 'Primaria';
            case 'S': return 'Secundaria';
            default: return 'Otro';
        }
    };

    // Agrupar por campus y nivel
    const campusStats: Record<string, any> = {};
    const nivelStats: Record<string, any> = {};

    data.forEach(item => {
        const campusName = item.campus || 'Sin campus';
        const nivel = getNivel(item.nombre_aula);

        // Stats por Campus
        if (!campusStats[campusName]) {
            campusStats[campusName] = { total: 0, wows: 0, wonders: 0, maestros: new Set() };
        }
        campusStats[campusName].total++;
        campusStats[campusName].maestros.add(item.nombre_maestro || item.id_maestro);

        // Stats por Nivel
        if (!nivelStats[nivel]) {
            nivelStats[nivel] = { total: 0, wows: 0, wonders: 0 };
        }
        nivelStats[nivel].total++;

        if (item.WOWS_Texto) {
            campusStats[campusName].wows++;
            nivelStats[nivel].wows++;
        }
        if (item.WONDERS_Texto) {
            campusStats[campusName].wonders++;
            nivelStats[nivel].wonders++;
        }
    });

    // Convertir Sets a arrays y contar
    Object.keys(campusStats).forEach(c => {
        campusStats[c].maestrosUnicos = campusStats[c].maestros.size;
        delete campusStats[c].maestros;
    });

    // Tomar las últimas 100 observaciones completas para análisis detallado
    const recentObservations = data.slice(-100).map(item => ({
        maestra: item.nombre_maestro || item.id_maestro,
        campus: item.campus,
        nivel: getNivel(item.nombre_aula),
        aula: item.nombre_aula,
        fecha: item.fecha,
        semana: item.semana,
        wow: item.WOWS_Texto,
        wonder: item.WONDERS_Texto
    }));

    const estadisticas = JSON.stringify({
        totalObservaciones,
        campusStats,
        nivelStats,
        observacionesRecientes: recentObservations
    });

    return `
Eres un Master Académico especializado en Learning Walk. Tu objetivo es dar retroalimentación constructiva y propuestas de mejora basadas en los "Wows" (fortalezas) y "Wonders" (áreas de oportunidad).

LOGICA DE NIVELES (CRÍTICO):
Hemos definido el nivel educativo basado en el segundo carácter del nombre del aula:
- 'K' = Preescolar (Kinder)
- 'N' = Prenursery
- 'D' = Toddlers
- 'P' = Primaria
- 'S' = Secundaria

Ejemplo: El aula "1KACU" pertenece al nivel Preescolar porque su segundo carácter es 'K'.

CONTEXTO DEL USUARIO:
- Nombre: ${name || "Usuario"}
- Rol: ${role}
- Campus: ${campus || "Todos los Campus"}

DATOS COMPLETOS DISPONIBLES (Estadísticas por campus, nivel y detalle reciente):
${estadisticas}

REGLAS:
1. Analiza TODAS las observaciones disponibles. Si te piden datos de un "nivel" específico (ej. Preescolar), usa la lógica del segundo carácter del aula para filtrar y responder.
2. Si eres Rector, compara fortalezas y áreas de oportunidad entre campus y niveles.
3. Identifica patrones recurrentes en los "Wonders" para sugerir estrategias pedagógicas concretas según el nivel (no es lo mismo una estrategia para Toddlers que para Secundaria).
4. Menciona maestros por sus nombres reales cuando sea relevante.
5. Mantén un tono profesional y de mentoría académica.
 `;
}
