import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

// Assets
import logo from '../../assets/logos/scenario-logo-color.png';

// Services & Hooks
import { useAuthService } from '../../services/authService';

// Components
import SetPasswordForm from '../../components/Auth/SetPasswordForm';

// Constants
import { ROUTES } from '../../constants/routes';

type ViewStatus = 'form' | 'success' | 'expired' | 'invalid';

const EXPIRED_MESSAGE = 'token de activación ha expirado';

const ActivateAccountPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const { activateAccount, loading, error } = useAuthService();
    const [status, setStatus] = useState<ViewStatus>(token ? 'form' : 'invalid');

    const handleSubmit = async (contrasena: string) => {
        const response = await activateAccount(token, contrasena);

        if (response && response.success) {
            setStatus('success');
            return;
        }

        // Errores documentados (docs/users.md §10.5):
        // 400 -> token expirado | 404 -> token inválido/ya usado
        if (error && error.toLowerCase().includes(EXPIRED_MESSAGE)) {
            setStatus('expired');
        } else {
            setStatus('invalid');
        }
    };

    return (
        <div className="h-full flex items-center justify-center">
            <div className="card w-full max-w-sm shadow-lg bg-base-100">
                <div className="card-body">
                    <div className="flex justify-center mb-6">
                        <img src={logo} alt="Scenario Logo" className="h-16" />
                    </div>

                    {status === 'form' && (
                        <>
                            <h1 className="text-2xl font-bold text-center mb-2 text-primary">Activa tu cuenta</h1>
                            <p className="text-center text-sm text-base-content/60 mb-4">
                                Crea tu contraseña para completar la activación.
                            </p>
                            <SetPasswordForm
                                onSubmit={handleSubmit}
                                isLoading={loading}
                                submitLabel="Activar mi cuenta"
                                loadingLabel="Activando..."
                            />
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="alert alert-success text-sm shadow-sm mb-4">
                                <span>Cuenta activada exitosamente. Ya puedes iniciar sesión.</span>
                            </div>
                            <Link to={ROUTES.LOGIN} className="btn btn-primary w-full">
                                Ir al inicio de sesión
                            </Link>
                        </>
                    )}

                    {status === 'expired' && (
                        <>
                            <div className="alert alert-warning text-sm shadow-sm mb-4">
                                <span>
                                    El enlace de activación ha expirado. Solicita a un administrador que
                                    reenvíe el correo de activación desde la gestión de usuarios.
                                </span>
                            </div>
                            <Link to={ROUTES.LOGIN} className="btn btn-ghost w-full">
                                Volver al inicio de sesión
                            </Link>
                        </>
                    )}

                    {status === 'invalid' && (
                        <>
                            <div className="alert alert-error text-sm shadow-sm mb-4">
                                <span>
                                    El enlace de activación no es válido o ya fue utilizado.
                                    Contacta al administrador de tu organización.
                                </span>
                            </div>
                            <Link to={ROUTES.LOGIN} className="btn btn-ghost w-full">
                                Volver al inicio de sesión
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivateAccountPage;
