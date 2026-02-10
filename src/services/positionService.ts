import useFetch from '../hooks/useFetch';
import { FetchResponse, successMock } from './responseType';
import useUIStore from '../store/uiStore';

// Query params
export interface PositionQueryParams {
    pagina?: number;
    items_por_pagina?: number;
    orden?: string;
    orden_por?: string;
    filtro?: string;
    unidad_id?: string;
    estado?: 'VACANTE' | 'OCUPADO';
}

// Types
export type PositionStatus = 'VACANTE' | 'OCUPADO';

export interface Position {
    id: string;
    nombre: string;
    unidad_id: string;
    unidad_nombre?: string; // For display
    cargo_id: string;
    cargo_nombre?: string; // For display
    jefe_puesto_id?: string | null;
    jefe_puesto_nombre?: string; // For display
    persona_id?: string | null;
    persona_nombre?: string; // For display
    estado: PositionStatus;
    fecha_creacion?: string;
}

// Mock Data
const MOCK_POSITIONS: Position[] = [
    {
        id: 'p1',
        nombre: 'Gerente de Tecnología',
        unidad_id: '11',
        unidad_nombre: 'Dirección de Tecnología',
        cargo_id: '3',
        cargo_nombre: 'Gerente de Tecnología',
        jefe_puesto_id: null,
        persona_id: 'per1',
        persona_nombre: 'María González',
        estado: 'OCUPADO',
        fecha_creacion: '2024-01-15'
    },
    {
        id: 'p2',
        nombre: 'Arquitecto de Software Senior',
        unidad_id: '111',
        unidad_nombre: 'Arquitectura',
        cargo_id: '1',
        cargo_nombre: 'Desarrollador Full Stack Senior',
        jefe_puesto_id: 'p1',
        jefe_puesto_nombre: 'Gerente de Tecnología',
        persona_id: 'per2',
        persona_nombre: 'Carlos Ramírez',
        estado: 'OCUPADO',
        fecha_creacion: '2024-02-01'
    },
    {
        id: 'p3',
        nombre: 'Desarrollador Frontend A',
        unidad_id: '1121',
        unidad_nombre: 'Frontend Team',
        cargo_id: '1',
        cargo_nombre: 'Desarrollador Full Stack Senior',
        jefe_puesto_id: 'p2',
        jefe_puesto_nombre: 'Arquitecto de Software Senior',
        persona_id: null,
        estado: 'VACANTE',
        fecha_creacion: '2024-03-10'
    },
    {
        id: 'p4',
        nombre: 'Analista de Talento',
        unidad_id: '121',
        unidad_nombre: 'Talento y Cultura',
        cargo_id: '2',
        cargo_nombre: 'Analista de Recursos Humanos',
        jefe_puesto_id: null,
        persona_id: 'per3',
        persona_nombre: 'Ana Martínez',
        estado: 'OCUPADO',
        fecha_creacion: '2024-01-20'
    },
    {
        id: 'p5',
        nombre: 'Desarrollador Frontend B',
        unidad_id: '1121',
        unidad_nombre: 'Frontend Team',
        cargo_id: '1',
        cargo_nombre: 'Desarrollador Full Stack Senior',
        jefe_puesto_id: 'p2',
        jefe_puesto_nombre: 'Arquitecto de Software Senior',
        persona_id: null,
        estado: 'VACANTE',
        fecha_creacion: '2024-03-15'
    }
];

export const usePositionService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();
    const { openAlert } = useUIStore();

    const getPositions = async (params?: PositionQueryParams): Promise<FetchResponse | null> => {
        try {
            let filteredPositions = [...MOCK_POSITIONS];

            // Apply filters
            if (params?.unidad_id) {
                filteredPositions = filteredPositions.filter(p => p.unidad_id === params.unidad_id);
            }
            if (params?.estado) {
                filteredPositions = filteredPositions.filter(p => p.estado === params.estado);
            }
            if (params?.filtro) {
                const searchTerm = params.filtro.toLowerCase();
                filteredPositions = filteredPositions.filter(p =>
                    p.nombre.toLowerCase().includes(searchTerm) ||
                    p.cargo_nombre?.toLowerCase().includes(searchTerm) ||
                    p.persona_nombre?.toLowerCase().includes(searchTerm)
                );
            }

            // Sorting
            if (params?.orden_por) {
                filteredPositions.sort((a, b) => {
                    const aVal = (a as any)[params.orden_por!] || '';
                    const bVal = (b as any)[params.orden_por!] || '';
                    const comparison = aVal > bVal ? 1 : -1;
                    return params.orden === 'desc' ? -comparison : comparison;
                });
            }

            // Pagination
            const page = params?.pagina || 1;
            const pageSize = params?.items_por_pagina || 10;
            const start = (page - 1) * pageSize;
            const paginatedPositions = filteredPositions.slice(start, start + pageSize);

            const response = successMock({
                puestos: paginatedPositions,
                paginacion: {
                    total_items: filteredPositions.length,
                    total_paginas: Math.ceil(filteredPositions.length / pageSize),
                    cantidad_por_pagina: pageSize,
                    pagina_actual: page
                }
            });

            return (await fetchData({
                url: '/api/positions',
                body: params,
                mockData: response
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const getPositionById = async (id: string): Promise<FetchResponse | null> => {
        try {
            const position = MOCK_POSITIONS.find(p => p.id === id);
            if (!position) {
                throw new Error('Puesto no encontrado');
            }

            return (await fetchData({
                url: `/api/positions/${id}`,
                mockData: successMock({ puesto: position })
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const createPosition = async (position: Omit<Position, 'id' | 'estado'>): Promise<FetchResponse | null> => {
        try {
            const newPosition = {
                ...position,
                id: Math.random().toString(36).substr(2, 9),
                estado: 'VACANTE' as PositionStatus
            };
            return (await fetchData({
                url: '/api/positions',
                method: 'POST',
                body: position,
                mockData: successMock({ puesto: newPosition })
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const updatePosition = async (id: string, position: Partial<Position>): Promise<FetchResponse | null> => {
        try {
            return (await fetchData({
                url: `/api/positions/${id}`,
                method: 'PUT',
                body: position,
                mockData: successMock({ puesto: { ...position, id } })
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    const deletePosition = async (id: string): Promise<boolean> => {
        try {
            await fetchData({
                url: `/api/positions/${id}`,
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

    const assignPerson = async (positionId: string, personId: string, startDate: string): Promise<FetchResponse | null> => {
        try {
            return (await fetchData({
                url: `/api/positions/${positionId}/assign`,
                method: 'POST',
                body: { persona_id: personId, fecha_inicio: startDate },
                mockData: successMock({ success: true })
            })) as FetchResponse | null;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            openAlert(errorMessage, 'error');
            return null;
        }
    };

    return {
        getPositions,
        getPositionById,
        createPosition,
        updatePosition,
        deletePosition,
        assignPerson,
        loading,
        error
    };
};
