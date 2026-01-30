export interface FetchResponse<T = any> {
    success: boolean;
    message: string | null;
    data: T | null;
}

export interface Pagination {
    total_items: number;
    total_paginas: number;
    cantidad_por_pagina: number;
    pagina_actual: number;
}

export const successMock = (data: any) => {
    return {
        success: true,
        message: 'Success',
        data: data
    }
}

export const errorMock = (message: string) => {
    return {
        success: false,
        message: message,
        data: null
    }
}