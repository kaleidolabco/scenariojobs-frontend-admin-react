import useFetch from '../hooks/useFetch';
import { FetchResponse, successMock } from './responseType';
import useUIStore from '../store/uiStore';

// Types
export type OrgUnitType = 'DIVISION' | 'AREA' | 'DEPARTAMENTO' | 'EQUIPO' | 'CELULA' | 'OTRO';

export interface OrgUnit {
    id: string;
    nombre: string;
    tipo: OrgUnitType;
    padre_id?: string | null;
    descripcion?: string;
    subnodos?: OrgUnit[]; // Recursive structure for UI
    nivel?: number; // Helper for indentation if needed
    position_count?: number; // Number of positions in this unit
}

// Organizational Hierarchy based on CSV data
const MOCK_ORG_TREE: OrgUnit[] = [
    {
        id: 'org_1',
        nombre: 'Gerencia General',
        tipo: 'DIVISION',
        padre_id: null,
        descripcion: 'Máxima autoridad ejecutiva de la organización',
        position_count: 1,
        subnodos: [
            // ADMINISTRACION
            {
                id: 'org_10',
                nombre: 'Dirección Administrativa',
                tipo: 'AREA',
                padre_id: 'org_1',
                descripcion: 'Responsable de la gestión administrativa, financiera y de recursos',
                position_count: 1,
                subnodos: [
                    {
                        id: 'org_101',
                        nombre: 'Talento Humano',
                        tipo: 'DEPARTAMENTO',
                        padre_id: 'org_10',
                        descripcion: 'Gestión del talento, reclutamiento y desarrollo organizacional',
                        position_count: 1,
                        subnodos: []
                    },
                    {
                        id: 'org_102',
                        nombre: 'Contabilidad',
                        tipo: 'DEPARTAMENTO',
                        padre_id: 'org_10',
                        descripcion: 'Gestión contable y financiera',
                        position_count: 1,
                        subnodos: []
                    },
                    {
                        id: 'org_103',
                        nombre: 'Gestión Organizacional',
                        tipo: 'DEPARTAMENTO',
                        padre_id: 'org_10',
                        descripcion: 'Desarrollo organizacional, cultura y procesos',
                        position_count: 2,
                        subnodos: []
                    },
                    {
                        id: 'org_104',
                        nombre: 'Servicios Generales',
                        tipo: 'DEPARTAMENTO',
                        padre_id: 'org_10',
                        descripcion: 'Servicios de apoyo y mantenimiento',
                        position_count: 1,
                        subnodos: []
                    },
                    {
                        id: 'org_105',
                        nombre: 'Administración',
                        tipo: 'DEPARTAMENTO',
                        padre_id: 'org_10',
                        descripcion: 'Procesos administrativos generales',
                        position_count: 1,
                        subnodos: []
                    }
                ]
            },
            // COMERCIAL
            {
                id: 'org_20',
                nombre: 'Dirección Comercial',
                tipo: 'AREA',
                padre_id: 'org_1',
                descripcion: 'Liderazgo de la estrategia comercial y de ventas',
                position_count: 1,
                subnodos: [
                    {
                        id: 'org_201',
                        nombre: 'Preventa',
                        tipo: 'DEPARTAMENTO',
                        padre_id: 'org_20',
                        descripcion: 'Soporte técnico en procesos de preventa',
                        position_count: 1,
                        subnodos: []
                    },
                    {
                        id: 'org_202',
                        nombre: 'Marketing',
                        tipo: 'DEPARTAMENTO',
                        padre_id: 'org_20',
                        descripcion: 'Estrategias de marketing y comunicación',
                        position_count: 1,
                        subnodos: []
                    },
                    {
                        id: 'org_203',
                        nombre: 'Cuentas Clave',
                        tipo: 'DEPARTAMENTO',
                        padre_id: 'org_20',
                        descripcion: 'Gestión de clientes estratégicos',
                        position_count: 1,
                        subnodos: []
                    }
                ]
            },
            // OPERACIONES
            {
                id: 'org_30',
                nombre: 'Dirección de Operaciones',
                tipo: 'AREA',
                padre_id: 'org_1',
                descripcion: 'Gestión de operaciones técnicas y de servicio',
                position_count: 0,
                subnodos: [
                    {
                        id: 'org_301',
                        nombre: 'Desarrollo',
                        tipo: 'DEPARTAMENTO',
                        padre_id: 'org_30',
                        descripcion: 'Desarrollo de software y aplicaciones',
                        position_count: 0,
                        subnodos: [
                            {
                                id: 'org_3011',
                                nombre: 'Desarrollo Fullstack',
                                tipo: 'EQUIPO',
                                padre_id: 'org_301',
                                descripcion: 'Equipo de desarrollo fullstack',
                                position_count: 15,
                                subnodos: []
                            },
                            {
                                id: 'org_3012',
                                nombre: 'QA',
                                tipo: 'EQUIPO',
                                padre_id: 'org_301',
                                descripcion: 'Equipo de aseguramiento de calidad',
                                position_count: 1,
                                subnodos: []
                            }
                        ]
                    },
                    {
                        id: 'org_302',
                        nombre: 'Infraestructura',
                        tipo: 'DEPARTAMENTO',
                        padre_id: 'org_30',
                        descripcion: 'Gestión de infraestructura tecnológica',
                        position_count: 0,
                        subnodos: [
                            {
                                id: 'org_3021',
                                nombre: 'AWS',
                                tipo: 'EQUIPO',
                                padre_id: 'org_302',
                                descripcion: 'Infraestructura cloud en AWS',
                                position_count: 2,
                                subnodos: []
                            },
                            {
                                id: 'org_3022',
                                nombre: 'Ciberseguridad',
                                tipo: 'EQUIPO',
                                padre_id: 'org_302',
                                descripcion: 'Seguridad informática',
                                position_count: 1,
                                subnodos: []
                            }
                        ]
                    },
                    {
                        id: 'org_303',
                        nombre: 'Soporte',
                        tipo: 'DEPARTAMENTO',
                        padre_id: 'org_30',
                        descripcion: 'Soporte técnico y atención a usuarios',
                        position_count: 4,
                        subnodos: [
                            {
                                id: 'org_3031',
                                nombre: 'Mesa de Ayuda',
                                tipo: 'EQUIPO',
                                padre_id: 'org_303',
                                descripcion: 'Atención de primer nivel',
                                position_count: 9,
                                subnodos: []
                            },
                            {
                                id: 'org_3032',
                                nombre: 'Help Desk',
                                tipo: 'EQUIPO',
                                padre_id: 'org_303',
                                descripcion: 'Soporte técnico especializado',
                                position_count: 2,
                                subnodos: []
                            },
                            {
                                id: 'org_3033',
                                nombre: 'Soporte Especializado',
                                tipo: 'EQUIPO',
                                padre_id: 'org_303',
                                descripcion: 'Soporte de alto nivel',
                                position_count: 2,
                                subnodos: []
                            }
                        ]
                    },
                    {
                        id: 'org_304',
                        nombre: 'Proyectos',
                        tipo: 'DEPARTAMENTO',
                        padre_id: 'org_30',
                        descripcion: 'Gestión de proyectos tecnológicos',
                        position_count: 3,
                        subnodos: []
                    },
                    {
                        id: 'org_305',
                        nombre: 'Soluciones',
                        tipo: 'DEPARTAMENTO',
                        padre_id: 'org_30',
                        descripcion: 'Diseño y entrega de soluciones',
                        position_count: 1,
                        subnodos: []
                    },
                    {
                        id: 'org_306',
                        nombre: 'Operaciones',
                        tipo: 'DEPARTAMENTO',
                        padre_id: 'org_30',
                        descripcion: 'Gestión operativa',
                        position_count: 4,
                        subnodos: []
                    }
                ]
            },
            // DIAGEO (Cliente específico)
            {
                id: 'org_40',
                nombre: 'Dirección DIAGEO',
                tipo: 'AREA',
                padre_id: 'org_1',
                descripcion: 'Operaciones dedicadas al cliente DIAGEO',
                position_count: 0,
                subnodos: [
                    {
                        id: 'org_401',
                        nombre: 'Análisis de Datos',
                        tipo: 'DEPARTAMENTO',
                        padre_id: 'org_40',
                        descripcion: 'Análisis de datos para DIAGEO',
                        position_count: 1,
                        subnodos: []
                    }
                ]
            }
        ]
    }
];

export const useOrgUnitService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();

    // GET Tree
    const getOrgTree = async (): Promise<FetchResponse | null> => {
        try {
            const response = (await fetchData({
                url: '/api/org-units/tree',
                mockData: successMock({ unidades: MOCK_ORG_TREE })
            })) as FetchResponse | null;

            if (response?.success === false) {
                throw new Error(response.message || 'Error al obtener la estructura');
            }
            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    // CREATE
    const createUnit = async (unit: Omit<OrgUnit, 'id' | 'children'>): Promise<FetchResponse | null> => {
        try {
            // Mock logic: Create ID and return it
            const newUnit = { ...unit, id: Math.random().toString(36).substr(2, 9), children: [] };
            return (await fetchData({
                url: '/api/org-units',
                method: 'POST',
                body: unit,
                mockData: successMock({ unidad: newUnit })
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    // UPDATE
    const updateUnit = async (id: string, unit: Partial<OrgUnit>): Promise<FetchResponse | null> => {
        try {
            return (await fetchData({
                url: `/api/org-units/${id}`,
                method: 'PUT',
                body: unit,
                mockData: successMock({ unidad: { ...unit, id } })
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    // DELETE
    const deleteUnit = async (id: string): Promise<boolean> => {
        try {
            await fetchData({
                url: `/api/org-units/${id}`,
                method: 'DELETE',
                mockData: successMock({ success: true })
            });
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return false;
        }
    };

    // GET Unit by ID (with details)
    const getUnitById = async (id: string): Promise<FetchResponse | null> => {
        try {
            // Helper to find unit in tree
            const findUnit = (units: OrgUnit[], targetId: string): OrgUnit | null => {
                for (const unit of units) {
                    if (unit.id === targetId) return unit;
                    if (unit.subnodos) {
                        const found = findUnit(unit.subnodos, targetId);
                        if (found) return found;
                    }
                }
                return null;
            };

            const unit = findUnit(MOCK_ORG_TREE, id);
            if (!unit) {
                throw new Error('Unidad no encontrada');
            }

            return (await fetchData({
                url: `/api/org-units/${id}`,
                mockData: successMock({ unidad: unit })
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    return {
        getOrgTree,
        getUnitById,
        createUnit,
        updateUnit,
        deleteUnit,
        loading,
        error
    };
};
