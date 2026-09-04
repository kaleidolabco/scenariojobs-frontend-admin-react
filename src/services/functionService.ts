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
    archivos: FileResource[];
}

/**
 * Archivo - Recurso asociado a un módulo
 */
export interface FileResource {
    id: string;
    nombre: string;
    descripcion?: string;
    comentario?: string;
    archivoNombre?: string;  // Nombre del archivo cargado
    archivoUrl?: string;      // URL o path del archivo
    archivoTamaño?: number;   // Tamaño en bytes
}

/**
 * Módulo - Contiene temas y archivos asociados
 */
export interface Module {
    id: string;
    titulo: string;
    temas: Topic[];
    archivos: FileResource[];
}

/**
 * Conocimiento - Agrupa módulos y contiene información de tipo, fuentes y nivel requerido
 */
export interface Knowledge {
    id: string;
    titulo: string;
    tipoConocimiento: KnowledgeType;
    fuentes: KnowledgeSource[];
    nivelDesarrollo: DevelopmentLevel;
    origenEmpleadoId?: string;      // ID del empleado si fuente es INTERNA
    origenExternoReferencia?: string; // Referencia/nombre si fuente es EXTERNA
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
    detalles: [createEmptyDetail()],
    archivos: []
});

/**
 * Crea un nuevo archivo vacío
 */
export const createEmptyFileResource = (): FileResource => ({
    id: generateId(),
    nombre: '',
    descripcion: '',
    comentario: ''
});

/**
 * Crea un nuevo módulo vacío
 */
export const createEmptyModule = (): Module => ({
    id: generateId(),
    titulo: '',
    temas: [createEmptyTopic()],
    archivos: []
});

/**
 * Crea un nuevo conocimiento vacío
 */
export const createEmptyKnowledge = (): Knowledge => ({
    id: generateId(),
    titulo: '',
    tipoConocimiento: 'ESTANDAR',
    fuentes: ['INTERNA'],
    nivelDesarrollo: 1,
    origenEmpleadoId: undefined,
    origenExternoReferencia: undefined,
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
 * Añade un nuevo archivo a un tema
 */
export const addFileToTopic = (topic: Topic): Topic => ({
    ...topic,
    archivos: [...topic.archivos, createEmptyFileResource()]
});

/**
 * Elimina un archivo de un tema
 */
export const removeFileFromTopic = (topic: Topic, fileId: string): Topic => ({
    ...topic,
    archivos: topic.archivos.filter(f => f.id !== fileId)
});

/**
 * Actualiza un archivo en un tema
 */
export const updateFileInTopic = (
    topic: Topic,
    fileId: string,
    updates: Partial<FileResource>
): Topic => ({
    ...topic,
    archivos: topic.archivos.map(f =>
        f.id === fileId ? { ...f, ...updates } : f
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
 * Añade un nuevo archivo a un módulo
 */
export const addFileToModule = (module: Module): Module => ({
    ...module,
    archivos: [...module.archivos, createEmptyFileResource()]
});

/**
 * Elimina un archivo de un módulo
 */
export const removeFileFromModule = (module: Module, fileId: string): Module => ({
    ...module,
    archivos: module.archivos.filter(f => f.id !== fileId)
});

/**
 * Actualiza un archivo en un módulo
 */
export const updateFileInModule = (
    module: Module,
    fileId: string,
    updates: Partial<FileResource>
): Module => ({
    ...module,
    archivos: module.archivos.map(f =>
        f.id === fileId ? { ...f, ...updates } : f
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

/**
 * Valida que un conjunto de funciones tenga todos los campos requeridos
 */
export const validateFunctions = (functions: JobFunction[]): string | null => {
    if (!functions || functions.length === 0) return "Debe haber al menos una función.";
    for (const func of functions) {
        if (!func.titulo || !func.titulo.trim()) return `La función debe tener un título.`;
        if (!func.capacidades || func.capacidades.length === 0) return `La función "${func.titulo}" debe tener al menos una capacidad.`;
        for (const cap of func.capacidades) {
            if (!cap.titulo || !cap.titulo.trim()) return `La capacidad en la función "${func.titulo}" debe tener un título.`;
            if (!cap.conocimientos || cap.conocimientos.length === 0) return `La capacidad "${cap.titulo}" debe tener al menos un conocimiento.`;
            for (const know of cap.conocimientos) {
                if (!know.titulo || !know.titulo.trim()) return `El conocimiento en la capacidad "${cap.titulo}" debe tener un título.`;
                if (!know.tipoConocimiento) return `El conocimiento "${know.titulo}" debe tener un tipo.`;
                if (!know.fuentes || know.fuentes.length === 0) return `El conocimiento "${know.titulo}" debe tener al menos una fuente.`;
                if (know.nivelDesarrollo === undefined) return `El conocimiento "${know.titulo}" debe tener un nivel de desarrollo.`;
                if (!know.modulos || know.modulos.length === 0) return `El conocimiento "${know.titulo}" debe tener al menos un módulo.`;
                for (const mod of know.modulos) {
                    if (!mod.titulo || !mod.titulo.trim()) return `El módulo en el conocimiento "${know.titulo}" debe tener un título.`;
                    if (!mod.temas || mod.temas.length === 0) return `El módulo "${mod.titulo}" debe tener al menos un tema.`;
                    for (const tema of mod.temas) {
                        if (!tema.titulo || !tema.titulo.trim()) return `El tema en el módulo "${mod.titulo}" debe tener un título.`;
                        if (!tema.detalles || tema.detalles.length === 0) return `El tema "${tema.titulo}" debe tener al menos un detalle.`;
                        for (const det of tema.detalles) {
                            if (!det.titulo || !det.titulo.trim()) return `El detalle en el tema "${tema.titulo}" debe tener un título.`;
                        }
                    }
                }
            }
        }
    }
    return null;
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
