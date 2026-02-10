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

// Mock Data Structure (Flat or Tree? Let's use Flat for API simulation, Tree for UI)
// Actually API usually returns flat list with parent_ids or a nested tree. 
// For this Mock, let's return a Tree because it's easier for the UI to consume directly if the backend supports it.
// If not, we will transform it. Let's assume Backend returns a Tree for the "Get Full Tree" endpoint.


const MOCK_ORG_TREE: OrgUnit[] = [
    {
        id: '1',
        nombre: 'Gerencia General',
        tipo: 'DIVISION',
        padre_id: null,
        descripcion: 'Máxima autoridad ejecutiva',
        position_count: 0,
        subnodos: [
            {
                id: '11',
                nombre: 'Dirección de Tecnología',
                tipo: 'AREA',
                padre_id: '1',
                descripcion: 'Responsable de toda la infraestructura tecnológica',
                position_count: 1,
                subnodos: [
                    {
                        id: '111',
                        nombre: 'Arquitectura',
                        tipo: 'DEPARTAMENTO',
                        padre_id: '11',
                        descripcion: 'Diseño y arquitectura de sistemas',
                        position_count: 1,
                        subnodos: []
                    },
                    {
                        id: '112',
                        nombre: 'Desarrollo de Producto',
                        tipo: 'DEPARTAMENTO',
                        padre_id: '11',
                        descripcion: 'Desarrollo de productos digitales',
                        position_count: 0,
                        subnodos: [
                             {
                                id: '1121',
                                nombre: 'Frontend Team',
                                tipo: 'EQUIPO',
                                padre_id: '112',
                                descripcion: 'Equipo especializado en desarrollo frontend',
                                position_count: 2,
                                subnodos: []
                             }
                        ]
                    }
                ]
            },
            {
                id: '12',
                nombre: 'Dirección de RRHH',
                tipo: 'AREA',
                padre_id: '1',
                descripcion: 'Gestión del talento humano',
                position_count: 0,
                subnodos: [
                    {
                        id: '121',
                        nombre: 'Talento y Cultura',
                        tipo: 'DEPARTAMENTO',
                        padre_id: '12',
                        descripcion: 'Desarrollo organizacional y cultura',
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
