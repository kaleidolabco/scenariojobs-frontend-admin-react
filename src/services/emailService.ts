import useFetch from '../hooks/useFetch';
import { FetchResponse, successMock } from './responseType';
import useUIStore from '../store/uiStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmailTemplateType =
    | 'EVALUACION_ASIGNADA'
    | 'EVALUADOR_ASIGNADO'
    | 'RECORDATORIO_EVALUACION'
    | 'RESULTADO_EVALUACION'
    | 'BIENVENIDA'
    | 'PERSONALIZADO';

export interface EmailTemplate {
    id: string;
    nombre: string;
    tipo: EmailTemplateType;
    asunto: string;
    cuerpo: string;
    activo: boolean;
    descripcion?: string;
    creado_en?: string;
    actualizado_en?: string;
}

export interface emailTemplateQueryParams {
    pagina?: number;
    items_por_pagina?: number;
    orden?: string;
    orden_por?: string;
    tipo?: EmailTemplateType;
    filtro?: string;
    activo?: boolean;
}

export interface SmtpConfig {
    host: string;
    puerto: number;
    usuario: string;
    password?: string;
    remitente_nombre: string;
    remitente_email: string;
    usar_tls: boolean;
}

// ─── Metadata de tipos ────────────────────────────────────────────────────────

export const EMAIL_TEMPLATE_TYPE_META: Record<EmailTemplateType, { label: string; color: string }> = {
    EVALUACION_ASIGNADA:     { label: 'Evaluación Asignada',   color: 'primary'  },
    EVALUADOR_ASIGNADO:      { label: 'Evaluador Asignado',    color: 'secondary'},
    RECORDATORIO_EVALUACION: { label: 'Recordatorio',          color: 'warning'  },
    RESULTADO_EVALUACION:    { label: 'Resultado',             color: 'success'  },
    BIENVENIDA:              { label: 'Bienvenida',            color: 'info'     },
    PERSONALIZADO:           { label: 'Personalizado',         color: 'neutral'  },
};

/** Variables de ejemplo para la previsualización de plantillas */
export const TEMPLATE_PREVIEW_VARS: Record<string, string> = {
    nombre_colaborador: 'Ana García',
    nombre_evaluacion:  'Evaluación de Desempeño Q1 2025',
    fecha_limite:       '30 de mayo de 2025',
    link_evaluacion:    'https://app.scenariojobs.com/mis-evaluaciones/123',
    nombre_empresa:     'Kaleido Labs',
    nombre_evaluador:   'Carlos Rodríguez',
    cargo_colaborador:  'Desarrollador Senior',
    periodo:            'Primer trimestre 2025',
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TEMPLATES: EmailTemplate[] = [
    {
        id: '1',
        nombre: 'Notificación de Evaluación Asignada',
        tipo: 'EVALUACION_ASIGNADA',
        asunto: 'Tienes una nueva evaluación: {{nombre_evaluacion}}',
        cuerpo: `Hola {{nombre_colaborador}},

Te informamos que se te ha asignado una nueva evaluación en la plataforma {{nombre_empresa}}.

📋 Evaluación: {{nombre_evaluacion}}
📅 Fecha límite: {{fecha_limite}}
🏢 Empresa: {{nombre_empresa}}

Por favor accede a la siguiente liga para completar tu evaluación:
{{link_evaluacion}}

Si tienes alguna pregunta, no dudes en contactar a tu equipo de RRHH.

Saludos,
El equipo de {{nombre_empresa}}`,
        activo: true,
        descripcion: 'Se envía al colaborador cuando se le asigna una evaluación.',
        creado_en: '2025-01-10T08:00:00Z',
        actualizado_en: '2025-03-15T10:30:00Z',
    },
    {
        id: '2',
        nombre: 'Notificación a Evaluador Asignado',
        tipo: 'EVALUADOR_ASIGNADO',
        asunto: 'Has sido asignado como evaluador — {{nombre_evaluacion}}',
        cuerpo: `Estimado/a {{nombre_evaluador}},

Has sido designado como evaluador para la siguiente evaluación en {{nombre_empresa}}:

📋 Evaluación: {{nombre_evaluacion}}
👤 Colaborador a evaluar: {{nombre_colaborador}}
📅 Fecha límite: {{fecha_limite}}

Accede a la plataforma para revisar y calificar:
{{link_evaluacion}}

Gracias por tu colaboración.

Atentamente,
Equipo de {{nombre_empresa}}`,
        activo: true,
        descripcion: 'Se envía al evaluador cuando es asignado a una evaluación.',
        creado_en: '2025-01-10T08:00:00Z',
        actualizado_en: '2025-02-20T09:00:00Z',
    },
    {
        id: '3',
        nombre: 'Recordatorio de Evaluación Pendiente',
        tipo: 'RECORDATORIO_EVALUACION',
        asunto: '⏰ Recordatorio: {{nombre_evaluacion}} vence el {{fecha_limite}}',
        cuerpo: `Hola {{nombre_colaborador}},

Te recordamos que tienes una evaluación pendiente por completar:

📋 Evaluación: {{nombre_evaluacion}}
⏳ Fecha límite: {{fecha_limite}}

Por favor complétala a la brevedad posible:
{{link_evaluacion}}

Recuerda que completar tus evaluaciones a tiempo es fundamental para tu desarrollo profesional.

Saludos,
{{nombre_empresa}}`,
        activo: true,
        descripcion: 'Recordatorio automático enviado días antes del vencimiento.',
        creado_en: '2025-01-12T09:00:00Z',
        actualizado_en: '2025-01-12T09:00:00Z',
    },
    {
        id: '4',
        nombre: 'Entrega de Resultados de Evaluación',
        tipo: 'RESULTADO_EVALUACION',
        asunto: '✅ Resultados disponibles: {{nombre_evaluacion}}',
        cuerpo: `Hola {{nombre_colaborador}},

Tus resultados de evaluación ya están disponibles en la plataforma.

📋 Evaluación: {{nombre_evaluacion}}
📅 Período: {{periodo}}
🏢 Empresa: {{nombre_empresa}}

Accede a tus resultados aquí:
{{link_evaluacion}}

Recuerda que estos resultados son parte de tu plan de desarrollo profesional. Si tienes dudas, consulta con tu equipo de RRHH.

Felicitaciones por completar tu evaluación.

Atentamente,
Equipo de {{nombre_empresa}}`,
        activo: true,
        descripcion: 'Se envía cuando los resultados de la evaluación están disponibles.',
        creado_en: '2025-01-15T10:00:00Z',
        actualizado_en: '2025-04-01T11:00:00Z',
    },
    {
        id: '5',
        nombre: 'Bienvenida al Sistema',
        tipo: 'BIENVENIDA',
        asunto: '👋 Bienvenido/a a {{nombre_empresa}}',
        cuerpo: `¡Bienvenido/a {{nombre_colaborador}}!

Nos complace darte la bienvenida a la plataforma de gestión de talento de {{nombre_empresa}}.

A través de esta plataforma podrás:
✅ Completar tus evaluaciones de desempeño
✅ Revisar tus objetivos
✅ Ver tus resultados y retroalimentación

Para comenzar, accede aquí:
{{link_evaluacion}}

Si tienes alguna pregunta, escríbenos a soporte@{{nombre_empresa}}.com

¡Éxito en tu desarrollo profesional!

El equipo de Talento Humano
{{nombre_empresa}}`,
        activo: false,
        descripcion: 'Correo de bienvenida al ingresar por primera vez a la plataforma.',
        creado_en: '2025-01-05T07:00:00Z',
        actualizado_en: '2025-01-05T07:00:00Z',
    },
];

const MOCK_SMTP_CONFIG: SmtpConfig = {
    host: 'smtp.gmail.com',
    puerto: 587,
    usuario: 'notificaciones@empresa.com',
    remitente_nombre: 'ScenarioJobs',
    remitente_email: 'no-reply@empresa.com',
    usar_tls: true,
};

// ─── Service Hook ─────────────────────────────────────────────────────────────

export const useEmailService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();

    // ── Templates CRUD ──────────────────────────────────────────────────────────

    const getTemplates = async (params?: emailTemplateQueryParams): Promise<FetchResponse | null> => {
        try {
            let filtered = [...MOCK_TEMPLATES];

            if (params?.filtro) {
                const q = params.filtro.toLowerCase();
                filtered = filtered.filter(t =>
                    t.nombre.toLowerCase().includes(q) ||
                    t.asunto.toLowerCase().includes(q) ||
                    (t.descripcion?.toLowerCase().includes(q) ?? false)
                );
            }

            if (params?.tipo) {
                filtered = filtered.filter(t => t.tipo === params.tipo);
            }

            if (params?.activo !== undefined) {
                filtered = filtered.filter(t => t.activo === params.activo);
            }

            if (params?.orden_por) {
                filtered.sort((a, b) => {
                    const aVal = (a as any)[params.orden_por!] ?? '';
                    const bVal = (b as any)[params.orden_por!] ?? '';
                    const cmp = aVal > bVal ? 1 : -1;
                    return params.orden === 'desc' ? -cmp : cmp;
                });
            }

            const page     = params?.pagina ?? 1;
            const pageSize = params?.items_por_pagina ?? 9;
            const total    = filtered.length;
            const pages    = Math.max(1, Math.ceil(total / pageSize));
            const start    = (page - 1) * pageSize;
            const paginated = filtered.slice(start, start + pageSize);

            const response = (await fetchData({
                url: '/api/email-templates',
                params: params as any,
                mockData: successMock({
                    plantillas: paginated,
                    paginacion: {
                        pagina_actual:    page,
                        items_por_pagina: pageSize,
                        total_items:      total,
                        total_paginas:    pages,
                    },
                }),
            })) as FetchResponse | null;

            if (response?.success === false) throw new Error(response.message || 'Error al obtener las plantillas');
            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const getTemplateById = async (id: string): Promise<FetchResponse | null> => {
        try {
            const template = MOCK_TEMPLATES.find(t => t.id === id) ?? null;
            if (!template) throw new Error('Plantilla no encontrada');

            return (await fetchData({
                url: `/api/email-templates/${id}`,
                mockData: successMock({ plantilla: template }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const createTemplate = async (template: Omit<EmailTemplate, 'id' | 'creado_en' | 'actualizado_en'>): Promise<FetchResponse | null> => {
        try {
            const now = new Date().toISOString();
            const newTemplate: EmailTemplate = {
                ...template,
                id: Math.random().toString(36).substr(2, 9),
                creado_en: now,
                actualizado_en: now,
            };
            MOCK_TEMPLATES.push(newTemplate);

            return (await fetchData({
                url: '/api/email-templates',
                method: 'POST',
                body: template,
                mockData: successMock({ plantilla: newTemplate }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const updateTemplate = async (id: string, template: Partial<EmailTemplate>): Promise<FetchResponse | null> => {
        try {
            const idx = MOCK_TEMPLATES.findIndex(t => t.id === id);
            if (idx !== -1) {
                MOCK_TEMPLATES[idx] = { ...MOCK_TEMPLATES[idx], ...template, actualizado_en: new Date().toISOString() };
            }

            return (await fetchData({
                url: `/api/email-templates/${id}`,
                method: 'PUT',
                body: template,
                mockData: successMock({ plantilla: idx !== -1 ? MOCK_TEMPLATES[idx] : { ...template, id } }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const deleteTemplate = async (id: string): Promise<boolean> => {
        try {
            const idx = MOCK_TEMPLATES.findIndex(t => t.id === id);
            if (idx !== -1) MOCK_TEMPLATES.splice(idx, 1);

            await fetchData({
                url: `/api/email-templates/${id}`,
                method: 'DELETE',
                mockData: successMock({ success: true }),
            });
            return true;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return false;
        }
    };

    // ── SMTP Config ─────────────────────────────────────────────────────────────

    const getSmtpConfig = async (): Promise<FetchResponse | null> => {
        try {
            return (await fetchData({
                url: '/api/smtp-config',
                mockData: successMock({ smtp: MOCK_SMTP_CONFIG }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const updateSmtpConfig = async (config: Partial<SmtpConfig>): Promise<FetchResponse | null> => {
        try {
            return (await fetchData({
                url: '/api/smtp-config',
                method: 'PUT',
                body: config,
                mockData: successMock({ smtp: { ...MOCK_SMTP_CONFIG, ...config } }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    return {
        getTemplates,
        getTemplateById,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        getSmtpConfig,
        updateSmtpConfig,
        loading,
        error,
    };
};
