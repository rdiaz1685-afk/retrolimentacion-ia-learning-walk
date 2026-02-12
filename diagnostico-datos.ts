// Script de diagnóstico para verificar los datos que se envían a la IA
import { getAllData } from './src/lib/google-sheets';

// Simular un accessToken (deberás obtenerlo de una sesión real)
const accessToken = 'TU_ACCESS_TOKEN_AQUI';

async function diagnosticar() {
    console.log('🔍 Obteniendo todos los datos...\n');

    const { evaluations: data } = await getAllData(accessToken);

    console.log(`📊 Total de observaciones: ${data.length}\n`);

    // Agrupar por campus
    const campusStats: Record<string, any> = {};
    data.forEach((item: any) => {
        const campusName = item.campus || 'Sin campus';
        if (!campusStats[campusName]) {
            campusStats[campusName] = {
                total: 0,
                wows: 0,
                wonders: 0,
                wowsEjemplos: [],
                wondersEjemplos: []
            };
        }
        campusStats[campusName].total++;

        if (item.WOWS_Texto && item.WOWS_Texto.trim()) {
            campusStats[campusName].wows++;
            if (campusStats[campusName].wowsEjemplos.length < 2) {
                campusStats[campusName].wowsEjemplos.push({
                    maestra: item.nombre_maestro || item.id_maestro,
                    texto: item.WOWS_Texto.substring(0, 50) + '...'
                });
            }
        }
        if (item.WONDERS_Texto && item.WONDERS_Texto.trim()) {
            campusStats[campusName].wonders++;
            if (campusStats[campusName].wondersEjemplos.length < 2) {
                campusStats[campusName].wondersEjemplos.push({
                    maestra: item.nombre_maestro || item.id_maestro,
                    texto: item.WONDERS_Texto.substring(0, 50) + '...'
                });
            }
        }
    });

    console.log('📋 Estadísticas por Campus:\n');
    Object.keys(campusStats).forEach(campus => {
        const stats = campusStats[campus];
        console.log(`\n🏫 ${campus}:`);
        console.log(`   Total observaciones: ${stats.total}`);
        console.log(`   Wows: ${stats.wows}`);
        console.log(`   Wonders: ${stats.wonders}`);

        if (stats.wowsEjemplos.length > 0) {
            console.log(`   Ejemplos de Wows:`);
            stats.wowsEjemplos.forEach((w: any) => {
                console.log(`     - ${w.maestra}: "${w.texto}"`);
            });
        }

        if (stats.wondersEjemplos.length > 0) {
            console.log(`   Ejemplos de Wonders:`);
            stats.wondersEjemplos.forEach((w: any) => {
                console.log(`     - ${w.maestra}: "${w.texto}"`);
            });
        }
    });

    // Verificar nombres de columnas
    console.log('\n\n📝 Nombres de columnas en los datos:');
    if (data.length > 0) {
        console.log(Object.keys(data[0]).join(', '));
    }

    // Mostrar una observación completa de ejemplo
    console.log('\n\n🔍 Ejemplo de observación completa:');
    if (data.length > 0) {
        console.log(JSON.stringify(data[0], null, 2));
    }
}

diagnosticar().catch(console.error);
