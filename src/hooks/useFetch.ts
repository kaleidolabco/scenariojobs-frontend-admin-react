/*  useFetch.ts
    Hook personalizado para realizar peticiones HTTP.
    Soporta métodos GET, POST, PATCH, PUT y DELETE.
    Gestiona cuerpos JSON y FormData, parámetros de consulta, encabezados y tokens de autorización. 
    Gestiona estados de carga y error.

    Devuelve los datos obtenidos, el estado de carga, el error (si existe),
    una función para realizar la petición y una función para limpiar los datos.

    Uso:
    const { data, loading, error, fetchData, clearData } = useFetch<T>();

    fetchData({
      url: 'https://api.example.com/data',
      method: 'POST',
      body: { key: 'value' },
      params: { search: 'query' },
      headers: { 'Custom-Header': 'value' },
      token: 'your-auth-token',
    })
    .then(responseData => {
      // Manejar datos de la respuesta
    })
    .catch(err => {
      // Manejar error
    });

    clearData(); // Limpia los datos almacenados

    O con async/await:
    try {
      const responseData = await fetchData({
        url: 'https://api.example.com/data',
        method: 'GET',
        params: { search: 'query' },
      });
      // Manejar datos de la respuesta
    } catch (err) {
      // Manejar error
    }

*/

import { useState, useCallback, useRef } from 'react';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface FetchOptions {
  url: string;
  method?: HttpMethod;
  body?: Record<string, any> | string | FormData | null;
  params?: Record<string, string | number | boolean | null | undefined>; 
  headers?: Record<string, string>;
  token?: string | null;
  mockData?: any; // Para simulación de backend
}

interface FetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  fetchData: (options: FetchOptions) => Promise<T>; // Devuelve una promesa con los datos
  clearData: () => void;
}

const DEFAULT_HEADERS = {
  // 'Content-Type': 'application/json',
  // 'User-Agent': 'insomnia/2023.5.8',
};

function useFetch<T>(): FetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (userOptions: FetchOptions) => {
    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setLoading(true);
    setError(null);
    // await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      // Preparar headers
      const headers: Record<string, string> = {
        ...DEFAULT_HEADERS,
        ...(userOptions.headers || {})
      };
      
      if (userOptions.token) {
        headers['Authorization'] = `Bearer ${userOptions.token}`;
      }

      // Solo si el body no es FormData, añadimos Content-Type JSON
      if (!(userOptions.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      // Preparar body
      let bodyContent: string | FormData | null = null;
      if (userOptions.body && userOptions.method !== 'GET') {
        bodyContent = typeof userOptions.body === 'string' 
          ? userOptions.body 
          : (userOptions.body instanceof FormData)
            ? userOptions.body
            : JSON.stringify(userOptions.body);
      }

      // Construir URL con query params si existen
      if ((userOptions.method === 'GET' || !userOptions.method) && userOptions.params) {
        // Fix: userOptions.url might be relative (e.g. '/api/users'), so we need a base
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
        const url = new URL(userOptions.url, baseUrl);
        
        Object.entries(userOptions.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            url.searchParams.append(key, String(value));
          }
        });
        
        // If the original URL was relative, we might want to keep it relative, 
        // but fetch accepts absolute URLs too. 
        // userOptions.url = url.toString() returns absolute.
        // To be safe for mockData matching (if relied on URL strings later), absolute is usually fine.
        userOptions.url = url.toString();
      }

      // SIMULACIÓN: Si se proporciona mockData, devolverlo emulando un retardo
      if (userOptions.mockData !== undefined) {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simula latencia de red

        if(userOptions.mockData.success === false){
          throw new Error(
            userOptions.mockData.message || `HTTP Error simulated`
          );
        }

        setData(userOptions.mockData);
        setLoading(false);
        return userOptions.mockData;
      }

      // Realizar petición
      const response = await fetch(userOptions.url, {
        method: userOptions.method || 'GET',
        headers,
        body: bodyContent,
        signal: controller.signal,
      });

      // Manejar errores HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `HTTP Error ${response.status}: ${response.statusText}`
        );
      }

      // Procesar respuesta
      const responseData = await response.json();
      setData(responseData);
      return responseData; // Devolvemos los datos directamente
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errorMessage = err.message || 'Error desconocido';
        setError(errorMessage);
        throw err; // Relanzamos el error para manejarlo con try/catch
      }
      return null as T; // En caso de aborto
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const clearData = useCallback(() => setData(null), []);

  return { data, loading, error, fetchData, clearData };
}

export default useFetch;

export interface FetchResponse<T = any> {
  success: boolean;
  message?: string | null;
  data: T | null;
}
