const apiKey = 'AIzaSyDhMJ4zeOht2Ty7nVdi8jB1Pmhq1DCdTK0';

console.log('🔍 Verificando modelos disponibles para tu API Key...\n');

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    .then(r => r.json())
    .then(data => {
        if (data.error) {
            console.log('❌ Error:', data.error.message);
            return;
        }

        if (!data.models || data.models.length === 0) {
            console.log('⚠️ No se encontraron modelos disponibles');
            return;
        }

        console.log(`✅ Se encontraron ${data.models.length} modelos disponibles:\n`);

        // Filtrar solo los modelos que soportan generateContent
        const validModels = data.models.filter(m =>
            m.supportedGenerationMethods &&
            m.supportedGenerationMethods.includes('generateContent')
        );

        console.log('📋 Modelos que soportan generateContent:\n');
        validModels.forEach(model => {
            const modelName = model.name.replace('models/', '');
            console.log(`  ✓ ${modelName}`);
        });

        console.log('\n🎯 Probando el primer modelo disponible...\n');

        if (validModels.length > 0) {
            const testModel = validModels[0].name;
            return fetch(`https://generativelanguage.googleapis.com/${testModel}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Di hola' }] }]
                })
            });
        }
    })
    .then(r => r ? r.json() : null)
    .then(result => {
        if (!result) return;

        if (result.candidates && result.candidates[0]) {
            console.log('✅ ¡FUNCIONA! Respuesta del modelo:');
            console.log(`   "${result.candidates[0].content.parts[0].text}"\n`);
        } else if (result.error) {
            console.log('❌ Error al probar:', result.error.message);
        }
    })
    .catch(err => {
        console.log('❌ Error de red:', err.message);
    });
