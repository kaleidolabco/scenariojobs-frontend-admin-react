import useFetch from '../hooks/useFetch';
import { FetchResponse, successMock } from './responseType';
import useUIStore from '../store/uiStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssessmentStatus = 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO';
export type AssessmentType = 'DESEMPENO' | 'SELECCION' | 'CLIMA' | 'CONOCIMIENTO';

export interface AssessmentQueryParams {
    pagina?: number;
    items_por_pagina?: number;
    orden?: string;
    orden_por?: string;
    search?: string;
    tipo?: AssessmentType;
    estado?: AssessmentStatus;
}

export interface AssessmentSummary {
    id: string;
    nombre: string;
    descripcion?: string;
    tipo: AssessmentType;
    estado: AssessmentStatus;
    total_preguntas: number;
    total_secciones: number;
    version: number;
    creado_por: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
    veces_aplicada: number;
    duracion_estimada_min?: number;
}

// ─── Draft types (full structure for the builder) ────────────────────────────

export type QuestionType =
    | 'MULTIPLE_CHOICE_SINGLE'
    | 'MULTIPLE_CHOICE_MULTI'
    | 'OPEN_TEXT'
    | 'VIDEO_RESPONSE'
    | 'FILE_UPLOAD';

export interface AnswerOption {
    id: string;
    texto: string;
    es_correcta: boolean;
}

export interface Question {
    id: string;
    tipo: QuestionType;
    enunciado: string;
    descripcion?: string;
    competencia_id?: string;
    competencia_nombre?: string;
    peso: number;
    umbral?: number;
    es_requerida: boolean;
    ayuda_ia?: {
        keywords: string[];
        criterios: string;
        respuesta_modelo?: string;
    };
    opciones?: AnswerOption[];
    media_url?: string;
    contexto_adicional?: string;
    calificacion_automatica?: boolean;
}

export interface Section {
    id: string;
    nombre: string;
    descripcion?: string;
    orden: number;
    preguntas: Question[];
}

export interface AssessmentDraft {
    id?: string;
    nombre: string;
    descripcion?: string;
    tipo: AssessmentType;
    estado: AssessmentStatus;
    instrucciones?: string;
    duracion_estimada_min?: number;
    secciones: Section[];
    version: number;
    creado_por?: string;
    fecha_creacion?: string;
    fecha_actualizacion?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

// Array mutable: actúa como "base de datos" en memoria mientras no haya API real
let _db: AssessmentSummary[] = [
    {
        id: 'asmnt-001',
        nombre: 'Evaluación de Desempeño Semestral 2025',
        descripcion: 'Evaluación integral de competencias blandas y técnicas para todos los colaboradores.',
        tipo: 'DESEMPENO',
        estado: 'PUBLICADO',
        total_preguntas: 24,
        total_secciones: 3,
        version: 2,
        creado_por: 'Ana García',
        fecha_creacion: '2025-01-10T09:00:00Z',
        fecha_actualizacion: '2025-03-15T14:30:00Z',
        veces_aplicada: 142,
        duracion_estimada_min: 45,
    },
    {
        id: 'asmnt-002',
        nombre: 'Prueba Técnica – Dev Junior',
        descripcion: 'Evaluación de conocimientos en JavaScript, SQL y resolución de problemas algorítmicos.',
        tipo: 'SELECCION',
        estado: 'PUBLICADO',
        total_preguntas: 15,
        total_secciones: 2,
        version: 1,
        creado_por: 'Carlos Medina',
        fecha_creacion: '2025-02-05T11:00:00Z',
        fecha_actualizacion: '2025-02-05T11:00:00Z',
        veces_aplicada: 38,
        duracion_estimada_min: 60,
    },
    {
        id: 'asmnt-003',
        nombre: 'Encuesta de Clima Laboral Q1',
        descripcion: 'Medición del bienestar y satisfacción del equipo.',
        tipo: 'CLIMA',
        estado: 'BORRADOR',
        total_preguntas: 20,
        total_secciones: 4,
        version: 1,
        creado_por: 'Laura Torres',
        fecha_creacion: '2025-04-01T08:00:00Z',
        fecha_actualizacion: '2025-04-12T10:15:00Z',
        veces_aplicada: 0,
        duracion_estimada_min: 20,
    },
    {
        id: 'asmnt-004',
        nombre: 'Certificación ISO 9001 – Auditoría Interna',
        descripcion: 'Evaluación de conocimiento de normativa ISO para el equipo de calidad.',
        tipo: 'CONOCIMIENTO',
        estado: 'ARCHIVADO',
        total_preguntas: 30,
        total_secciones: 3,
        version: 3,
        creado_por: 'Pedro Ruiz',
        fecha_creacion: '2024-06-20T09:00:00Z',
        fecha_actualizacion: '2024-12-01T16:00:00Z',
        veces_aplicada: 55,
        duracion_estimada_min: 90,
    },
    {
        id: 'asmnt-005',
        nombre: 'Evaluación 360° – Líderes de Área',
        descripcion: 'Evaluación de competencias de liderazgo con feedback de pares, colaboradores y superiores.',
        tipo: 'DESEMPENO',
        estado: 'BORRADOR',
        total_preguntas: 32,
        total_secciones: 4,
        version: 1,
        creado_por: 'Ana García',
        fecha_creacion: '2025-05-01T08:00:00Z',
        fecha_actualizacion: '2025-05-10T11:00:00Z',
        veces_aplicada: 0,
        duracion_estimada_min: 50,
    },
    {
        id: 'asmnt-006',
        nombre: 'Prueba de Selección – Analista de Datos',
        descripcion: 'Evaluación técnica de SQL, Python y visualización de datos.',
        tipo: 'SELECCION',
        estado: 'PUBLICADO',
        total_preguntas: 18,
        total_secciones: 3,
        version: 2,
        creado_por: 'Carlos Medina',
        fecha_creacion: '2025-03-01T10:00:00Z',
        fecha_actualizacion: '2025-04-20T14:00:00Z',
        veces_aplicada: 22,
        duracion_estimada_min: 75,
    },
];

// Almacén de drafts completos (secciones + preguntas) indexado por id.
// Persiste durante la sesión; se sincroniza con _db en cada saveDraft.
let _draftsDb: Record<string, AssessmentDraft> = {};

// ─── Service hook ─────────────────────────────────────────────────────────────

export const useAssessmentService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();

    // ── GET list ──────────────────────────────────────────────────────────────

    const getAssessments = async (params?: AssessmentQueryParams): Promise<FetchResponse | null> => {
        try {
            let filtered = [..._db];

            // Filters
            if (params?.search) {
                const q = params.search.toLowerCase();
                filtered = filtered.filter(
                    (a) =>
                        a.nombre.toLowerCase().includes(q) ||
                        a.descripcion?.toLowerCase().includes(q)
                );
            }
            if (params?.tipo) filtered = filtered.filter((a) => a.tipo === params.tipo);
            if (params?.estado) filtered = filtered.filter((a) => a.estado === params.estado);

            // Sorting
            if (params?.orden_por) {
                filtered.sort((a, b) => {
                    const aVal = (a as any)[params.orden_por!] ?? '';
                    const bVal = (b as any)[params.orden_por!] ?? '';
                    const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                    return params.orden === 'desc' ? -cmp : cmp;
                });
            }

            // Pagination
            const page = params?.pagina ?? 1;
            const pageSize = params?.items_por_pagina ?? 10;
            const totalItems = filtered.length;
            const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
            const start = (page - 1) * pageSize;
            const paginated = filtered.slice(start, start + pageSize);

            const response = (await fetchData({
                url: '/api/assessments',
                params: params as any,
                mockData: successMock({
                    evaluaciones: paginated,
                    paginacion: {
                        pagina_actual: page,
                        items_por_pagina: pageSize,
                        total_items: totalItems,
                        total_paginas: totalPages,
                    },
                }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener las evaluaciones');
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── GET stats ─────────────────────────────────────────────────────────────

    const getAssessmentStats = async (): Promise<FetchResponse | null> => {
        try {
            const stats = {
                total: _db.length,
                publicadas: _db.filter((a) => a.estado === 'PUBLICADO').length,
                borradores: _db.filter((a) => a.estado === 'BORRADOR').length,
                total_aplicaciones: _db.reduce((s, a) => s + a.veces_aplicada, 0),
            };

            const response = (await fetchData({
                url: '/api/assessments/stats',
                mockData: successMock({ stats }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener las estadísticas');
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── CREATE ────────────────────────────────────────────────────────────────

    const createAssessment = async (
        data: Omit<AssessmentSummary, 'id' | 'fecha_creacion' | 'fecha_actualizacion' | 'veces_aplicada' | 'version'>
    ): Promise<FetchResponse | null> => {
        try {
            const newAssessment: AssessmentSummary = {
                ...data,
                id: `asmnt-${Math.random().toString(36).slice(2, 9)}`,
                version: 1,
                veces_aplicada: 0,
                fecha_creacion: new Date().toISOString(),
                fecha_actualizacion: new Date().toISOString(),
            };

            _db = [..._db, newAssessment];

            const response = (await fetchData({
                url: '/api/assessments',
                method: 'POST',
                body: data,
                mockData: successMock({ evaluacion: newAssessment }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al crear la evaluación');
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── UPDATE ────────────────────────────────────────────────────────────────

    const updateAssessment = async (
        id: string,
        data: Partial<AssessmentSummary>
    ): Promise<FetchResponse | null> => {
        try {
            _db = _db.map((a) =>
                a.id === id ? { ...a, ...data, fecha_actualizacion: new Date().toISOString() } : a
            );

            const response = (await fetchData({
                url: `/api/assessments/${id}`,
                method: 'PUT',
                body: data,
                mockData: successMock({
                    evaluacion: { ...data, id, fecha_actualizacion: new Date().toISOString() },
                }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al actualizar la evaluación');
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── DELETE ────────────────────────────────────────────────────────────────

    const deleteAssessment = async (id: string): Promise<boolean> => {
        try {
            _db = _db.filter((a) => a.id !== id);

            await fetchData({
                url: `/api/assessments/${id}`,
                method: 'DELETE',
                mockData: successMock({ success: true }),
            });
            return true;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return false;
        }
    };

    // ── CLONE ─────────────────────────────────────────────────────────────────

    const cloneAssessment = async (id: string): Promise<FetchResponse | null> => {
        try {
            const original = _db.find((a) => a.id === id);
            if (!original) throw new Error('Evaluación no encontrada');

            const cloned: AssessmentSummary = {
                ...original,
                id: `asmnt-${Math.random().toString(36).slice(2, 9)}`,
                nombre: `Copia de ${original.nombre}`,
                estado: 'BORRADOR',
                version: 1,
                veces_aplicada: 0,
                fecha_creacion: new Date().toISOString(),
                fecha_actualizacion: new Date().toISOString(),
            };

            _db = [..._db, cloned];

            const response = (await fetchData({
                url: `/api/assessments/${id}/clone`,
                method: 'POST',
                mockData: successMock({ evaluacion: cloned }),
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al clonar la evaluación');
            }

            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── GET draft by id ───────────────────────────────────────────────────────

    const getDraftById = async (id: string): Promise<FetchResponse | null> => {
        try {
            // Preferir draft completo; si no existe, sintetizar desde el resumen
            const full = _draftsDb[id];
            const summary = _db.find((a) => a.id === id);

            if (!full && !summary) throw new Error('Evaluación no encontrada');

            const draft: AssessmentDraft = full ?? {
                id: summary!.id,
                nombre: summary!.nombre,
                descripcion: summary!.descripcion,
                tipo: summary!.tipo,
                estado: summary!.estado,
                duracion_estimada_min: summary!.duracion_estimada_min,
                version: summary!.version,
                creado_por: summary!.creado_por,
                fecha_creacion: summary!.fecha_creacion,
                fecha_actualizacion: summary!.fecha_actualizacion,
                // Sección vacía inicial para que el builder siempre tenga algo
                secciones: [{ id: 'sec-1', nombre: 'Sección 1', descripcion: '', orden: 1, preguntas: [] }],
            };

            const response = (await fetchData({
                url: `/api/assessments/${id}/draft`,
                mockData: successMock({ draft }),
            })) as FetchResponse | null;

            if (response?.success === false) throw new Error(response.message || 'Error al cargar la evaluación');
            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── SAVE draft (create o update) ──────────────────────────────────────────

    const saveDraft = async (draft: AssessmentDraft): Promise<FetchResponse | null> => {
        try {
            const isNew = !draft.id;
            const id = draft.id ?? `asmnt-${Math.random().toString(36).slice(2, 9)}`;
            const now = new Date().toISOString();

            const saved: AssessmentDraft = {
                ...draft,
                id,
                fecha_actualizacion: now,
                fecha_creacion: draft.fecha_creacion ?? now,
            };

            // Persistir draft completo
            _draftsDb[id] = saved;

            // Sincronizar resumen en _db
            const totalPreguntas = saved.secciones.reduce((acc, s) => acc + s.preguntas.length, 0);
            const summary: AssessmentSummary = {
                id,
                nombre: saved.nombre,
                descripcion: saved.descripcion,
                tipo: saved.tipo,
                estado: saved.estado,
                total_preguntas: totalPreguntas,
                total_secciones: saved.secciones.length,
                version: saved.version,
                creado_por: saved.creado_por ?? 'Usuario actual',
                fecha_creacion: saved.fecha_creacion ?? now,
                fecha_actualizacion: now,
                veces_aplicada: _db.find((a) => a.id === id)?.veces_aplicada ?? 0,
                duracion_estimada_min: saved.duracion_estimada_min,
            };

            if (isNew) {
                _db = [..._db, summary];
            } else {
                _db = _db.map((a) => a.id === id ? summary : a);
            }

            const response = (await fetchData({
                url: isNew ? '/api/assessments/draft' : `/api/assessments/${id}/draft`,
                method: isNew ? 'POST' : 'PUT',
                body: saved,
                mockData: successMock({ draft: saved }),
            })) as FetchResponse | null;

            if (response?.success === false) throw new Error(response.message || 'Error al guardar la evaluación');
            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── PUBLISH draft ─────────────────────────────────────────────────────────

    const publishDraft = async (id: string): Promise<FetchResponse | null> => {
        try {
            if (_draftsDb[id]) _draftsDb[id] = { ..._draftsDb[id], estado: 'PUBLICADO' };
            _db = _db.map((a) => a.id === id ? { ...a, estado: 'PUBLICADO' } : a);

            const response = (await fetchData({
                url: `/api/assessments/${id}/publish`,
                method: 'POST',
                mockData: successMock({ id, estado: 'PUBLICADO' }),
            })) as FetchResponse | null;

            if (response?.success === false) throw new Error(response.message || 'Error al publicar la evaluación');
            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    return {
        getAssessments,
        getAssessmentStats,
        createAssessment,
        updateAssessment,
        deleteAssessment,
        cloneAssessment,
        getDraftById,
        saveDraft,
        publishDraft,
        loading,
        error,
    };
};