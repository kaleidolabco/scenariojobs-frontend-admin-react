// ─── AI Router ────────────────────────────────────────────────────────────────
// Alterna las llamadas LLM entre Groq y Cerebras en cada petición.
// Si el proveedor activo falla, reintenta automáticamente con el otro.
//
// Transcripción (Whisper) → siempre Groq (Cerebras no tiene STT)
// LLM calls               → Groq ↔ Cerebras alternando por turno
//
//  Llamada 1 → Groq
//  Llamada 2 → Cerebras
//  Llamada 3 → Groq
//  ...
//
// El turno se persiste en localStorage para que sobreviva recargas
// y la alternancia no se rompa entre sesiones.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Config ───────────────────────────────────────────────────────────────────

const GROQ_API_URL      = 'https://api.groq.com/openai/v1';
const CEREBRAS_API_URL  = 'https://api.cerebras.ai/v1';
const GROQ_KEY          = import.meta.env.VITE_GROQ_API_KEY      as string;
const CEREBRAS_KEY      = import.meta.env.VITE_CEREBRAS_API_KEY  as string;

const STORAGE_KEY = 'ai_router_last_provider';

export type Provider = 'groq' | 'cerebras';

const PROVIDER_CONFIG: Record<Provider, { url: string; key: string; model: string; label: string }> = {
    groq: {
        url:   GROQ_API_URL,
        key:   GROQ_KEY,
        model: 'llama-3.3-70b-versatile',
        label: 'Groq',
    },
    cerebras: {
        url:   CEREBRAS_API_URL,
        key:   CEREBRAS_KEY,
        model: 'llama-3.3-70b',
        label: 'Cerebras',
    },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMOptions {
    temperature?: number;
    max_tokens?: number;
}

export interface RouterCallResult {
    text: string;
    provider: Provider;   // quién respondió realmente
    usedFallback: boolean;
}

// ─── Rotation logic ───────────────────────────────────────────────────────────

function getLastProvider(): Provider | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored === 'groq' || stored === 'cerebras' ? stored : null;
    } catch {
        return null;
    }
}

function saveLastProvider(provider: Provider) {
    try {
        localStorage.setItem(STORAGE_KEY, provider);
    } catch {
        // localStorage bloqueado (modo privado, etc.) — no es crítico
    }
}

/** Devuelve el proveedor que le toca en este turno y actualiza el estado. */
function pickNextProvider(): Provider {
    const last = getLastProvider();
    // Si no hay historial o el último fue Cerebras → toca Groq, y viceversa
    const next: Provider = last === 'groq' ? 'cerebras' : 'groq';
    saveLastProvider(next);
    return next;
}

function opposite(provider: Provider): Provider {
    return provider === 'groq' ? 'cerebras' : 'groq';
}

// ─── Raw LLM call (un solo proveedor) ────────────────────────────────────────

async function callProvider(
    provider: Provider,
    messages: LLMMessage[],
    options: LLMOptions = {},
): Promise<string> {
    const cfg = PROVIDER_CONFIG[provider];

    if (!cfg.key) {
        throw new Error(`API key de ${cfg.label} no configurada (VITE_${provider.toUpperCase()}_API_KEY).`);
    }

    const response = await fetch(`${cfg.url}/chat/completions`, {
        method: 'POST',
        headers: {
            Authorization:  `Bearer ${cfg.key}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model:       cfg.model,
            temperature: options.temperature ?? 0.2,
            max_tokens:  options.max_tokens  ?? 1200,
            messages,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
            `${cfg.label} error ${response.status}: ${err?.error?.message ?? response.statusText}`,
        );
    }

    const data = await response.json();
    const raw  = data.choices?.[0]?.message?.content ?? '';

    // Cerebras y algunos modelos de Groq envuelven JSON en ```json ... ```
    return raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Realiza una llamada LLM alternando el proveedor en cada invocación.
 * Si el proveedor activo falla, automáticamente reintenta con el otro
 * (fallback) y registra que ese fue el último en responder.
 *
 * @example
 * const { text, provider } = await routerCall(messages, { max_tokens: 800 });
 */
export async function routerCall(
    messages: LLMMessage[],
    options: LLMOptions = {},
): Promise<RouterCallResult> {
    const primary   = pickNextProvider();
    const secondary = opposite(primary);

    try {
        const text = await callProvider(primary, messages, options);
        return { text, provider: primary, usedFallback: false };
    } catch (primaryError) {
        console.warn(
            `[AI Router] ${PROVIDER_CONFIG[primary].label} falló, intentando con ${PROVIDER_CONFIG[secondary].label}…`,
            primaryError,
        );

        try {
            const text = await callProvider(secondary, messages, options);
            // Actualizar el turno para que la próxima llamada retome desde aquí
            saveLastProvider(secondary);
            return { text, provider: secondary, usedFallback: true };
        } catch (secondaryError) {
            throw new Error(
                `Ambos proveedores fallaron.\n` +
                `• ${PROVIDER_CONFIG[primary].label}: ${(primaryError as Error).message}\n` +
                `• ${PROVIDER_CONFIG[secondary].label}: ${(secondaryError as Error).message}`,
            );
        }
    }
}

/**
 * Devuelve el proveedor que se usará en la PRÓXIMA llamada, sin modificar el estado.
 * Útil para mostrarlo en la UI antes de ejecutar.
 */
export function peekNextProvider(): Provider {
    const last = getLastProvider();
    return last === 'groq' ? 'cerebras' : 'groq';
}

/**
 * Devuelve el historial de turno actual (para debug / panel de admin).
 */
export function getRouterStatus(): { nextProvider: Provider; lastProvider: Provider | null } {
    return {
        lastProvider: getLastProvider(),
        nextProvider: peekNextProvider(),
    };
}
