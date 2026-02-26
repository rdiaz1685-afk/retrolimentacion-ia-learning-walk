// Test directo de Service Account sin dotenv
const { google } = require('googleapis');
const fs = require('fs');

// Leer .env y parsear manualmente
const raw = fs.readFileSync('.env', 'utf8');

function parseEnvVar(content, varName) {
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = content.match(regex);
    if (!match) return null;
    return match[1].trim().replace(/^["']|["']$/g, '');
}

const serviceEmail = parseEnvVar(raw, 'GOOGLE_SERVICE_ACCOUNT_EMAIL');

// La key está en una sola línea con \n literales
const keyMatch = raw.match(/GOOGLE_SERVICE_ACCOUNT_KEY="([^"]+)"/s);
const rawKey = keyMatch ? keyMatch[1] : null;
const serviceKey = rawKey ? rawKey.replace(/\\n/g, '\n') : null;

console.log('Service Email:', serviceEmail || 'NO ENCONTRADO');
console.log('Tiene KEY:', !!serviceKey);
if (serviceKey) {
    console.log('KEY inicio:', serviceKey.substring(0, 40));
    console.log('KEY fin:   ', serviceKey.substring(serviceKey.length - 30));
}
console.log('---');

if (!serviceEmail || !serviceKey) {
    console.error('FALTA credencial - abortando');
    process.exit(1);
}

const SHEETS = {
    'Mitras': '1G2snA46xg8FuCw4iwUAFh7NizoT8_Nt4qv2wfwgWxw0',
    'Dominio': '1-xOeUbTjVmeEusF9IaoETcUH2Irjd1i1hbr62al3-S8',
    'Cumbres': '1WbFN132KVka3ppoXYW0x_H-vSpvCu1rclta_yhHP4aA',
};

async function run() {
    const auth = new google.auth.JWT({
        email: serviceEmail,
        key: serviceKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    for (const [name, id] of Object.entries(SHEETS)) {
        try {
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId: id,
                range: 'evaluaciones!A1:B3',
            });
            const rows = res.data.values || [];
            console.log(`OK  ${name}: ${rows.length} filas leidas`);
        } catch (err) {
            const code = err.code || err.response?.status;
            const msg = (err.message || '').substring(0, 150);
            console.log(`ERR ${name} [${code}]: ${msg}`);
        }
    }
}

run().catch(e => console.error('Error fatal:', e.message));
