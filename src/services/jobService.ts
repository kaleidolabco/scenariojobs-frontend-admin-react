import useFetch from '../hooks/useFetch';
import { FetchResponse } from './responseType';
import useUIStore from '../store/uiStore';
import useAuthStore from '../store/authStore';
import { JobFunction, createEmptyCapability, createEmptyKnowledge, createEmptyModule, createEmptyTopic, createEmptyDetail, generateId } from './functionService';

// Query params
export interface JobQueryParams {
    pagina?: number;
    items_por_pagina?: number;
    orden?: string;
    orden_por?: string;
    filtro?: string;
    nivel_jerarquico?: string;
}

// Types
export type SeniorityLevel = 'JUNIOR' | 'SEMI_SENIOR' | 'SENIOR' | 'LIDER' | 'GERENTE' | 'DIRECTOR';

export type SalaryPeriod = 'MENSUAL' | 'ANUAL' | 'HORARIO';

export interface CompetencyRequirement {
    competencia_id: string;
    competencia_nombre: string;
    nivel_esperado: number;
    peso_ponderacion?: number;
}

export interface Job {
    id: string;
    nombre: string;
    descripcion: string;
    nivel_jerarquico: SeniorityLevel;
    competencias_requeridas: CompetencyRequirement[];
    funciones: JobFunction[] | string[]; // Permite ambos formatos durante transición
    banda_salarial_min?: number;
    banda_salarial_max?: number;
    moneda?: string;
    moneda_salarial?: string;
    periodo_salarial?: SalaryPeriod;
}

/**
 * Convierte funciones legacy (strings) a la nueva estructura jerárquica
 * @param funcionesTexto Array de strings con funciones
 * @param tituloFuncionPrincipal Nombre de la función principal
 * @returns JobFunction[] - Estructura jerárquica
 */
export const convertLegacyFunctionsToHierarchical = (
    funcionesTexto: string[],
    tituloFuncionPrincipal?: string
): JobFunction[] => {
    if (!funcionesTexto || funcionesTexto.length === 0) {
        return [];
    }

    // Crear una única función principal que agrupe todas las funciones legacy
    const mainCapability = createEmptyCapability();
    mainCapability.titulo = 'Funciones Principales';
    mainCapability.descripcion = 'Funciones migradas desde el formato anterior';

    const knowledge = createEmptyKnowledge();
    knowledge.titulo = 'Funciones Operacionales';
    knowledge.tipoConocimiento = 'ESTANDAR';

    const module = createEmptyModule();
    module.titulo = 'Funciones Base';

    // Convertir cada string de función en un tema
    const topics = funcionesTexto.map(funcionTexto => {
        const tema = createEmptyTopic();
        tema.titulo = funcionTexto;
        
        // El detalle contiene la descripción completa
        const detail = createEmptyDetail();
        detail.titulo = 'Descripción';
        detail.descripcion = funcionTexto;
        tema.detalles = [detail];
        
        return tema;
    });

    module.temas = topics;
    knowledge.modulos = [module];
    mainCapability.conocimientos = [knowledge];

    const jobFunction: JobFunction = {
        id: generateId(),
        titulo: tituloFuncionPrincipal || 'Funciones del Cargo',
        descripcion: 'Función migrada automáticamente desde estructura legacy',
        capacidades: [mainCapability],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    return [jobFunction];
};

export const useJobService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();
    const { token } = useAuthStore();

    const getJobs = async (params?: JobQueryParams): Promise<FetchResponse | null> => {
        try {
            const backendParams: any = {};
            if (params?.pagina) backendParams.pagina = params.pagina;
            if (params?.items_por_pagina) backendParams.limite = params.items_por_pagina;
            if (params?.filtro) backendParams.busqueda = params.filtro;
            if (params?.nivel_jerarquico) backendParams.nivel_jerarquico = params.nivel_jerarquico;
            if (params?.orden_por) backendParams.ordenar_por = params.orden_por;
            if (params?.orden) backendParams.orden = params.orden;

            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/jobs`,
                params: backendParams,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener cargos');
            }

            if (response && response.success && response.data?.datos) {
                const mappedCargos = response.data.datos.map((j: any) => ({
                    ...j,
                    moneda: j.moneda_salarial || j.moneda || 'USD',
                    competencias_requeridas: j.competencias_requeridas || [],
                    funciones: j.funciones || []
                }));

                return {
                    ...response,
                    data: {
                        ...response.data,
                        cargos: mappedCargos,
                        paginacion: response.data.paginacion
                    }
                };
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const getJobById = async (id: string): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/jobs/${id}`,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response?.message || 'Error al obtener cargo');
            }

            if (response && response.success && response.data) {
                const j = response.data;
                const mappedJob = {
                    ...j,
                    moneda: j.moneda_salarial || j.moneda || 'USD',
                    competencias_requeridas: j.competencias_requeridas || [],
                    funciones: j.funciones || []
                };

                return {
                    ...response,
                    data: mappedJob
                };
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const createJob = async (job: Omit<Job, 'id'>): Promise<FetchResponse | null> => {
        try {
            const bodyData: any = {
                nombre: job.nombre,
                nivel_jerarquico: job.nivel_jerarquico,
                descripcion: job.descripcion,
                banda_salarial_min: job.banda_salarial_min,
                banda_salarial_max: job.banda_salarial_max,
                moneda_salarial: job.moneda || 'USD',
                periodo_salarial: job.periodo_salarial || 'MENSUAL'
            };

            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/jobs`,
                method: 'POST',
                body: bodyData,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response?.message || 'Error al crear cargo');
            }

            // Map and return response
            if (response && response.success && response.data) {
                const createdJob = response.data;
                const mappedJob = {
                    ...createdJob,
                    moneda: createdJob.moneda_salarial || createdJob.moneda || 'USD',
                    competencias_requeridas: createdJob.competencias_requeridas || [],
                    funciones: createdJob.funciones || []
                };

                return {
                    ...response,
                    data: mappedJob
                };
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const updateJob = async (id: string, job: Partial<Job>): Promise<FetchResponse | null> => {
        try {
            const bodyData: any = {};
            if (job.nombre !== undefined) bodyData.nombre = job.nombre;
            if (job.nivel_jerarquico !== undefined) bodyData.nivel_jerarquico = job.nivel_jerarquico;
            if (job.descripcion !== undefined) bodyData.descripcion = job.descripcion;
            if (job.banda_salarial_min !== undefined) bodyData.banda_salarial_min = job.banda_salarial_min;
            if (job.banda_salarial_max !== undefined) bodyData.banda_salarial_max = job.banda_salarial_max;
            if (job.moneda !== undefined) bodyData.moneda_salarial = job.moneda;
            if (job.periodo_salarial !== undefined) bodyData.periodo_salarial = job.periodo_salarial;

            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/jobs/${id}`,
                method: 'PATCH',
                body: bodyData,
                token: token || null
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response?.message || 'Error al actualizar cargo');
            }

            if (response && response.success && response.data) {
                const updatedJob = response.data;
                const mappedJob = {
                    ...updatedJob,
                    moneda: updatedJob.moneda_salarial || updatedJob.moneda || 'USD',
                    competencias_requeridas: updatedJob.competencias_requeridas || [],
                    funciones: updatedJob.funciones || []
                };

                return {
                    ...response,
                    data: mappedJob
                };
            }

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const deleteJob = async (id: string): Promise<boolean> => {
        try {
            const response = await fetchData({
                url: `${import.meta.env.VITE_API_URL}/jobs/${id}`,
                method: 'DELETE',
                token: token || null
            });

            if (response?.success === false) {
                throw new Error(response.message || 'Error al eliminar cargo');
            }

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return false;
        }
    };

    const syncJobCompetencies = async (id: string, competencies: CompetencyRequirement[]): Promise<boolean> => {
        try {
            const body = {
                competencias: competencies.map(c => ({
                    competencia_id: c.competencia_id,
                    nivel_esperado: c.nivel_esperado,
                    peso_ponderacion: c.peso_ponderacion || 1.0
                }))
            };

            const response = await fetchData({
                url: `${import.meta.env.VITE_API_URL}/jobs/${id}/competencies`,
                method: 'PATCH',
                body,
                token: token || null
            });

            if (response?.success === false) {
                throw new Error(response.message || 'Error al sincronizar competencias');
            }

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return false;
        }
    };

    const syncJobFunctions = async (id: string, funciones: JobFunction[]): Promise<boolean> => {
        try {
            // Clean function IDs if they are temporary/locally generated
            const cleanFunciones = funciones.map(f => {
                // Remove local IDs to avoid backend conflicts if backend auto-generates them,
                // but if backend needs them or allows them, send them. Let's send the full object
                // according to docs/jobs.md where the nested structure is specified.
                return {
                    titulo: f.titulo,
                    descripcion: f.descripcion,
                    capacidades: (f.capacidades || []).map(cap => ({
                        titulo: cap.titulo,
                        descripcion: cap.descripcion,
                        conocimientos: (cap.conocimientos || []).map(know => ({
                            titulo: know.titulo,
                            tipoConocimiento: know.tipoConocimiento,
                            fuentes: know.fuentes,
                            nivelDesarrollo: know.nivelDesarrollo,
                            origenEmpleadoId: know.origenEmpleadoId || null,
                            origenExternoReferencia: know.origenExternoReferencia || null,
                            modulos: (know.modulos || []).map(mod => ({
                                titulo: mod.titulo,
                                archivos: (mod.archivos || []).map(arc => ({
                                    nombre: arc.nombre,
                                    url: arc.archivoUrl || (arc as any).url || ''
                                })),
                                temas: (mod.temas || []).map(tem => ({
                                    titulo: tem.titulo,
                                    archivos: (tem.archivos || []).map(arc => ({
                                        nombre: arc.nombre,
                                        url: arc.archivoUrl || (arc as any).url || ''
                                    })),
                                    detalles: (tem.detalles || []).map(det => ({
                                        titulo: det.titulo,
                                        descripcion: det.descripcion
                                    }))
                                }))
                            }))
                        }))
                    }))
                };
            });

            const response = await fetchData({
                url: `${import.meta.env.VITE_API_URL}/jobs/${id}/functions`,
                method: 'PATCH',
                body: { funciones: cleanFunciones },
                token: token || null
            });

            if (response?.success === false) {
                throw new Error(response.message || 'Error al sincronizar funciones');
            }

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return false;
        }
    };

    const getJobByName = async (jobName?: string): Promise<Job | undefined> => {
        if (!jobName) return undefined;
        const res = await getJobs({ filtro: jobName, items_por_pagina: 100 });
        if (res && res.success && res.data?.cargos) {
            return res.data.cargos.find((j: Job) => j.nombre.toLowerCase() === jobName.toLowerCase());
        }
        return undefined;
    };

    return {
        getJobs,
        getJobById,
        createJob,
        updateJob,
        deleteJob,
        getJobByName,
        syncJobCompetencies,
        syncJobFunctions,
        loading,
        error
    };
};
