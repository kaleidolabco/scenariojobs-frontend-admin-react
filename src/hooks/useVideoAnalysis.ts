// ─── useVideoAnalysis ─────────────────────────────────────────────────────────
// Orquesta el pipeline secuencial:
//
//  Video Blob
//    └─▶ [Groq Whisper]  ──▶ Transcripción
//          └─▶ [AI Router turno 1] ──▶ Sentimiento   (Groq o Cerebras)
//                └─▶ [AI Router turno 2] ──▶ Análisis (Cerebras o Groq)
//
// Cada llamada LLM alterna proveedor via aiRouterService.ts
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { transcribeVideo } from '../services/groqService';
import { analyzeSentiment, analyzeTranscription } from '../services/analysis.service';
import type { TranscriptionResult } from '../services/groqService';
import type { SentimentResult, DeepAnalysisResult } from '../services/analysis.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnalysisStep =
    | 'idle'
    | 'transcribing'   // Groq Whisper corriendo
    | 'analyzing'      // Groq sentimiento + Cerebras análisis en paralelo
    | 'done'
    | 'error';

export interface VideoAnalysisResult {
    transcription: TranscriptionResult;
    sentiment: SentimentResult;
    analysis: DeepAnalysisResult;
    durationMs: number; // tiempo total del pipeline
}

export interface UseVideoAnalysisReturn {
    result: VideoAnalysisResult | null;
    step: AnalysisStep;
    error: string | null;
    progress: number; // 0-100 para mostrar en UI
    analyze: (videoBlob: Blob) => Promise<void>;
    reset: () => void;
}

// ─── Progress map ─────────────────────────────────────────────────────────────

const STEP_PROGRESS: Record<AnalysisStep, number> = {
    idle: 0,
    transcribing: 30,
    analyzing: 70,
    done: 100,
    error: 0,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVideoAnalysis(): UseVideoAnalysisReturn {
    const [result, setResult] = useState<VideoAnalysisResult | null>(null);
    const [step, setStep] = useState<AnalysisStep>('idle');
    const [error, setError] = useState<string | null>(null);

    const analyze = useCallback(async (videoBlob: Blob) => {
        setStep('idle');
        setError(null);
        setResult(null);

        const startTime = Date.now();

        try {
            // ── Paso 1: Transcripción con Groq Whisper ─────────────────────
            setStep('transcribing');

            const transcription = await transcribeVideo(videoBlob);

            if (!transcription.text) {
                throw new Error('La transcripción está vacía. Verifica que el video tenga audio.');
            }

            // ── Paso 2: Sentimiento (turno de router) ──────────────────────
            setStep('analyzing');
            const sentiment = await analyzeSentiment(transcription.text);

            // ── Paso 3: Análisis profundo (siguiente turno de router) ──────
            const analysis = await analyzeTranscription(transcription.text);

            // ── Paso 3: Resultado final ────────────────────────────────────
            setResult({
                transcription,
                sentiment,
                analysis,
                durationMs: Date.now() - startTime,
            });

            setStep('done');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido en el análisis.';
            setError(message);
            setStep('error');
            console.error('[useVideoAnalysis]', err);
        }
    }, []);

    const reset = useCallback(() => {
        setResult(null);
        setStep('idle');
        setError(null);
    }, []);

    return {
        result,
        step,
        error,
        progress: STEP_PROGRESS[step],
        analyze,
        reset,
    };
}