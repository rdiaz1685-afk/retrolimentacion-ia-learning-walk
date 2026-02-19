
const fs = require('fs');
const path = require('path');

async function testConnection() {
    // Manual text parsing of .env to avoid dependencies
    let apiKey = '';
    try {
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/GEMINI_API_KEY=(.*)/);
            if (match && match[1]) {
                apiKey = match[1].trim().replace(/["']/g, ''); // Remove quotes if any
            }
        }
    } catch (e) {
        console.error("Error reading .env file:", e);
    }

    if (!apiKey) {
        console.error("❌ No se encontró GEMINI_API_KEY en el archivo .env o no se pudo leer.");
        return;
    }

    console.log(`🔑 Probando clave: ${apiKey.substring(0, 5)}... (longitud: ${apiKey.length})`);

    try {
        // Intentaremos listar los modelos para ver cuáles están disponibles
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("❌ Error de la API:", JSON.stringify(data.error, null, 2));
            return;
        }

        if (!data.models) {
            console.error("⚠️ La API respondió pero no devolvió modelos:", data);
            return;
        }

        const output = [];
        output.push("✅ ¡Conexión exitosa! Estos son los modelos disponibles para tu plan:");
        output.push("----------------------------------------------------------------");

        const favorites = ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"];

        // Sort to show favorites first
        data.models.sort((a, b) => {
            const nameA = a.name.replace("models/", "");
            const nameB = b.name.replace("models/", "");
            const isFavA = favorites.some(f => nameA.includes(f));
            const isFavB = favorites.some(f => nameB.includes(f));
            if (isFavA && !isFavB) return -1;
            if (!isFavA && isFavB) return 1;
            return nameA.localeCompare(nameB);
        });

        data.models.forEach(m => {
            if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                const name = m.name.replace("models/", "");
                const isFavorite = favorites.some(f => name.includes(f));
                output.push(`${isFavorite ? "⭐" : "  "} ${name} (${m.version})`);
            }
        });

        fs.writeFileSync('gemini-models.txt', output.join('\n'));
        fs.writeFileSync('gemini-response.json', JSON.stringify(data, null, 2)); // Save full response for debug
        console.log("Output saved to gemini-models.txt and gemini-response.json");

    } catch (error) {
        console.error("❌ Error de conexión:", error.message);
    }
}

testConnection();
