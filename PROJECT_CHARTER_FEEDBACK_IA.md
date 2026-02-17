# Project Charter: Sistema Integral de Retroalimentación Pedagógica (Feedback IA)
## Colegio Cambridge de Monterrey

**Versión:** 1.0
**Fecha:** 16 de febrero de 2026
**Líder de Proyecto:** [Tu Nombre]
**Patrocinador:** Ing. Antonio Turati
**Fecha Objetivo de Implementación:** Julio 2026 (Ciclo Escolar 2026-2027)

---

## 1. Propósito y Justificación del Proyecto
El actual proceso de "Learning Walks" operado en AppSheet presenta limitaciones críticas en escalabilidad, costos operativos y capacidades de análisis avanzado. Este proyecto busca migrar hacia una plataforma personalizada (Next.js/IA) que garantice:
*   **Estabilidad:** Soporte para 50+ usuarios concurrentes sin errores de cuota.
*   **Eficiencia:** Automatización de reportes diarios y retroalimentación pedagógica mediante IA.
*   **Seguridad:** Migración hacia bases de datos relacionales estructuradas bajo estándares institucionales.

## 2. Objetivos del Proyecto
1.  **Migración Tecnológica:** Desplegar una aplicación web robusta que reemplace la funcionalidad de AppSheet.
2.  **Optimización Pedagógica:** Integrar modelos de lenguaje (Gemini/OpenAI) para generar sugerencias de mejora inmediata a docentes.
3.  **Visualización de Datos:** Implementar un Dashboard para Rectoría y Direcciones con análisis longitudinal de desempeño.
4.  **Consolidación:** Centralizar la información de los 5 campus en una única fuente de verdad segura.

## 3. Alcance del Proyecto (Scope)

### Incluido:
*   Módulo de captura de "Learning Walks" optimizado para móviles.
*   Sistema de reportes diarios (Daily Reports) automatizados.
*   Motor de Feedback IA con análisis de "Wows" y "Wonders".
*   Infraestructura de base de datos relacional institucional.
*   Dashboard de analítica para coordinadores, directores y rectoría.

### No Incluido:
*   Gestión de nómina o recursos humanos.
*   Integración con sistemas externos de control de asistencia (en Fase 1).

## 4. Entregables Clave y Milestones
| Milestone | Descripción | Fecha Estimada |
|-----------|-------------|----------------|
| **Finalización de Prototipo** | Validación de lógica de negocio y UI en React/Next.js. | Febrero 2026 (Completado) |
| **Consultoría Técnica** | Sesión de validación con Ing. Edgar Espinoza (Infraestructura). | Marzo 2026 |
| **Migración de Datos** | Traspaso de históricos de Google Sheets a DB Relacional. | Abril 2026 |
| **QA y Pruebas Beta** | Pilotaje con coordinadores seleccionados (Campus Mitras). | Mayo 2026 |
| **Despliegue General** | Implementación en los 5 campus del Colegio Cambridge. | Julio 2026 |

## 5. Stakeholders (Interesados)
*   **Ing. Antonio Turati:** Dirección del Proyecto / Validación de Requerimientos.
*   **Ing. Edgar Espinoza:** Asesor de Infraestructura y Seguridad (Grupo Reforma).
*   **Rectoría:** Consumo de reportes de alto nivel.
*   **Directores y Coordinadores:** Usuarios principales de la herramienta.

## 6. Riesgos y Supuestos
*   **Riesgo:** Resistencia al cambio por parte de usuarios acostumbrados a AppSheet.
*   **Mitigación:** Capacitación intensiva y mejora significativa en la experiencia de usuario (UI/UX).
*   **Riesgo:** Limitaciones de presupuesto para infraestructura en la nube.
*   **Mitigación:** Presentación de comparativa de costos AppSheet ($10/user) vs. GCP (Pago por uso).

## 7. Criterios de Éxito
*   Reducción del 80% en el tiempo de generación de reportes semanales.
*   Adopción del sistema por el 100% de los coordinadores en el ciclo escolar 2026-2027.
*   Eliminación total de los errores de "cuota de IA" mediante implementación de API Institucional.

---
**Firmas de Aprobación:**

__________________________
**Ing. Antonio Turati**
Director de Proyecto

__________________________
**[Tu Nombre]**
Líder Técnico de Desarrollo
