---
name: gemini-free-standard
description: Configuración estándar y modelos correctos para usar la API de Gemini en cuentas gratuitas (Free Tier). Incluye diagnóstico, modelos vigentes y patrón de código probado.
---

# Skill: Gemini API — Free Tier Standard (2025-2026)

## ⚠️ Modelos Vigentes (Actualizado Febrero 2026)

> Los modelos `gemini-1.5-flash` y `gemini-1.5-pro` fueron **deprecados/eliminados** de la API v1beta.
> Usar cualquiera de ellos produce el error:
> `"models/gemini-1.5-flash is not found for API version v1beta, or is not supported for generateContent"`

### Modelos Disponibles en Free Tier (2026)

| Modelo | Velocidad | Uso Recomendado |
|--------|-----------|-----------------|
| `gemini-2.0-flash` | ⚡ Muy rápido | **Uso principal** — chat, sugerencias rápidas |
| `gemini-2.0-flash-001` | ⚡ Muy rápido | Versión fija/estable de 2.0-flash |
| `gemini-2.5-flash` | ⚡ Rápido | **Fallback principal** |
| `gemini-2.5-pro`  | 🧠 Potente | Análisis profundo (puede tener límites más bajos) |

### Regla de Prioridad

```
Primero:    gemini-2.0-flash   (v1beta)
Fallback:   gemini-2.5-flash   (v1beta)
```

**Siempre usar `v1beta`** como versión de API — es la única que soporta los modelos actuales.

---

## 🔍 Diagnóstico: Cómo Verificar Modelos Disponibles

Antes de elegir un modelo, ejecuta este script para ver qué modelos acepta tu API Key:

```bash
node -e "const k='TU_API_KEY'; fetch('https://generativelanguage.googleapis.com/v1beta/models?key='+k).then(r=>r.json()).then(d=>{if(d.error){console.log('ERROR:',d.error.message);return;} const m=d.models.filter(x=>x.supportedGenerationMethods&&x.supportedGenerationMethods.includes('generateContent')); m.forEach(x=>console.log(x.name));}).catch(e=>console.log(e.message))"
```

Sustituye `TU_API_KEY` con el valor de `GEMINI_API_KEY` en el `.env`.

---

## 🛠️ Patrón de Código Completo (Probado)

Usa esta función `callGeminiSafe` como patrón estándar en todos los routes de Next.js:

```typescript
async function callGeminiSafe(
  prompt: string,
  apiKey: string,
  modelName: string,
  attempt = 1
): Promise<string> {
  // Siempre usar v1beta — es la única versión con modelos actuales
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
      })
    });

    const data = await response.json();

    if (response.ok) {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    }

    // Error 429 = cuota llena → esperar 10s y reintentar
    if (response.status === 429 && attempt < 3) {
      console.warn(`[AI] Cuota en ${modelName}. Esperando 10s... (Intento ${attempt})`);
      await new Promise(r => setTimeout(r, 10000));
      return callGeminiSafe(prompt, apiKey, modelName, attempt + 1);
    }

    throw new Error(data.error?.message || "Error en respuesta de IA");
  } catch (e: any) {
    if (attempt < 3 && !e.message.includes("429")) {
      return callGeminiSafe(prompt, apiKey, modelName, attempt + 1);
    }
    throw e;
  }
}

// Llamada con fallback automático
async function getAIResponse(prompt: string, apiKey: string): Promise<string> {
  try {
    return await callGeminiSafe(prompt, apiKey, "gemini-2.0-flash");
  } catch (e) {
    console.warn("[AI] Falló gemini-2.0-flash, intentando con gemini-2.5-flash...");
    return await callGeminiSafe(prompt, apiKey, "gemini-2.5-flash");
  }
}
```

---

## 📋 Principios de Estabilidad

1. **Modelo Principal**: `gemini-2.0-flash` con `v1beta`
2. **Fallback**: `gemini-2.5-flash` con `v1beta`
3. **Temperatura**: `0.1` (prioriza precisión sobre creatividad)
4. **Reintentos**: Máximo 3 intentos; esperar **10 segundos** en error 429
5. **Contexto limitado**: No enviar más de 30 registros por petición
6. **Limpieza de API Key**: Siempre sanitizar con `.trim().replace(/[\n\r'"]/g, '')`

```typescript
const apiKey = process.env.GEMINI_API_KEY?.trim().replace(/[\n\r'"]/g, '');
```

---

## 🚨 Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `models/gemini-1.5-flash is not found` | Modelo deprecado | Cambiar a `gemini-2.0-flash` |
| `429 RESOURCE_EXHAUSTED` | Cuota gratuita agotada | Esperar 10s y reintentar, o esperar al día siguiente |
| `API key not valid` | Key incorrecta o mal copiada | Verificar `.env` y sanitizar con `.trim()` |
| `v1 not found` | Modelo no disponible en v1 | Cambiar a `v1beta` |

---

## 📅 Historial de Cambios

- **Feb 2026**: `gemini-1.5-flash` deprecado. Se migra a `gemini-2.0-flash` como modelo principal.
