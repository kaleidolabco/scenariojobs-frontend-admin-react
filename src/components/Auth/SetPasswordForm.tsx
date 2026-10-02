import React, { ChangeEvent, FormEvent, useState } from 'react';

interface SetPasswordFormProps {
    onSubmit: (contrasena: string) => void;
    isLoading?: boolean;
    submitLabel: string;
    loadingLabel: string;
}

/**
 * Formulario compartido para definir una nueva contraseña
 * (activación de cuenta y restablecimiento de contraseña).
 * Valida localmente: mínimo 8 caracteres y confirmación coincidente.
 */
const SetPasswordForm: React.FC<SetPasswordFormProps> = ({
    onSubmit,
    isLoading = false,
    submitLabel,
    loadingLabel
}) => {
    const [formData, setFormData] = useState({ contrasena: '', confirmar: '' });
    const [localError, setLocalError] = useState<string | null>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setLocalError(null);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (formData.contrasena.length < 8) {
            setLocalError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        if (formData.contrasena !== formData.confirmar) {
            setLocalError('Las contraseñas no coinciden.');
            return;
        }

        onSubmit(formData.contrasena);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-control">
                <label className="label">
                    <span className="label-text">Nueva contraseña</span>
                </label>
                <input
                    type="password"
                    name="contrasena"
                    value={formData.contrasena}
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    className="input input-bordered w-full"
                    required
                    minLength={8}
                    autoComplete="new-password"
                />
            </div>

            <div className="form-control mt-3">
                <label className="label">
                    <span className="label-text">Confirmar contraseña</span>
                </label>
                <input
                    type="password"
                    name="confirmar"
                    value={formData.confirmar}
                    onChange={handleChange}
                    placeholder="Repita la contraseña"
                    className="input input-bordered w-full"
                    required
                    minLength={8}
                    autoComplete="new-password"
                />
            </div>

            {localError && (
                <div className="alert alert-error text-sm shadow-sm mt-4 py-2">
                    <span>{localError}</span>
                </div>
            )}

            <div className="form-control mt-6">
                <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                    {isLoading && <span className="loading loading-spinner"></span>}
                    {isLoading ? loadingLabel : submitLabel}
                </button>
            </div>
        </form>
    );
};

export default SetPasswordForm;
