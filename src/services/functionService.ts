/**
 * Function Service
 * Gestiona la estructura jerárquica de funciones, capacidades, conocimientos y módulos
 */

// ============ TYPES & INTERFACES ============

export type KnowledgeType = 'ESTANDAR' | 'INTERNO' | 'CRITICO';
export type KnowledgeSource = 'INTERNA' | 'EXTERNA';
export type DevelopmentLevel = 0 | 1 | 2 | 3;

/**
 * Detalle - Nivel más bajo de la jerarquía
 */
export interface Detail {
    id: string;
    titulo: string;
    descripcion?: string;
}

/**
 * Tema - Agrupa detalles relacionados
 */
export interface Topic {
    id: string;
    titulo: string;
    detalles: Detail[];
}

/**
 * Módulo - Contiene información de conocimiento (tipo, fuentes, nivel)
 */
export interface Module {
    id: string;
    titulo: string;
    tipoConocimiento: KnowledgeType;
    fuentes: KnowledgeSource[];
    nivelDesarrollo: DevelopmentLevel;
    temas: Topic[];
}

/**
 * Conocimiento - Agrupa módulos
 */
export interface Knowledge {
    id: string;
    titulo: string;
    modulos: Module[];
}

/**
 * Capacidad a Desarrollar - Agrupa conocimientos
 */
export interface Capability {
    id: string;
    titulo: string;
    descripcion?: string;
    conocimientos: Knowledge[];
}

/**
 * Función Principal - Nivel superior
 */
export interface JobFunction {
    id: string;
    titulo: string;
    descripcion?: string;
    capacidades: Capability[];
    createdAt?: string;
    updatedAt?: string;
}

// ============ UTILITY FUNCTIONS ============

/**
 * Genera un ID único
 */
export const generateId = (): string => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Crea un nuevo detalle vacío
 */
export const createEmptyDetail = (): Detail => ({
    id: generateId(),
    titulo: '',
    descripcion: ''
});

/**
 * Crea un nuevo tema vacío
 */
export const createEmptyTopic = (): Topic => ({
    id: generateId(),
    titulo: '',
    detalles: [createEmptyDetail()]
});

/**
 * Crea un nuevo módulo vacío
 */
export const createEmptyModule = (): Module => ({
    id: generateId(),
    titulo: '',
    tipoConocimiento: 'ESTANDAR',
    fuentes: ['INTERNA'],
    nivelDesarrollo: 1,
    temas: [createEmptyTopic()]
});

/**
 * Crea un nuevo conocimiento vacío
 */
export const createEmptyKnowledge = (): Knowledge => ({
    id: generateId(),
    titulo: '',
    modulos: [createEmptyModule()]
});

/**
 * Crea una nueva capacidad vacía
 */
export const createEmptyCapability = (): Capability => ({
    id: generateId(),
    titulo: '',
    descripcion: '',
    conocimientos: [createEmptyKnowledge()]
});

/**
 * Crea una nueva función vacía
 */
export const createEmptyJobFunction = (): JobFunction => ({
    id: generateId(),
    titulo: '',
    descripcion: '',
    capacidades: [createEmptyCapability()],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
});

// ============ MUTATION FUNCTIONS ============

/**
 * Añade un nuevo detalle a un tema
 */
export const addDetailToTopic = (topic: Topic): Topic => ({
    ...topic,
    detalles: [...topic.detalles, createEmptyDetail()]
});

/**
 * Elimina un detalle de un tema
 */
export const removeDetailFromTopic = (topic: Topic, detailId: string): Topic => ({
    ...topic,
    detalles: topic.detalles.filter(d => d.id !== detailId)
});

/**
 * Actualiza un detalle en un tema
 */
export const updateDetailInTopic = (
    topic: Topic,
    detailId: string,
    updates: Partial<Detail>
): Topic => ({
    ...topic,
    detalles: topic.detalles.map(d =>
        d.id === detailId ? { ...d, ...updates } : d
    )
});

/**
 * Añade un nuevo tema a un módulo
 */
export const addTopicToModule = (module: Module): Module => ({
    ...module,
    temas: [...module.temas, createEmptyTopic()]
});

/**
 * Elimina un tema de un módulo
 */
export const removeTopicFromModule = (module: Module, topicId: string): Module => ({
    ...module,
    temas: module.temas.filter(t => t.id !== topicId)
});

/**
 * Actualiza un tema en un módulo
 */
export const updateTopicInModule = (
    module: Module,
    topicId: string,
    updates: Partial<Topic>
): Module => ({
    ...module,
    temas: module.temas.map(t =>
        t.id === topicId ? { ...t, ...updates } : t
    )
});

/**
 * Añade un nuevo módulo a un conocimiento
 */
export const addModuleToKnowledge = (knowledge: Knowledge): Knowledge => ({
    ...knowledge,
    modulos: [...knowledge.modulos, createEmptyModule()]
});

/**
 * Elimina un módulo de un conocimiento
 */
export const removeModuleFromKnowledge = (knowledge: Knowledge, moduleId: string): Knowledge => ({
    ...knowledge,
    modulos: knowledge.modulos.filter(m => m.id !== moduleId)
});

/**
 * Actualiza un módulo en un conocimiento
 */
export const updateModuleInKnowledge = (
    knowledge: Knowledge,
    moduleId: string,
    updates: Partial<Module>
): Knowledge => ({
    ...knowledge,
    modulos: knowledge.modulos.map(m =>
        m.id === moduleId ? { ...m, ...updates } : m
    )
});

/**
 * Añade un nuevo conocimiento a una capacidad
 */
export const addKnowledgeToCapability = (capability: Capability): Capability => ({
    ...capability,
    conocimientos: [...capability.conocimientos, createEmptyKnowledge()]
});

/**
 * Elimina un conocimiento de una capacidad
 */
export const removeKnowledgeFromCapability = (capability: Capability, knowledgeId: string): Capability => ({
    ...capability,
    conocimientos: capability.conocimientos.filter(k => k.id !== knowledgeId)
});

/**
 * Actualiza un conocimiento en una capacidad
 */
export const updateKnowledgeInCapability = (
    capability: Capability,
    knowledgeId: string,
    updates: Partial<Knowledge>
): Capability => ({
    ...capability,
    conocimientos: capability.conocimientos.map(k =>
        k.id === knowledgeId ? { ...k, ...updates } : k
    )
});

/**
 * Añade una nueva capacidad a una función
 */
export const addCapabilityToFunction = (jobFunction: JobFunction): JobFunction => ({
    ...jobFunction,
    capacidades: [...jobFunction.capacidades, createEmptyCapability()],
    updatedAt: new Date().toISOString()
});

/**
 * Elimina una capacidad de una función
 */
export const removeCapabilityFromFunction = (jobFunction: JobFunction, capabilityId: string): JobFunction => ({
    ...jobFunction,
    capacidades: jobFunction.capacidades.filter(c => c.id !== capabilityId),
    updatedAt: new Date().toISOString()
});

/**
 * Actualiza una capacidad en una función
 */
export const updateCapabilityInFunction = (
    jobFunction: JobFunction,
    capabilityId: string,
    updates: Partial<Capability>
): JobFunction => ({
    ...jobFunction,
    capacidades: jobFunction.capacidades.map(c =>
        c.id === capabilityId ? { ...c, ...updates } : c
    ),
    updatedAt: new Date().toISOString()
});

/**
 * Actualiza la función principal
 */
export const updateJobFunction = (
    jobFunction: JobFunction,
    updates: Partial<Omit<JobFunction, 'id'>>
): JobFunction => ({
    ...jobFunction,
    ...updates,
    updatedAt: new Date().toISOString()
});

// ============ VALIDATION FUNCTIONS ============

/**
 * Valida que una función esté completa (sin campos vacíos críticos)
 */
export const isJobFunctionValid = (jobFunction: JobFunction): boolean => {
    if (!jobFunction.titulo.trim()) return false;
    if (jobFunction.capacidades.length === 0) return false;

    return jobFunction.capacidades.every(cap =>
        cap.titulo.trim() &&
        cap.conocimientos.length > 0 &&
        cap.conocimientos.every(know =>
            know.titulo.trim() &&
            know.modulos.length > 0 &&
            know.modulos.every(mod =>
                mod.titulo.trim() &&
                mod.temas.length > 0 &&
                mod.temas.every(tema =>
                    tema.titulo.trim() &&
                    tema.detalles.length > 0 &&
                    tema.detalles.every(det => det.titulo.trim())
                )
            )
        )
    );
};

/**
 * Calcula estadísticas de una función
 */
export const calculateFunctionStats = (jobFunction: JobFunction) => {
    const capabilitiesCount = jobFunction.capacidades.length;
    const knowledgesCount = jobFunction.capacidades.reduce(
        (acc, cap) => acc + cap.conocimientos.length, 0
    );
    const modulesCount = jobFunction.capacidades.reduce(
        (acc, cap) => acc + cap.conocimientos.reduce(
            (subAcc, know) => subAcc + know.modulos.length, 0
        ), 0
    );
    const topicsCount = jobFunction.capacidades.reduce(
        (acc, cap) => acc + cap.conocimientos.reduce(
            (subAcc, know) => subAcc + know.modulos.reduce(
                (subSubAcc, mod) => subSubAcc + mod.temas.length, 0
            ), 0
        ), 0
    );
    const detailsCount = jobFunction.capacidades.reduce(
        (acc, cap) => acc + cap.conocimientos.reduce(
            (subAcc, know) => subAcc + know.modulos.reduce(
                (subSubAcc, mod) => subSubAcc + mod.temas.reduce(
                    (subSubSubAcc, tema) => subSubSubAcc + tema.detalles.length, 0
                ), 0
            ), 0
        ), 0
    );

    return {
        capabilitiesCount,
        knowledgesCount,
        modulesCount,
        topicsCount,
        detailsCount,
        totalElements: capabilitiesCount + knowledgesCount + modulesCount + topicsCount + detailsCount
    };
};
