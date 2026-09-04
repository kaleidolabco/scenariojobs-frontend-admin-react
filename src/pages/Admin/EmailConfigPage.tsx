import React, { useEffect, useState } from 'react';
import { Mail, Copy, Plus, Folder, Check, Settings, XCircle } from '../../components/Common/Icon';
import Button from '../../components/Common/Button';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../../components/Common/PageContainer';
import GenericModal from '../../components/Common/GenericModal';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import Tabs from '../../components/Common/Tabs';
import FilterBar, { FilterDefinition } from '../../components/Common/FilterBar';
import { StatsGrid } from '../../components/Common/StatsCard';
import EmailTemplateForm from '../../components/EmailConfig/EmailTemplateForm';
import SmtpConfigForm from '../../components/EmailConfig/SmtpConfigForm';
import TemplateCard from '../../components/EmailConfig/TemplateCard';
import TemplatePreviewModal from '../../components/EmailConfig/TemplatePreviewModal';
import { Pagination } from '../../services/responseType';
import {
    useEmailService,
    EmailTemplate,
    EmailTemplateType,
    SmtpConfig,
    GlobalTemplate,
    EMAIL_TEMPLATE_TYPE_META,
    emailTemplateQueryParams,
} from '../../services/emailService';

type TabId = 'plantillas' | 'smtp';

type TemplateFormData = Omit<EmailTemplate, 'id' | 'creado_en' | 'actualizado_en'>;

const ITEMS_PER_PAGE = 9;

const EmailConfigPage: React.FC = () => {
    const {
        getTemplates,
        getTemplateById,
        getSmtpConfig,
        createTemplate,
        updateTemplate,
        toggleActive,
        deleteTemplate,
        updateSmtpConfig,
        getGlobalTemplates,
        importGlobalTemplate,
        testSmtpConnection,
        loading,
    } = useEmailService();

    // Tabs
    const [activeTab, setActiveTab] = useState<TabId>('plantillas');

    // Templates State
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [queryParams, setQueryParams] = useState<emailTemplateQueryParams>({
        pagina: 1,
        items_por_pagina: ITEMS_PER_PAGE,
        tipo: undefined,
        filtro: '',
        activo: undefined,
    });

    // Modals
    const [editorOpen, setEditorOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

    // Global templates
    const [globalModalOpen, setGlobalModalOpen] = useState(false);
    const [globalTemplates, setGlobalTemplates] = useState<GlobalTemplate[]>([]);
    const [loadingGlobal, setLoadingGlobal] = useState(false);
    const [importingId, setImportingId] = useState<string | null>(null);

    // SMTP
    const [smtpConfig, setSmtpConfig] = useState<SmtpConfig | null>(null);
    const [savingSmtp, setSavingSmtp] = useState(false);
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [testingConn, setTestingConn] = useState(false);
    const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');

    const updateQueryParams = (updates: Partial<emailTemplateQueryParams>) =>
        setQueryParams((prev) => ({ ...prev, ...updates }));

    const loadTemplates = async () => {
        const params = Object.fromEntries(
            Object.entries(queryParams).filter(([, v]) => v !== undefined && v !== '' && v !== null)
        );
        const res = await getTemplates(params);
        if (res?.success) {
            setTemplates(res.data?.plantillas ?? []);
            setPagination(res.data?.paginacion ?? null);
        }
    };

    useEffect(() => {
        const t = setTimeout(() => updateQueryParams({ filtro: searchInput, pagina: 1 }), 500);
        return () => clearTimeout(t);
    }, [searchInput]);

    const loadSmtp = async () => {
        const res = await getSmtpConfig();
        if (res?.success) setSmtpConfig(res.data?.smtp ?? null);
    };

    useEffect(() => { loadTemplates(); }, [queryParams]);
    useEffect(() => { if (activeTab === 'smtp') loadSmtp(); }, [activeTab]);

    const loadGlobalTemplates = async () => {
        setLoadingGlobal(true);
        const res = await getGlobalTemplates();
        if (res?.success) {
            setGlobalTemplates(res.data?.plantillas ?? []);
        }
        setLoadingGlobal(false);
    };

    const openGlobalModal = () => {
        setGlobalModalOpen(true);
        loadGlobalTemplates();
    };

    const handleImport = async (gt: GlobalTemplate) => {
        setImportingId(gt.id);
        const res = await importGlobalTemplate(gt.id);
        if (res?.success) {
            setGlobalModalOpen(false);
            setImportingId(null);
            loadTemplates();
        } else {
            setImportingId(null);
        }
    };

    const handleEdit = async (t: EmailTemplate) => {
        const res = await getTemplateById(t.id);
        if (res?.success) {
            setSelectedTemplate(res.data?.plantilla ?? t);
        } else {
            setSelectedTemplate(t);
        }
        setEditorOpen(true);
    };

    const handleCreate = () => {
        setSelectedTemplate(null);
        setEditorOpen(true);
    };

    const handlePreview = async (t: EmailTemplate) => {
        const res = await getTemplateById(t.id);
        if (res?.success) {
            setSelectedTemplate(res.data?.plantilla ?? t);
        } else {
            setSelectedTemplate(t);
        }
        setPreviewOpen(true);
    };

    const handleDeleteClick = (t: EmailTemplate) => {
        setSelectedTemplate(t);
        setDeleteOpen(true);
    };

    const handleToggleActive = async (t: EmailTemplate) => {
        await toggleActive(t.id, !t.activo);
        loadTemplates();
    };

    const handleSaveTemplate = async (data: TemplateFormData) => {
        setSavingTemplate(true);
        try {
            let res;
            if (selectedTemplate) {
                res = await updateTemplate(selectedTemplate.id, data);
            } else {
                res = await createTemplate(data);
            }
            if (res?.success) {
                setEditorOpen(false);
                setSelectedTemplate(null);
                loadTemplates();
            }
        } finally {
            setSavingTemplate(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedTemplate) return;
        const ok = await deleteTemplate(selectedTemplate.id);
        if (ok) {
            setDeleteOpen(false);
            setSelectedTemplate(null);
            loadTemplates();
        }
    };

    const handleSaveSmtp = async (config: SmtpConfig) => {
        setSavingSmtp(true);
        try {
            const res = await updateSmtpConfig(config);
            if (res?.success) setSmtpConfig(res.data?.smtp ?? config);
        } finally {
            setSavingSmtp(false);
        }
    };

    const handleTestConnection = async () => {
        setTestingConn(true);
        setTestResult('idle');
        const res = await testSmtpConnection({ solo_verificar: true });
        if (res?.success) {
            setTestResult('success');
        } else {
            setTestResult('error');
        }
        setTestingConn(false);
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || (pagination && page > pagination.total_paginas)) return;
        updateQueryParams({ pagina: page });
    };

    const activeCount = templates.filter((t) => t.activo).length;
    const inactiveCount = templates.filter((t) => !t.activo).length;

    const typeOptions = (Object.entries(EMAIL_TEMPLATE_TYPE_META) as [EmailTemplateType, { label: string }][]).map(
        ([key, { label }]) => ({ value: key, label })
    );

    const filterDefinitions: FilterDefinition[] = [
        {
            key: 'tipo',
            label: 'Tipo',
            options: typeOptions,
        },
        {
            key: 'activo',
            label: 'Estado',
            options: [
                { value: 'true', label: 'Activo' },
                { value: 'false', label: 'Inactivo' },
            ],
        },
    ];

    const activeFilters = {
        ...(queryParams.tipo && { tipo: queryParams.tipo }),
        ...(queryParams.activo !== undefined && { activo: queryParams.activo ? 'true' : 'false' }),
    };

    const handleFilterChange = (key: string, value: string | number) => {
        if (value === '') {
            updateQueryParams({ [key]: undefined, pagina: 1 });
            return;
        }
        if (key === 'tipo') {
            updateQueryParams({ tipo: value as EmailTemplateType, pagina: 1 });
        }
        if (key === 'activo') {
            updateQueryParams({ activo: value === 'true', pagina: 1 });
        }
    };

    const clearFilters = () => {
        setSearchInput('');
        updateQueryParams({ tipo: undefined, activo: undefined, filtro: '', pagina: 1 });
    };

    return (
        <PageContainer
            title="Configuración de Correos"
            subtitle="Administra las plantillas de notificación y los parámetros del servidor de correo saliente."
        >
            {/* ── Tabs ── */}
            <Tabs
                tabs={[
                    {
                        id: 'plantillas',
                        label: 'Plantillas',
                        icon: <Mail size={16} />,
                    },
                    {
                        id: 'smtp',
                        label: 'Servidor SMTP',
                        icon: <Settings size={16} />,
                    },
                ]}
                activeTab={activeTab}
                onChange={(id) => setActiveTab(id as TabId)}
                variant="bordered"
            />

            {/* ── Tab: Plantillas ── */}
            {activeTab === 'plantillas' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                    <StatsGrid
                        className="mb-5"
                        columns={3}
                        stats={[
                            {
                                label: 'Total',
                                value: templates.length,
                                variant: 'primary',
                                icon: <Mail size={24} />,
                            },
                            {
                                label: 'Activas',
                                value: activeCount,
                                variant: 'success',
                                icon: <Check size={24} />,
                            },
                            {
                                label: 'Inactivas',
                                value: inactiveCount,
                                variant: 'neutral',
                                icon: <XCircle size={24} />,
                            },
                        ]}
                    />

                    <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between items-start">
                        <div className="flex-1">
                            <FilterBar
                                onSearch={setSearchInput}
                                searchTerm={searchInput}
                                searchPlaceholder="Buscar por nombre o asunto..."
                                filters={filterDefinitions}
                                activeFilters={activeFilters}
                                onFilterChange={handleFilterChange}
                                onClearFilters={clearFilters}
                            />
                        </div>
                        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                            <Button variant="outline" className="flex-1 sm:flex-none" onClick={openGlobalModal}>
                                <Copy size={16} />
                                Importar global
                            </Button>
                            <Button variant="primary" className="flex-1 sm:flex-none" onClick={handleCreate}>
                                <Plus size={16} />
                                Nueva plantilla
                            </Button>
                        </div>
                    </div>

                    {loading && !templates.length ? (
                        <LoadingIndicator />
                    ) : templates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-base-content/40">
                            <Folder size={48} className="mb-3" />
                            <p className="text-sm font-medium">No se encontraron plantillas</p>
                            <p className="text-xs mt-1">Crea tu primera plantilla o importa una desde el catálogo global.</p>
                        </div>
                    ) : (
                        <>
                            <motion.div
                                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                                layout
                            >
                                <AnimatePresence>
                                    {templates.map((t) => (
                                        <TemplateCard
                                            key={t.id}
                                            template={t}
                                            onEdit={handleEdit}
                                            onPreview={handlePreview}
                                            onDelete={handleDeleteClick}
                                            onToggleActive={handleToggleActive}
                                        />
                                    ))}
                                </AnimatePresence>
                            </motion.div>

                            {pagination && (
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-base-content/60">Mostrar:</span>
                                        <select
                                            className="select select-bordered select-sm w-20"
                                            value={queryParams.items_por_pagina}
                                            onChange={(e) => updateQueryParams({ items_por_pagina: Number(e.target.value), pagina: 1 })}
                                            disabled={loading}
                                        >
                                            <option value={6}>6</option>
                                            <option value={9}>9</option>
                                            <option value={12}>12</option>
                                            <option value={18}>18</option>
                                        </select>
                                        <span className="text-base-content/60">por página</span>
                                    </div>
                                    <div className="join">
                                        <button
                                            className="join-item btn btn-sm"
                                            onClick={() => handlePageChange((queryParams.pagina ?? 1) - 1)}
                                            disabled={queryParams.pagina === 1 || loading}
                                        >«</button>
                                        {Array.from({ length: pagination.total_paginas }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                className={`join-item btn btn-sm ${page === queryParams.pagina ? 'btn-active' : ''}`}
                                                onClick={queryParams.pagina === page ? undefined : () => handlePageChange(page)}
                                                disabled={loading}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                        <button
                                            className="join-item btn btn-sm"
                                            onClick={() => handlePageChange((queryParams.pagina ?? 1) + 1)}
                                            disabled={queryParams.pagina === pagination.total_paginas || loading}
                                        >»</button>
                                    </div>
                                    <div className="text-sm text-base-content/60">
                                        Mostrando {(((queryParams.pagina ?? 1) - 1) * (queryParams.items_por_pagina ?? ITEMS_PER_PAGE)) + 1}–{Math.min((queryParams.pagina ?? 1) * (queryParams.items_por_pagina ?? ITEMS_PER_PAGE), pagination.total)} de {pagination.total}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            )}

            {/* ── Tab: SMTP ── */}
            {activeTab === 'smtp' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                    {!smtpConfig && loading ? (
                        <LoadingIndicator />
                    ) : (
                        <SmtpConfigForm
                            config={smtpConfig ?? {
                                host: '',
                                puerto: 587,
                                usuario: '',
                                remitente_nombre: '',
                                remitente_email: '',
                                usar_tls: true,
                            }}
                            onSave={handleSaveSmtp}
                            saving={savingSmtp}
                            onTestConnection={handleTestConnection}
                            testing={testingConn}
                            testResult={testResult}
                        />
                    )}
                </motion.div>
            )}

            {/* ── Editor Modal ── */}
            <GenericModal
                isOpen={editorOpen}
                onClose={() => { setEditorOpen(false); setSelectedTemplate(null); }}
                title={selectedTemplate ? 'Editar plantilla' : 'Nueva plantilla'}
                size="xl"
            >
                <EmailTemplateForm
                    template={selectedTemplate}
                    onSave={handleSaveTemplate}
                    onClose={() => { setEditorOpen(false); setSelectedTemplate(null); }}
                    saving={savingTemplate}
                />
            </GenericModal>

            {/* ── Preview Modal ── */}
            <GenericModal
                isOpen={previewOpen}
                onClose={() => { setPreviewOpen(false); setSelectedTemplate(null); }}
                title="Vista previa de plantilla"
                size="lg"
            >
                {selectedTemplate && (
                    <TemplatePreviewModal
                        template={selectedTemplate}
                        onClose={() => { setPreviewOpen(false); setSelectedTemplate(null); }}
                    />
                )}
            </GenericModal>

            {/* ── Delete Modal ── */}
            <ConfirmationModal
                isOpen={deleteOpen}
                title="Eliminar plantilla"
                message={`¿Estás seguro de que deseas eliminar la plantilla "${selectedTemplate?.nombre}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
                onConfirm={handleConfirmDelete}
                onClose={() => { setDeleteOpen(false); setSelectedTemplate(null); }}
            />

            {/* ── Global Templates Modal ── */}
            <GenericModal
                isOpen={globalModalOpen}
                onClose={() => { setGlobalModalOpen(false); }}
                title="Plantillas Globales"
                size="lg"
            >
                {loadingGlobal ? (
                    <LoadingIndicator />
                ) : globalTemplates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-base-content/40">
                        <Folder size={48} className="mb-3" />
                        <p className="text-sm font-medium">No hay plantillas globales disponibles</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                        {globalTemplates.map((gt) => {
                            const meta = EMAIL_TEMPLATE_TYPE_META[gt.tipo];
                            return (
                                <div
                                    key={gt.id}
                                    className="flex items-start gap-4 p-4 rounded-xl border border-base-200 bg-base-100 hover:border-primary/30 hover:bg-base-200/40 transition-all"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className={`badge badge-${meta.color} badge-sm font-medium`}>
                                                {meta.label}
                                            </span>
                                        </div>
                                        <p className="font-semibold text-sm truncate">{gt.nombre}</p>
                                        <p className="text-xs text-base-content/50 mt-0.5 truncate">{gt.asunto}</p>
                                        {gt.descripcion && (
                                            <p className="text-xs text-base-content/40 mt-1 line-clamp-1">{gt.descripcion}</p>
                                        )}
                                        {gt.variables && gt.variables.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {gt.variables.map((v) => (
                                                    <span key={v} className="badge badge-ghost badge-xs font-mono">
                                                        {`{{${v}}}`}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        loading={importingId === gt.id}
                                        onClick={() => handleImport(gt)}
                                        disabled={importingId !== null}
                                    >
                                        {importingId !== gt.id && <Copy size={16} />}
                                        Importar
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </GenericModal>
        </PageContainer>
    );
};

export default EmailConfigPage;
