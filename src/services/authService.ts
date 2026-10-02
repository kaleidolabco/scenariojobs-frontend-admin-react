import { useCallback } from 'react';
import useFetch, { FetchResponse } from '../hooks/useFetch';

/**
 * Servicio de autenticación para flujos públicos (sin token Bearer):
 * activación de cuenta, solicitud de recuperación y restablecimiento
 * de contraseña. Ver docs/users.md sección 10.
 */
export const useAuthService = () => {
    const { fetchData, loading, error } = useFetch<FetchResponse>();

    const activateAccount = useCallback(async (token: string, contrasena: string): Promise<FetchResponse | null> => {
        try {
            const response = await fetchData({
                url: `${import.meta.env.VITE_API_URL}/auth/activar`,
                method: 'POST',
                body: { token, contrasena }
            });

            if (response?.success === false) {
                throw new Error(response.message || 'Error al activar la cuenta');
            }

            return response;
        } catch (error) {
            return null;
        }
    }, [fetchData]);

    const forgotPassword = useCallback(async (correo: string): Promise<FetchResponse | null> => {
        try {
            const response = await fetchData({
                url: `${import.meta.env.VITE_API_URL}/auth/olvide-contrasena`,
                method: 'POST',
                body: { correo }
            });

            if (response?.success === false) {
                throw new Error(response.message || 'Error al procesar la solicitud');
            }

            return response;
        } catch (error) {
            return null;
        }
    }, [fetchData]);

    const resetPasswordWithToken = useCallback(async (token: string, contrasena: string): Promise<FetchResponse | null> => {
        try {
            const response = await fetchData({
                url: `${import.meta.env.VITE_API_URL}/auth/restablecer-contrasena`,
                method: 'POST',
                body: { token, contrasena }
            });

            if (response?.success === false) {
                throw new Error(response.message || 'Error al restablecer la contraseña');
            }

            return response;
        } catch (error) {
            return null;
        }
    }, [fetchData]);

    return {
        activateAccount,
        forgotPassword,
        resetPasswordWithToken,
        loading,
        // Último mensaje de error del fetch (útil para distinguir token
        // expirado 400 vs token inválido 404 según el message del backend)
        error
    };
};

export default useAuthService;
