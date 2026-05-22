import useFetch from '../hooks/useFetch';
import { FetchResponse, successMock } from './responseType';
import useUIStore from '../store/uiStore';
import { UserRole } from '../constants/roles';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BitacoraTipo =
    | 'NOTA_PERSONAL'
    | 'REUNION'
    | 'OBSERVACION_EVALUACION'
    | 'SEGUIMIENTO'
    | 'OTRO';

export type BitacoraVisibilidad =
    | 'PRIVADA'         // Solo el autor
    | 'COMPARTIDA'      // Autor + colaborador involucrado + RRHH + Admin
    | 'INTERNA_RRHH';   // Solo RRHH y Admin (nunca visible al colaborador)


export interface BitacoraEntry {
    id: string;
    tipo: BitacoraTipo;
    titulo: string;
    contenido: string;
    visibilidad: BitacoraVisibilidad;
    // Quién escribió la entrada
    autor_id: string;
    autor_nombre: string;
    autor_rol: UserRole;
    // Sobre quién es la entrada (puede diferir del autor — ej. RRHH escribe sobre un colaborador)
    colaborador_id?: string;
    colaborador_nombre?: string;
    colaborador_puesto?: string;
    // Contexto adicional opcional
    evaluacion_id?: string;
    evaluacion_nombre?: string;
    ciclo_nombre?: string;
    etiquetas?: string[];
    // Campos de auditoría
    creado_en: string;
    actualizado_en: string;
    editado?: boolean;
}

export interface BitacoraQueryParams {
    pagina?: number;
    items_por_pagina?: number;
    filtro?: string;
    tipo?: BitacoraTipo;
    visibilidad?: BitacoraVisibilidad;
    colaborador_id?: string;
    autor_id?: string;
    evaluacion_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    orden?: 'asc' | 'desc';
}

export interface CreateBitacoraDto {
    tipo: BitacoraTipo;
    titulo: string;
    contenido: string;
    visibilidad: BitacoraVisibilidad;
    colaborador_id?: string;
    evaluacion_id?: string;
    etiquetas?: string[];
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const BITACORA_TIPO_META: Record<BitacoraTipo, {
    label: string;
    color: string;          // DaisyUI badge color
    icon: string;           // SVG path data
    descripcion: string;
}> = {
    NOTA_PERSONAL: {
        label: 'Nota personal',
        color: 'primary',
        icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
        descripcion: 'Reflexión o anotación personal',
    },
    REUNION: {
        label: 'Reunión',
        color: 'secondary',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
        descripcion: 'Registro de reunión o sesión 1:1',
    },
    OBSERVACION_EVALUACION: {
        label: 'Observación',
        color: 'warning',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
        descripcion: 'Nota ligada a una evaluación específica',
    },
    SEGUIMIENTO: {
        label: 'Seguimiento',
        color: 'success',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        descripcion: 'Seguimiento de acuerdos o compromisos',
    },
    OTRO: {
        label: 'Otro',
        color: 'ghost',
        icon: 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z',
        descripcion: 'Anotación general',
    },
};

export const BITACORA_VISIBILIDAD_META: Record<BitacoraVisibilidad, {
    label: string;
    descripcion: string;
    icon: string;
    color: string;
    /** Qué roles pueden establecer esta visibilidad */
    rolesPermitidos: UserRole[];
    /** Qué roles pueden leer entradas con esta visibilidad (además del autor) */
    rolesLectores: UserRole[];
}> = {
    PRIVADA: {
        label: 'Privada',
        descripcion: 'Solo visible para ti',
        icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
        color: 'neutral',
        rolesPermitidos: [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EVALUATOR, UserRole.EMPLOYEE],
        rolesLectores: [],
    },
    COMPARTIDA: {
        label: 'Compartida',
        descripcion: 'Visible para el colaborador involucrado, RRHH y Admin',
        icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
        color: 'info',
        rolesPermitidos: [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EVALUATOR, UserRole.EMPLOYEE],
        rolesLectores: [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EMPLOYEE],
    },
    INTERNA_RRHH: {
        label: 'Interna RRHH',
        descripcion: 'Solo visible para RRHH y Admin — nunca para el colaborador',
        icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
        color: 'warning',
        rolesPermitidos: [UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.EVALUATOR],
        rolesLectores: [UserRole.ADMIN, UserRole.HR_MANAGER],
    },
};

/** Qué tipos de entrada puede crear cada rol */
export const TIPOS_POR_ROL: Record<UserRole, BitacoraTipo[]> = {
    [UserRole.ADMIN]:        ['NOTA_PERSONAL', 'REUNION', 'OBSERVACION_EVALUACION', 'SEGUIMIENTO', 'OTRO'],
    [UserRole.HR_MANAGER]:   ['NOTA_PERSONAL', 'REUNION', 'OBSERVACION_EVALUACION', 'SEGUIMIENTO', 'OTRO'],
    [UserRole.EVALUATOR]:    ['NOTA_PERSONAL', 'REUNION', 'OBSERVACION_EVALUACION', 'SEGUIMIENTO', 'OTRO'],
    [UserRole.EMPLOYEE]:     ['NOTA_PERSONAL', 'SEGUIMIENTO', 'OTRO'],
};

/** Qué visibilidades puede asignar cada rol */
export const VISIBILIDADES_POR_ROL: Record<UserRole, BitacoraVisibilidad[]> = {
    [UserRole.ADMIN]:        ['PRIVADA', 'COMPARTIDA', 'INTERNA_RRHH'],
    [UserRole.HR_MANAGER]:   ['PRIVADA', 'COMPARTIDA', 'INTERNA_RRHH'],
    [UserRole.EVALUATOR]:    ['PRIVADA', 'COMPARTIDA', 'INTERNA_RRHH'],
    [UserRole.EMPLOYEE]:     ['PRIVADA', 'COMPARTIDA'],
};

// ─── Helpers de permisos ──────────────────────────────────────────────────────

/**
 * Determina si un usuario puede VER una entrada dada su identidad y rol.
 */
export const canReadEntry = (
    entry: BitacoraEntry,
    usuarioId: string,
    usuarioRol: UserRole,
): boolean => {
    // El autor siempre ve sus propias entradas
    if (entry.autor_id === usuarioId) return true;
    // Admin ve todo
    if (usuarioRol === UserRole.ADMIN) return true;

    switch (entry.visibilidad) {
        case 'PRIVADA':
            return false;
        case 'COMPARTIDA':
            // RRHH ve todas compartidas; colaborador involucrado también
            return (
                usuarioRol === UserRole.HR_MANAGER ||
                entry.colaborador_id === usuarioId
            );
        case 'INTERNA_RRHH':
            return usuarioRol === UserRole.HR_MANAGER;
        default:
            return false;
    }
};

/**
 * Determina si un usuario puede EDITAR una entrada.
 * Solo el autor puede editar; admin puede editar cualquiera.
 */
export const canEditEntry = (
    entry: BitacoraEntry,
    usuarioId: string,
    usuarioRol: UserRole,
): boolean => {
    if (usuarioRol === UserRole.ADMIN) return true;
    return entry.autor_id === usuarioId;
};

/**
 * Determina si un usuario puede ELIMINAR una entrada.
 * Autor o admin/rrhh.
 */
export const canDeleteEntry = (
    entry: BitacoraEntry,
    usuarioId: string,
    usuarioRol: UserRole,
): boolean => {
    if (usuarioRol === UserRole.ADMIN || usuarioRol === UserRole.HR_MANAGER) return true;
    return entry.autor_id === usuarioId;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ENTRIES: BitacoraEntry[] = [
    {
        id: 'bit-001',
        tipo: 'REUNION',
        titulo: 'Sesión 1:1 — Revisión de objetivos Q1',
        contenido: `Reunión con Ana García para revisar el avance de sus objetivos del primer trimestre.

**Puntos tratados:**
- Completó el 80% de los objetivos técnicos planteados. Hay retraso en la documentación del módulo de reportes.
- Manifestó interés en participar en el programa de mentoría.
- Acordamos una siguiente sesión en 3 semanas para revisar el avance de la documentación pendiente.

**Acuerdos:**
- Ana entregará la documentación técnica antes del 15 de abril.
- Se gestionará su inscripción en el programa de mentoría para el Q2.`,
        visibilidad: 'COMPARTIDA',
        autor_id: 'usr-rrhh-01',
        autor_nombre: 'María López',
        autor_rol: UserRole.HR_MANAGER,
        colaborador_id: 'usr-col-01',
        colaborador_nombre: 'Ana García',
        colaborador_puesto: 'Desarrollador Senior',
        ciclo_nombre: 'Q1 2025',
        etiquetas: ['objetivos', '1:1', 'mentoría'],
        creado_en: '2025-03-28T10:30:00Z',
        actualizado_en: '2025-03-28T10:30:00Z',
    },
    {
        id: 'bit-002',
        tipo: 'OBSERVACION_EVALUACION',
        titulo: 'Observaciones — Evaluación de Competencias Técnicas',
        contenido: `Durante la evaluación de competencias técnicas del Q1, Carlos demostró un nivel avanzado en arquitectura de software pero muestra áreas de mejora en comunicación con stakeholders no técnicos.

Se recomienda incluir en su plan de desarrollo actividades que refuercen la comunicación efectiva. Su puntaje técnico fue sobresaliente (4.7/5) pero el componente de colaboración interdepartamental obtuvo 3.2/5.

Para el siguiente ciclo se sugiere asignarle proyectos con mayor exposición a otras áreas del negocio.`,
        visibilidad: 'INTERNA_RRHH',
        autor_id: 'usr-eval-01',
        autor_nombre: 'Roberto Mendoza',
        autor_rol: UserRole.EVALUATOR,
        colaborador_id: 'usr-col-02',
        colaborador_nombre: 'Carlos Rodríguez',
        colaborador_puesto: 'Arquitecto de Software',
        evaluacion_id: 'eval-comp-007',
        evaluacion_nombre: 'Evaluación de Competencias Q1 2025',
        ciclo_nombre: 'Q1 2025',
        etiquetas: ['competencias', 'plan-desarrollo'],
        creado_en: '2025-04-01T14:15:00Z',
        actualizado_en: '2025-04-01T14:15:00Z',
    },
    {
        id: 'bit-003',
        tipo: 'NOTA_PERSONAL',
        titulo: 'Reflexión post-evaluación',
        contenido: `Terminé mi evaluación de desempeño del trimestre. Fue un proceso intenso pero muy útil para entender mis fortalezas y áreas de mejora.

Me quedé pensando en el feedback sobre la documentación — es algo que sé que he postergado y necesito atacarlo de forma más sistemática. Voy a proponerme dedicar los viernes en la tarde exclusivamente a documentar.

El reconocimiento por el proyecto de migración fue muy motivador. Quiero seguir creciendo en ese camino.`,
        visibilidad: 'PRIVADA',
        autor_id: 'usr-col-01',
        autor_nombre: 'Ana García',
        autor_rol: UserRole.EMPLOYEE,
        ciclo_nombre: 'Q1 2025',
        etiquetas: ['reflexión', 'desempeño'],
        creado_en: '2025-03-30T18:00:00Z',
        actualizado_en: '2025-03-30T18:00:00Z',
    },
    {
        id: 'bit-004',
        tipo: 'SEGUIMIENTO',
        titulo: 'Seguimiento — Plan de desarrollo Ana García',
        contenido: `Revisión del plan de desarrollo acordado en sesión 1:1 del 28 de marzo.

**Estado de compromisos:**
✅ Inscripción al programa de mentoría — Completado (04/04)
⏳ Documentación técnica módulo de reportes — En progreso (fecha límite: 15/04)

**Próxima revisión:** 18 de abril.`,
        visibilidad: 'COMPARTIDA',
        autor_id: 'usr-rrhh-01',
        autor_nombre: 'María López',
        autor_rol: UserRole.HR_MANAGER,
        colaborador_id: 'usr-col-01',
        colaborador_nombre: 'Ana García',
        colaborador_puesto: 'Desarrollador Senior',
        etiquetas: ['seguimiento', 'plan-desarrollo'],
        creado_en: '2025-04-08T09:00:00Z',
        actualizado_en: '2025-04-08T09:00:00Z',
    },
    {
        id: 'bit-005',
        tipo: 'REUNION',
        titulo: 'Reunión de calibración — Evaluaciones Q1',
        contenido: `Sesión de calibración con evaluadores para alinear criterios de calificación del ciclo Q1.

Participantes: Roberto Mendoza, Laura Sánchez, Pedro Vega.

Se revisaron 12 evaluaciones. Se ajustaron 3 puntajes por consenso del equipo. Los criterios de competencias interpersonales generaron más debate — se acordó unificar el criterio en la rúbrica para el siguiente ciclo.

Se compartirá el acta formal por correo.`,
        visibilidad: 'INTERNA_RRHH',
        autor_id: 'usr-rrhh-01',
        autor_nombre: 'María López',
        autor_rol: UserRole.HR_MANAGER,
        ciclo_nombre: 'Q1 2025',
        etiquetas: ['calibración', 'evaluadores', 'Q1'],
        creado_en: '2025-04-10T16:45:00Z',
        actualizado_en: '2025-04-10T16:45:00Z',
    },
    {
        id: 'bit-006',
        tipo: 'NOTA_PERSONAL',
        titulo: 'Ideas para mejorar el proceso de onboarding',
        contenido: `Después de incorporar a tres nuevos colaboradores este trimestre, veo oportunidades claras para mejorar el proceso:

1. Crear un checklist digital en la plataforma para los primeros 30/60/90 días.
2. Asignar un buddy de forma más estructurada.
3. Incluir una sesión de bienvenida con el equipo de liderazgo en la primera semana.

Voy a proponer esto en la próxima reunión de RRHH.`,
        visibilidad: 'PRIVADA',
        autor_id: 'usr-rrhh-01',
        autor_nombre: 'María López',
        autor_rol: UserRole.HR_MANAGER,
        etiquetas: ['ideas', 'onboarding', 'proceso'],
        creado_en: '2025-04-12T11:00:00Z',
        actualizado_en: '2025-04-12T11:00:00Z',
    },
    {
        id: 'bit-007',
        tipo: 'SEGUIMIENTO',
        titulo: 'Compromisos post-evaluación — Carlos Rodríguez',
        contenido: `Acuerdos establecidos tras compartir resultados de evaluación con Carlos el 03/04.

**Compromisos del colaborador:**
- Participar en al menos 2 presentaciones interdepartamentales en Q2.
- Completar el curso "Comunicación para líderes técnicos" antes de junio.

**Compromisos de la empresa:**
- Asignarle un proyecto con interfaz directa con el área comercial en Q2.
- Revisión salarial programada para julio, sujeta a avance.`,
        visibilidad: 'COMPARTIDA',
        autor_id: 'usr-rrhh-01',
        autor_nombre: 'María López',
        autor_rol: UserRole.HR_MANAGER,
        colaborador_id: 'usr-col-02',
        colaborador_nombre: 'Carlos Rodríguez',
        colaborador_puesto: 'Arquitecto de Software',
        evaluacion_id: 'eval-comp-007',
        evaluacion_nombre: 'Evaluación de Competencias Q1 2025',
        etiquetas: ['seguimiento', 'compromisos', 'desarrollo'],
        creado_en: '2025-04-14T10:00:00Z',
        actualizado_en: '2025-04-14T10:00:00Z',
    },
    {
        id: 'bit-008',
        tipo: 'OTRO',
        titulo: 'Recordatorio — Revisar plantillas de evaluación Q2',
        contenido: `Pendiente: actualizar las plantillas de evaluación de competencias para el ciclo Q2 antes del 30 de abril. Incorporar los ajustes acordados en la sesión de calibración del 10/04.`,
        visibilidad: 'PRIVADA',
        autor_id: 'usr-rrhh-01',
        autor_nombre: 'María López',
        autor_rol: UserRole.HR_MANAGER,
        etiquetas: ['pendiente', 'Q2'],
        creado_en: '2025-04-15T08:30:00Z',
        actualizado_en: '2025-04-15T08:30:00Z',
    },
];

// ─── Service Hook ─────────────────────────────────────────────────────────────

export const useBitacoraService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();

    // ── Query ───────────────────────────────────────────────────────────────────

    const getEntries = async (
        usuarioId: string,
        usuarioRol: UserRole,
        params?: BitacoraQueryParams,
    ): Promise<FetchResponse | null> => {
        try {
            // Filtra según permisos del usuario actual
            let filtered = MOCK_ENTRIES.filter((e) =>
                canReadEntry(e, usuarioId, usuarioRol)
            );

            // Filtros opcionales
            if (params?.filtro) {
                const q = params.filtro.toLowerCase();
                filtered = filtered.filter(
                    (e) =>
                        e.titulo.toLowerCase().includes(q) ||
                        e.contenido.toLowerCase().includes(q) ||
                        e.etiquetas?.some((t) => t.toLowerCase().includes(q)) ||
                        e.colaborador_nombre?.toLowerCase().includes(q)
                );
            }
            if (params?.tipo) filtered = filtered.filter((e) => e.tipo === params.tipo);
            if (params?.visibilidad) filtered = filtered.filter((e) => e.visibilidad === params.visibilidad);
            if (params?.colaborador_id) filtered = filtered.filter((e) => e.colaborador_id === params.colaborador_id);
            if (params?.autor_id) filtered = filtered.filter((e) => e.autor_id === params.autor_id);
            if (params?.evaluacion_id) filtered = filtered.filter((e) => e.evaluacion_id === params.evaluacion_id);
            if (params?.fecha_desde) filtered = filtered.filter((e) => e.creado_en >= params.fecha_desde!);
            if (params?.fecha_hasta) filtered = filtered.filter((e) => e.creado_en <= params.fecha_hasta!);

            // Orden cronológico (más reciente primero por defecto)
            filtered.sort((a, b) =>
                params?.orden === 'asc'
                    ? a.creado_en.localeCompare(b.creado_en)
                    : b.creado_en.localeCompare(a.creado_en)
            );

            // Paginación
            const page     = params?.pagina ?? 1;
            const pageSize = params?.items_por_pagina ?? 20;
            const total    = filtered.length;
            const pages    = Math.max(1, Math.ceil(total / pageSize));
            const start    = (page - 1) * pageSize;
            const paginated = filtered.slice(start, start + pageSize);

            const response = (await fetchData({
                url: '/api/bitacora',
                params: params as any,
                mockData: successMock({
                    entradas: paginated,
                    paginacion: { pagina_actual: page, items_por_pagina: pageSize, total_items: total, total_paginas: pages },
                }),
            })) as FetchResponse | null;

            if (response?.success === false) throw new Error(response.message || 'Error al obtener entradas');
            return response;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const getEntryById = async (id: string): Promise<FetchResponse | null> => {
        try {
            const entry = MOCK_ENTRIES.find((e) => e.id === id) ?? null;
            if (!entry) throw new Error('Entrada no encontrada');
            return (await fetchData({
                url: `/api/bitacora/${id}`,
                mockData: successMock({ entrada: entry }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    // ── Mutations ───────────────────────────────────────────────────────────────

    const createEntry = async (
        dto: CreateBitacoraDto,
        autorId: string,
        autorNombre: string,
        autorRol: UserRole,
        colaboradorNombre?: string,
        colaboradorPuesto?: string,
        evaluacionNombre?: string,
    ): Promise<FetchResponse | null> => {
        try {
            const now = new Date().toISOString();
            const newEntry: BitacoraEntry = {
                ...dto,
                id: `bit-${Math.random().toString(36).substr(2, 6)}`,
                autor_id: autorId,
                autor_nombre: autorNombre,
                autor_rol: autorRol,
                colaborador_nombre: colaboradorNombre,
                colaborador_puesto: colaboradorPuesto,
                evaluacion_nombre: evaluacionNombre,
                creado_en: now,
                actualizado_en: now,
            };
            MOCK_ENTRIES.unshift(newEntry); // más reciente primero en el mock

            return (await fetchData({
                url: '/api/bitacora',
                method: 'POST',
                body: dto,
                mockData: successMock({ entrada: newEntry }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const updateEntry = async (
        id: string,
        dto: Partial<CreateBitacoraDto>,
    ): Promise<FetchResponse | null> => {
        try {
            const idx = MOCK_ENTRIES.findIndex((e) => e.id === id);
            if (idx !== -1) {
                MOCK_ENTRIES[idx] = {
                    ...MOCK_ENTRIES[idx],
                    ...dto,
                    actualizado_en: new Date().toISOString(),
                    editado: true,
                };
            }
            return (await fetchData({
                url: `/api/bitacora/${id}`,
                method: 'PUT',
                body: dto,
                mockData: successMock({ entrada: idx !== -1 ? MOCK_ENTRIES[idx] : { ...dto, id } }),
            })) as FetchResponse | null;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return null;
        }
    };

    const deleteEntry = async (id: string): Promise<boolean> => {
        try {
            const idx = MOCK_ENTRIES.findIndex((e) => e.id === id);
            if (idx !== -1) MOCK_ENTRIES.splice(idx, 1);
            await fetchData({
                url: `/api/bitacora/${id}`,
                method: 'DELETE',
                mockData: successMock({ deleted: true }),
            });
            return true;
        } catch (err) {
            openAlert(err instanceof Error ? err.message : String(err), 'error');
            return false;
        }
    };

    return {
        getEntries,
        getEntryById,
        createEntry,
        updateEntry,
        deleteEntry,
        loading,
        error,
    };
};
