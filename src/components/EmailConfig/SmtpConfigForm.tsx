import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SmtpConfig } from '../../services/emailService';
import InputField from '../Common/Forms/InputField';
import NumberInputField from '../Common/Forms/NumberInputField';
import FormSection from '../Common/Forms/FormSection';

interface SmtpConfigFormProps {
    config: SmtpConfig;
    onSave: (c: SmtpConfig) => Promise<void>;
    saving: boolean;
    onTestConnection: () => void;
    testing: boolean;
    testResult: 'idle' | 'success' | 'error';
}

const SmtpConfigForm: React.FC<SmtpConfigFormProps> = ({
    config: initialConfig,
    onSave,
    saving,
    onTestConnection,
    testing,
    testResult,
}) => {
    const [form, setForm] = useState<SmtpConfig>(initialConfig);
    const [showPass, setShowPass] = useState(false);

    const setFormKey = (key: keyof SmtpConfig, value: any) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column: Form Fields */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <FormSection title="Configuración del Servidor" description="Parámetros de conexión para el envío de correos electrónicos">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <InputField
                                    label="Host del Servidor"
                                    placeholder="smtp.gmail.com"
                                    value={form.host}
                                    onChange={(e) => setFormKey('host', e.target.value)}
                                    required
                                />
                            </div>
                            <NumberInputField
                                label="Puerto"
                                placeholder="587"
                                value={form.puerto}
                                onChange={(val) => setFormKey('puerto', val)}
                                required
                            />
                        </div>
                        <div className="mt-4">
                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-3 py-1">
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary toggle-sm"
                                        checked={form.usar_tls}
                                        onChange={(e) => setFormKey('usar_tls', e.target.checked)}
                                    />
                                    <div>
                                        <span className="label-text font-medium">Usar TLS/STARTTLS</span>
                                        <p className="text-xs text-base-content/50">Recomendado para puertos 587 y 465</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </FormSection>

                    <FormSection title="Autenticación y Remitente" description="Credenciales de acceso y datos de identidad del remitente">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField
                                label="Usuario de autenticación"
                                type="email"
                                placeholder="notificaciones@empresa.com"
                                value={form.usuario}
                                onChange={(e) => setFormKey('usuario', e.target.value)}
                                required
                            />
                            <div className="space-y-2">
                                <label className="block">
                                    <span className="label-text font-medium">Contraseña</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        className="input input-bordered w-full focus:border-primary focus:ring-2 focus:ring-primary/20 text-base"
                                        placeholder="••••••••••••"
                                        value={form.password ?? ''}
                                        onChange={(e) => setFormKey('password', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-square btn-ghost border border-base-300"
                                        onClick={() => setShowPass(!showPass)}
                                        title={showPass ? 'Ocultar' : 'Mostrar'}
                                    >
                                        {showPass ? (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <span className="text-xs text-base-content/60">Dejar en blanco para conservar la contraseña actual</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <InputField
                                label="Nombre del remitente"
                                placeholder="ScenarioJobs"
                                value={form.remitente_nombre}
                                onChange={(e) => setFormKey('remitente_nombre', e.target.value)}
                                required
                            />
                            <InputField
                                label="Email del remitente"
                                type="email"
                                placeholder="no-reply@empresa.com"
                                value={form.remitente_email}
                                onChange={(e) => setFormKey('remitente_email', e.target.value)}
                                required
                            />
                        </div>
                    </FormSection>

                    <div className="flex justify-end">
                        <button
                            className={`btn btn-primary ${saving ? 'loading' : ''}`}
                            onClick={() => onSave(form)}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    <span className="ml-2">Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 mr-2 hidden md:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Guardar configuración</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right - Test connection & Summary */}
                <div className="flex flex-col gap-6">
                    <div className="card bg-base-100 border border-base-200">
                        <div className="card-body p-5 gap-3">
                            <h3 className="font-semibold text-sm">Probar conexión</h3>
                            <p className="text-xs text-base-content/50 leading-relaxed">
                                Verifica que la configuración SMTP sea correcta enviando un correo de prueba a la dirección del usuario.
                            </p>
                            <button
                                className={`btn btn-outline w-full`}
                                onClick={onTestConnection}
                                disabled={testing}
                            >
                                {testing && <span className="loading loading-spinner"></span>}
                                {testing ? 'Probando...' : 'Probar conexión SMTP'}
                            </button>

                            <AnimatePresence>
                                {testResult !== 'idle' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`alert alert-sm py-2 text-xs ${testResult === 'success' ? 'alert-success' : 'alert-error'}`}
                                    >
                                        {testResult === 'success'
                                            ? '✓ Conexión exitosa.'
                                            : '✗ No se pudo conectar. Revisa los datos.'}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="card bg-base-200/50 border border-base-200">
                        <div className="card-body p-5 gap-3">
                            <h3 className="font-semibold text-sm text-base-content/70">Resumen Actual</h3>
                            <div className="space-y-2">
                                {[
                                    { label: 'Host', value: form.host || '—' },
                                    { label: 'Puerto', value: form.puerto?.toString() || '—' },
                                    { label: 'TLS', value: form.usar_tls ? 'Habilitado' : 'Deshabilitado' },
                                    { label: 'Usuario', value: form.usuario || '—' },
                                    { label: 'Remitente', value: form.remitente_nombre || '—' },
                                    { label: 'Email', value: form.remitente_email || '—' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between items-center text-xs">
                                        <span className="text-base-content/50">{label}</span>
                                        <span className="font-mono font-medium text-base-content/80 max-w-[140px] truncate text-right" title={value}>
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="card bg-info/5 border border-info/20">
                        <div className="card-body p-4 gap-2">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs font-semibold text-info">Configuraciones comunes</span>
                            </div>
                            <ul className="text-xs text-base-content/60 space-y-1 list-none ml-0">
                                <li className="flex justify-between"><span>Gmail</span><span className="font-mono">smtp.gmail.com:587</span></li>
                                <li className="flex justify-between"><span>Outlook</span><span className="font-mono">smtp.office365.com:587</span></li>
                                <li className="flex justify-between"><span>SendGrid</span><span className="font-mono">smtp.sendgrid.net:587</span></li>
                                <li className="flex justify-between"><span>Mailgun</span><span className="font-mono">smtp.mailgun.org:587</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmtpConfigForm;
