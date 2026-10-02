import React, { ChangeEvent, FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

// Assets
import logo from '../../assets/logos/scenario-logo-color.png';

// Services
import { useAuthService } from '../../services/authService';

// Constants
import { ROUTES } from '../../constants/routes';

const ForgotPasswordPage: React.FC = () => {
    const { forgotPassword, loading } = useAuthService();

    const [correo, setCorreo] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const response = await forgotPassword(correo);

        // La respuesta exitosa es siempre la misma (anti-enumeración):
        // mostramos el mensaje genérico sin deducir si el correo existe.
        if (response && response.success) {
            setSubmitted(true);
        }
    };

    return (
        <div className="h-full flex items-center justify-center">
            <div className="card w-full max-w-sm shadow-lg bg-base-100">
                <div className="card-body">
                    <div className="flex justify-center mb-6">
                        <img src={logo} alt="Scenario Logo" className="h-16" />
                    </div>

                    {submitted ? (
                        <>
                            <h1 className="text-2xl font-bold text-center mb-2 text-primary">Revisa tu correo</h1>
                            <div className="alert alert-info text-sm shadow-sm mb-4">
                                <span>
                                    Si el correo está registrado, recibirás un enlace para restablecer
                                    tu contraseña.
                                </span>
                            </div>
                            <Link to={ROUTES.LOGIN} className="btn btn-primary w-full">
                                Volver al inicio de sesión
                            </Link>
                        </>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold text-center mb-2 text-primary">Recuperar acceso</h1>
                            <p className="text-center text-sm text-base-content/60 mb-4">
                                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer
                                tu contraseña.
                            </p>
                            <form onSubmit={handleSubmit}>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Correo electrónico</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="correo"
                                        value={correo}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setCorreo(e.target.value)}
                                        placeholder="usuario@empresa.com"
                                        className="input input-bordered w-full"
                                        required
                                    />
                                </div>

                                <div className="form-control mt-6">
                                    <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                                        {loading && <span className="loading loading-spinner"></span>}
                                        {loading ? 'Enviando...' : 'Enviar enlace'}
                                    </button>
                                </div>

                                <div className="text-center mt-4">
                                    <Link to={ROUTES.LOGIN} className="link link-hover text-sm">
                                        Volver al inicio de sesión
                                    </Link>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
