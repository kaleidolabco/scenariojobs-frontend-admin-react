import useFetch from '../hooks/useFetch';
import { FetchResponse } from './responseType';
import useUIStore from '../store/uiStore';
import useAuthStore from '../store/authStore';

export type EmailTemplateType =
    | 'BIENVENIDA'
    | 'RESTABLECER_CONTRASENA'
    | 'EVALUACION_ASIGNADA'
    | 'EVALUADOR_ASIGNADO'
    | 'RECORDATORIO_EVALUACION'
    | 'RESULTADO_EVALUACION'
    | 'PERSONALIZADO';

export interface EmailTemplate {
    id: string;
    nombre: string;
    tipo: EmailTemplateType;
    asunto: string;
    cuerpo: string;
    activo: boolean;
    descripcion?: string;
    variables?: string[];
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
    password_configurada?: boolean;
    actualizado_en?: string;
}

export interface GlobalTemplate {
    id: string;
    nombre: string;
    tipo: EmailTemplateType;
    asunto: string;
    cuerpo: string;
    descripcion?: string;
    variables?: string[];
    actualizado_en?: string;
}

export const EMAIL_TEMPLATE_TYPE_META: Record<EmailTemplateType, { label: string; color: string }> = {
    BIENVENIDA:              { label: 'Bienvenida',              color: 'info'     },
    RESTABLECER_CONTRASENA:  { label: 'Restablecer Contraseña',  color: 'accent'  },
    EVALUACION_ASIGNADA:     { label: 'Evaluación Asignada',     color: 'primary'  },
    EVALUADOR_ASIGNADO:      { label: 'Evaluador Asignado',      color: 'secondary'},
    RECORDATORIO_EVALUACION: { label: 'Recordatorio',            color: 'warning'  },
    RESULTADO_EVALUACION:    { label: 'Resultado',               color: 'success'  },
    PERSONALIZADO:           { label: 'Personalizado',           color: 'neutral'  },
};

export const TEMPLATE_PREVIEW_VARS: Record<string, string> = {
    nombre_usuario: 'Juan Pérez',
    nombre_evaluacion:  'Evaluación de Desempeño Q1 2025',
    fecha_limite:       '30 de mayo de 2025',
    link_evaluacion:    'https://app.scenariojobs.com/mis-evaluaciones/123',
    link_acceso:        'https://app.scenariojobs.com/login',
    nombre_empresa:     'Kaleido Lab',
    nombre_evaluador:   'Carlos Rodríguez',
    cargo_colaborador:  'Desarrollador Senior',
    periodo:            'Primer trimestre 2025',
};

export const useEmailService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();
    const { token } = useAuthStore();

    const getTemplates = async (params?: emailTemplateQueryParams): Promise<FetchResponse | null> => {
        try {
            const backendParams: Record<string, any> = {};

            if (params?.filtro) backendParams.busqueda = params.filtro;
            if (params?.tipo) backendParams.tipo = params.tipo;
            if (params?.activo !== undefined) backendParams.activo = params.activo;
            if (params?.pagina) backendParams.pagina = params.pagina;
            if (params?.items_por_pagina) backendParams.limite = params.items_por_pagina;
            if (params?.orden_por) backendParams.ordenar_por = params.orden_por;
            if (params?.orden) backendParams.orden = params.orden;

            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/emails/templates`,
                params: backendParams,
                token: token || null,
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener las plantillas');
            }

            if (response?.success && response.data) {
                return {
                    ...response,
                    data: {
                        plantillas: response.data.datos ?? [],
                        paginacion: response.data.paginacion ?? null,
                    },
                };
            }

            return response;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            openAlert(msg, 'error');
            return null;
        }
    };

    const getTemplateById = async (id: string): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/emails/templates/${id}`,
                token: token || null,
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener la plantilla');
            }

            if (response?.success && response.data) {
                return {
                    ...response,
                    data: {
                        plantilla: response.data,
                    },
                };
            }

            return response;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            openAlert(msg, 'error');
            return null;
        }
    };

    const createTemplate = async (data: Omit<EmailTemplate, 'id' | 'creado_en' | 'actualizado_en'>): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/emails/templates`,
                method: 'POST',
                body: data,
                token: token || null,
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al crear la plantilla');
            }

            if (response?.success && response.data) {
                return {
                    ...response,
                    data: {
                        plantilla: response.data,
                    },
                };
            }

            return response;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            openAlert(msg, 'error');
            return null;
        }
    };

    const updateTemplate = async (id: string, data: Partial<EmailTemplate>): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/emails/templates/${id}`,
                method: 'PATCH',
                body: data,
                token: token || null,
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al actualizar la plantilla');
            }

            if (response?.success && response.data) {
                return {
                    ...response,
                    data: {
                        plantilla: response.data,
                    },
                };
            }

            return response;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            openAlert(msg, 'error');
            return null;
        }
    };

    const toggleActive = async (id: string, activo: boolean): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/emails/templates/${id}/activo`,
                method: 'PATCH',
                body: { activo },
                token: token || null,
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al cambiar el estado de la plantilla');
            }

            return response;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            openAlert(msg, 'error');
            return null;
        }
    };

    const deleteTemplate = async (id: string): Promise<boolean> => {
        try {
            const response = await fetchData({
                url: `${import.meta.env.VITE_API_URL}/emails/templates/${id}`,
                method: 'DELETE',
                token: token || null,
            });

            if (response?.success === false) {
                throw new Error(response.message || 'Error al eliminar la plantilla');
            }

            return true;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            openAlert(msg, 'error');
            return false;
        }
    };

    const previewTemplate = async (id: string, variables?: Record<string, string>): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/emails/templates/${id}/preview`,
                method: 'POST',
                body: variables ? { variables } : {},
                token: token || null,
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al previsualizar la plantilla');
            }

            return response;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            openAlert(msg, 'error');
            return null;
        }
    };

    const getGlobalTemplates = async (): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/emails/global-templates`,
                token: token || null,
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener las plantillas globales');
            }

            if (response?.success && response.data) {
                return {
                    ...response,
                    data: {
                        plantillas: response.data,
                    },
                };
            }

            return response;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            openAlert(msg, 'error');
            return null;
        }
    };

    const getGlobalTemplateById = async (id: string): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/emails/global-templates/${id}`,
                token: token || null,
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener la plantilla global');
            }

            return response;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            openAlert(msg, 'error');
            return null;
        }
    };

    const importGlobalTemplate = async (id: string, nombre?: string): Promise<FetchResponse | null> => {
        try {
            const body = nombre ? { nombre } : {};
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/emails/global-templates/${id}/import`,
                method: 'POST',
                body,
                token: token || null,
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al importar la plantilla global');
            }

            if (response?.success && response.data) {
                return {
                    ...response,
                    data: {
                        plantilla: response.data,
                    },
                };
            }

            return response;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            openAlert(msg, 'error');
            return null;
        }
    };

    const getSmtpConfig = async (): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/emails/smtp`,
                token: token || null,
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener la configuración SMTP');
            }

            if (response?.success && response.data) {
                return {
                    ...response,
                    data: {
                        smtp: response.data,
                    },
                };
            }

            return response;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            openAlert(msg, 'error');
            return null;
        }
    };

    const updateSmtpConfig = async (config: Partial<SmtpConfig>): Promise<FetchResponse | null> => {
        try {

            // Elimino la propiedad password si está vacía para no enviarla al backend y no sobrescribir la contraseña existente
            if (config.password === '') {
                delete config.password;
            }

            // Elimino los campos que no deben ser enviados
            const { password_configurada, actualizado_en, ...configToSend } = config;
            // console.log('Config to send:', configToSend);
            
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/emails/smtp`,
                method: 'PUT',
                body: configToSend,
                token: token || null,
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al guardar la configuración SMTP');
            }

            if (response?.success && response.data) {
                return {
                    ...response,
                    data: {
                        smtp: response.data,
                    },
                };
            }

            return response;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            openAlert(msg, 'error');
            return null;
        }
    };

    const testSmtpConnection = async (params?: { correo_destino?: string; solo_verificar?: boolean; plantilla_id?: string; asunto_personalizado?: string }): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: `${import.meta.env.VITE_API_URL}/emails/smtp/test`,
                method: 'POST',
                body: params ?? {},
                token: token || null,
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al probar la conexión SMTP');
            }

            return response;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            openAlert(msg, 'error');
            return null;
        }
    };

    return {
        getTemplates,
        getTemplateById,
        createTemplate,
        updateTemplate,
        toggleActive,
        deleteTemplate,
        previewTemplate,
        getGlobalTemplates,
        getGlobalTemplateById,
        importGlobalTemplate,
        getSmtpConfig,
        updateSmtpConfig,
        testSmtpConnection,
        loading,
        error,
    };
};
