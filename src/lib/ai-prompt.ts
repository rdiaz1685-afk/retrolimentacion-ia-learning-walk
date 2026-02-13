
export function generateSystemPrompt(user: { email: string; role: string; campus: string | null; name?: string; scope?: string }, data: any[]) {
    const { role, campus, name, scope } = user;

    // Procesar TODAS las observaciones para generar estadísticas
    const totalObservaciones = data.length;

    // ... (rest of the processing logic remains the same)
    // (I'll keep the logic as is but ensure I skip the intermediate dots for brevity in the tool call if possible, 
    // but the tool requires the full target content to be replaced)

    // (Actually I'll just replace the signature and the final return string to avoid errors)

    // Función para determinar el nivel basado en el nombre del aula
    const getNivel = (nombreAula: string) => {
        if (!nombreAula || nombreAula === 'Desconocida') return 'Desconocido';

        // Buscamos el código de nivel (K, N, D, P, S) usualmente en la segunda posición (ej: 1KACU)
        // Pero somos flexibles por si hay espacios o variaciones
        const cleanName = nombreAula.trim().toUpperCase();

        // Si el segundo carácter es una de nuestras claves:
        const car2 = cleanName.charAt(1);
        if (car2 === 'K') return 'Preescolar';
        if (car2 === 'N') return 'Prenursery';
        if (car2 === 'D') return 'Toddlers';
        if (car2 === 'P') return 'Primaria';
        if (car2 === 'S') return 'Secundaria';

        // Si no, buscamos si alguna de las letras aparece en los primeros 3 caracteres
        const prefix = cleanName.substring(0, 3);
        if (prefix.includes('K')) return 'Preescolar';
        if (prefix.includes('N')) return 'Prenursery';
        if (prefix.includes('D')) return 'Toddlers';
        if (prefix.includes('P')) return 'Primaria';
        if (prefix.includes('S')) return 'Secundaria';

        return 'Otro';
    };

    // Agrupar por campus y nivel
    const campusStats: Record<string, any> = {};
    const nivelStats: Record<string, any> = {};

    data.forEach(item => {
        const campusName = item.campus || 'Sin campus';
        const nivel = getNivel(item.nombre_aula || item.Aula);

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

    // Tomar las últimas 200 observaciones completas para análisis detallado (más datos para comparar)
    const recentObservations = data.slice(-200).map(item => ({
        maestra: item.nombre_maestro || item.id_maestro,
        campus: item.campus,
        nivel: getNivel(item.nombre_aula || item.Aula),
        aula: item.nombre_aula || item.Aula,
        fecha: item.fecha,
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

DETERMINACIÓN DE NIVELES:
El nivel educativo se detecta por el segundo carácter (o prefijo) del nombre del aula:
- 'K' = Preescolar (ej: 1KACU)
- 'N' = Prenursery
- 'D' = Toddlers
- 'P' = Primaria
- 'S' = Secundaria

CONTEXTO DEL USUARIO:
- Nombre: ${name || "Usuario"}
- Rol: ${role}
- Campus: ${campus || "Todos los Campus"}

DATOS DISPONIBLES (Últimas 200 observaciones y estadísticas generales):
${estadisticas}

REGLAS DE FORMATO (OBLIGATORIAS Y CRÍTICAS):
1. PROHIBIDO TOTALMENTE EL USO DE DOBLE ASTERISCO (**) PARA NEGRITAS. 
2. PROHIBIDO EL USO DE ASTERISCOS (*) PARA LISTAS O ÉNFASIS.
3. SI NECESITAS RESALTAR UN TÍTULO, ÚSALO EN MAYÚSCULAS Y CON UN GUIÓN ABAJO (Ejemplo: TITULO -).
4. PARA LISTAS, USA NÚMEROS (1, 2, 3) O GUIONES CORTOS (-).
5. EL TEXTO DEBE SER PLANO Y LIMPIO. NO USES NINGÚN TIPO DE MARCADO MARKDOWN (BOLD, ITALIC).

REGLAS DE CONTENIDO:
1. Analiza con prioridad el NIVEL educativo solicitado usando la lógica del aula.
2. Si eres Rector, compara fortalezas y áreas de oportunidad entre campus y niveles.
3. Identifica patrones recurrentes en los "Wonders".
4. Menciona maestros por sus nombres reales cuando sea relevante.
5. Mantén un tono profesional y de mentoría académica.
 `;
}
