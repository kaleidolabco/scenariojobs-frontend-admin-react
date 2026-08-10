// ─── Groq Service ─────────────────────────────────────────────────────────────
// Responsabilidades:
//   • Transcripción de audio/video via Whisper
//   • Análisis rápido y ligero (sentimiento)
//
// Modelos disponibles:
//   • whisper-large-v3-turbo  → transcripción (gratis, muy rápido)
//   • llama-3.3-70b-versatile → LLM rápido
// ─────────────────────────────────────────────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;

// ─── Types ────────────────────────────────────────────────────────────────────

export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface TranscriptionResult {
    text: string;
    language: string;
    duration?: number;
}

export interface SentimentResult {
    label: Sentiment;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertApiKey() {
    if (!GROQ_API_KEY) {
        throw new Error('VITE_GROQ_API_KEY no está definida en las variables de entorno.');
    }
}

// ─── Transcription ────────────────────────────────────────────────────────────

/**
 * Transcribe un Blob de video/audio usando Whisper en Groq.
 * El blob puede ser webm, mp4, ogg, wav, etc.
 * Groq acepta archivos de hasta 25 MB.
 */
export async function transcribeVideo(videoBlob: Blob, language = 'es'): Promise<TranscriptionResult> {
    assertApiKey();

    // Groq Whisper espera un archivo con extensión reconocible
    const file = new File([videoBlob], 'recording.webm', { type: videoBlob.type || 'audio/webm' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('language', language);
    formData.append('response_format', 'verbose_json'); // incluye duration y language

    const response = await fetch(`${GROQ_API_URL}/audio/transcriptions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Groq Whisper error ${response.status}: ${error?.error?.message ?? response.statusText}`);
    }

    const data = await response.json();

    return {
        text: data.text?.trim() ?? '',
        language: data.language ?? language,
        duration: data.duration,
    };
}

// ─── Sentiment Analysis ───────────────────────────────────────────────────────

const SENTIMENT_SYSTEM_PROMPT = `Eres un analizador de sentimiento especializado en evaluaciones de desempeño laboral.
Tu única tarea es clasificar el sentimiento general del texto dado.

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin explicaciones adicionales):
{
  "label": "positive" | "neutral" | "negative",
  "confidence": "high" | "medium" | "low",
  "reasoning": "Una frase breve explicando el sentimiento detectado"
}`;

/**
 * Analiza el sentimiento de una transcripción de forma rápida.
 * Usa llama-3.3-70b en Groq por su baja latencia.
 */
export async function analyzeSentiment(transcription: string): Promise<SentimentResult> {
    assertApiKey();

    const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            max_tokens: 150,
            messages: [
                { role: 'system', content: SENTIMENT_SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: `Analiza el sentimiento de esta transcripción de evaluación de desempeño:\n\n"${transcription}"`,
                },
            ],
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Groq LLM error ${response.status}: ${error?.error?.message ?? response.statusText}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? '';

    try {
        return JSON.parse(raw) as SentimentResult;
    } catch {
        // Fallback si el modelo no devolvió JSON limpio
        return { label: 'neutral', confidence: 'low', reasoning: 'No se pudo procesar el sentimiento.' };
    }
}
