---
name: google-sheets-repository
description: Uso de Google Sheets como base de datos técnica (solo lectura/escritura básica) para aplicaciones Next.js, incluyendo mapeo de campos y normalización de datos.
---

# Google Sheets as Repository Skill

Esta habilidad permite utilizar Google Sheets como un repositorio de datos estructurado (simulando una base de datos relacional) para aplicaciones web.

## 1. Requisitos Previos

Instalar la librería oficial de Google:
```bash
npm install googleapis
```

## 2. Configuración Necesaria

Este skill asume que ya tienes configurada la autenticación con Google (ver skill `google-auth-nextjs`) y que cuentas con un `accessToken` con el scope:
`https://www.googleapis.com/auth/spreadsheets.readonly` o `https://www.googleapis.com/auth/spreadsheets`.

## 3. Lógica de Repositorio (`src/lib/google-sheets.ts`)

La clave de este skill es la función de mapeo `rowToObj`, que convierte las filas de una hoja (arrays) en objetos JSON legibles basados en los encabezados.

### Fragmento de Código Core:
```typescript
const rowToObj = (rows: any[][] | null | undefined) => {
    if (!rows || rows.length === 0) return [];
    const headers = rows[0].map(h => h.trim());
    return rows.slice(1).map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
            obj[header] = row[index];
        });
        return obj;
    });
};
```

## 4. Normalización de Datos

Como Google Sheets no obliga a tener nombres de columnas estrictos, este skill recomienda una técnica de "Keys Flexibles":

```typescript
const getVal = (obj: any, keys: string[]) => {
    for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
    }
    return undefined;
};

// Ejemplo de uso para normalizar campos que podrían variar entre hojas
const id = getVal(row, ["id_maestro", "ID", "Maestra"]);
```

## 5. Implementación en el Proyecto

1.  **Modelado:** Definir los `spreadsheetId` de las hojas en un archivo de configuración.
2.  **Fetch:** Usar `sheets.spreadsheets.values.get` para traer los datos.
3.  **Relaciones:** Si tienes varias pestañas (ej: Maestros y Evaluaciones), realizar la unión (join) en la lógica de servidor antes de enviar los datos a la UI.

## 6. Limitaciones (Importante)
- **Cuotas:** Google Cloud tiene límites de lectura/escritura por minuto.
- **Latencia:** Es más lento que una base de datos real (Supabase/PostgreSQL).
- **Tipado:** Los datos siempre vienen como strings, es necesario convertir a `number` o `Date` manualmente.
