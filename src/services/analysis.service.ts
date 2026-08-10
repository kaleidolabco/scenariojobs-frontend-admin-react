// ─── Analysis Service ─────────────────────────────────────────────────────────
// Centraliza todos los prompts y llamadas LLM de análisis.
// Delega la selección de proveedor al AI Router (Groq ↔ Cerebras alternando).
// Cada función hace exactamente 1 llamada → 1 turno de alternancia.
// ─────────────────────────────────────────────────────────────────────────────

import { routerCall } from './aiRouterService';
import type { RouterCallResult } from './aiRouterService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface SentimentResult {
    label:      Sentiment;
    confidence: 'high' | 'medium' | 'low';
    reasoning:  string;
    provider:   string;   // quién respondió (para debug / UI)
}

export interface CompetencyDetected {
    name:     string;
    level:    'alta' | 'media' | 'baja';
    evidence: string;
}

export interface DeepAnalysisResult {
    summary:          string;
    keyPoints:        string[];
    competencies:     CompetencyDetected[];
    suggestedActions: string[];
    alertSignals:     string[];
    provider:         string;
}

// ─── Sentiment ────────────────────────────────────────────────────────────────

const SENTIMENT_SYSTEM = `Eres un analizador de sentimiento especializado en evaluaciones de desempeño laboral.
Responde ÚNICAMENTE con un JSON válido sin markdown:
{
  "label": "positive" | "neutral" | "negative",
  "confidence": "high" | "medium" | "low",
  "reasoning": "Una frase breve explicando el sentimiento detectado"
}`;

export async function analyzeSentiment(transcription: string): Promise<SentimentResult> {
    const result: RouterCallResult = await routerCall(
        [
            { role: 'system', content: SENTIMENT_SYSTEM },
            {
                role:    'user',
                content: `Analiza el sentimiento de esta transcripción de evaluación:\n\n"${transcription}"`,
            },
        ],
        { temperature: 0.1, max_tokens: 200 },
    );

    try {
        const parsed = JSON.parse(result.text);
        return { ...parsed, provider: result.provider };
    } catch {
        return {
            label:      'neutral',
            confidence: 'low',
            reasoning:  'No se pudo procesar el sentimiento.',
            provider:   result.provider,
        };
    }
}

// ─── Deep Analysis ────────────────────────────────────────────────────────────

const DEEP_ANALYSIS_SYSTEM = `Eres un experto en evaluaciones de desempeño y gestión de talento humano.
Analiza transcripciones de videos de autoevaluación o retroalimentación de empleados.

Responde ÚNICAMENTE con un JSON válido sin markdown:
{
  "summary": "Resumen ejecutivo (2-3 oraciones)",
  "keyPoints": ["punto 1", "punto 2"],
  "competencies": [
    {
      "name": "Nombre de la competencia",
      "level": "alta" | "media" | "baja",
      "evidence": "Cita textual corta que evidencia esta competencia"
    }
  ],
  "suggestedActions": ["Acción 1", "Acción 2"],
  "alertSignals": []
}

Competencias a evaluar (solo incluye las que tengan evidencia):
Liderazgo, Trabajo en equipo, Comunicación, Orientación a resultados,
Adaptabilidad, Gestión del tiempo, Resolución de problemas, Iniciativa,
Aprendizaje continuo, Orientación al cliente.

Si no hay alertas reales, devuelve alertSignals como [].`;

export async function analyzeTranscription(transcription: string): Promise<DeepAnalysisResult> {
    const result: RouterCallResult = await routerCall(
        [
            { role: 'system', content: DEEP_ANALYSIS_SYSTEM },
            {
                role:    'user',
                content: `Transcripción del video:\n\n"${transcription}"\n\nGenera el análisis completo en JSON.`,
            },
        ],
        { temperature: 0.2, max_tokens: 1200 },
    );

    try {
        const parsed = JSON.parse(result.text);
        return { ...parsed, provider: result.provider };
    } catch {
        throw new Error(`No se pudo parsear la respuesta del análisis: ${result.text.slice(0, 150)}`);
    }
}
