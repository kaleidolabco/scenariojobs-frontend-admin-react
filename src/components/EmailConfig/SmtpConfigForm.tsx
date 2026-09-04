import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SmtpConfig } from '../../services/emailService';
import InputField from '../Common/Forms/InputField';
import NumberInputField from '../Common/Forms/NumberInputField';
import FormSection from '../Common/Forms/FormSection';
import { Eye, EyeOff, Info, Check } from '../Common/Icon';
import Button from '../Common/Button';

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
                <div className="lg:col-span-2 flex flex-col gap-6 h-full">
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
                                    <Button
                                        variant="ghost"
                                        shape="square"
                                        className="border border-base-300"
                                        onClick={() => setShowPass(!showPass)}
                                        title={showPass ? 'Ocultar' : 'Mostrar'}
                                    >
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </Button>
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
                </div>

                {/* Right - Test connection & Summary */}
                <div className="grid gap-6 auto-rows-1fr h-full lg:sticky lg:top-6 lg:self-start">
                    <div className="card bg-base-100 border border-base-200">
                        <div className="card-body p-5 gap-3">
                            <h3 className="font-semibold text-sm">Probar conexión</h3>
                            <p className="text-xs text-base-content/50 leading-relaxed">
                                Verifica que la configuración SMTP sea correcta enviando un correo de prueba a la dirección del usuario.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={onTestConnection}
                                loading={testing}
                                disabled={testing}
                            >
                                {testing ? 'Probando...' : 'Probar conexión SMTP'}
                            </Button>

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
                                <Info size={16} className="text-info" />
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

            <div className="flex justify-end border-t border-base-200 pt-6">
                <Button
                    variant="primary"
                    onClick={() => onSave(form)}
                    loading={saving}
                    disabled={saving}
                >
                    {saving ? 'Guardando...' : (
                        <><Check size={16} className="mr-2 hidden md:inline" /> Guardar configuración</>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default SmtpConfigForm;
