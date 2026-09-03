import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useOrgUnitService, OrgUnit } from '../../services/orgUnitService';
import PageContainer from '../../components/Common/PageContainer';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import { ROUTES } from '../../constants/routes';
import Tabs from '../../components/Common/Tabs';
import { motion, AnimatePresence } from 'framer-motion';
import OrgUnitInfoTab from '../../components/OrgUnits/OrgUnitInfoTab';
import OrgUnitSubunitsTab from '../../components/OrgUnits/OrgUnitSubunitsTab';
import OrgUnitPositionsTab from '../../components/OrgUnits/OrgUnitPositionsTab';
import { Info, Menu, ExternalLink } from '../../components/Common/Icon';

const OrgUnitDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { getUnitById } = useOrgUnitService();

    const [unit, setUnit] = useState<OrgUnit | null>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'subunits' | 'positions'>('positions');

    useEffect(() => {
        if (id) {
            loadUnitData();
        }
    }, [id]);

    const loadUnitData = async () => {
        if (!id) return;
        const response = await getUnitById(id);
        if (response && response.success) {
            setUnit(response.data.unidad);
        }
    };

    if (!unit) {
        return (
            <PageContainer title="Cargando..." subtitle="">
                <LoadingIndicator />
            </PageContainer>
        );
    }

    const breadcrumbs = [
        { label: 'Inicio', to: ROUTES.HOME },
        { label: 'Organigrama', to: ROUTES.ORG_CHART },
        { label: unit.nombre || 'Cargando...', to: undefined }
    ];

    return (
        <PageContainer
            title={unit.nombre}
            subtitle={unit.descripcion || 'Unidad organizacional'}
            breadcrumbs={breadcrumbs}
        >
            <Tabs
                tabs={[
                    {
                        id: 'info',
                        label: 'Información General',
                        icon: <Info size={16} />,
                    },
                    {
                        id: 'subunits',
                        label: 'Sub-unidades',
                        icon: <Menu size={16} />,
                    },
                    {
                        id: 'positions',
                        label: `Puestos de Trabajo`,
                        icon: <ExternalLink size={16} />,
                    },
                ]}
                activeTab={activeTab}
                onChange={(tabId) => setActiveTab(tabId as 'info' | 'subunits' | 'positions')}
                variant="bordered"
            />

            <AnimatePresence mode="wait">
                {activeTab === 'info' && (
                    <motion.div
                        key="info"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                    >
                        <OrgUnitInfoTab unit={unit} onUnitUpdated={loadUnitData} />
                    </motion.div>
                )}

                {activeTab === 'subunits' && (
                    <motion.div
                        key="subunits"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                    >
                        <OrgUnitSubunitsTab unit={unit} onUnitUpdated={loadUnitData} />
                    </motion.div>
                )}

                {activeTab === 'positions' && (
                    <motion.div
                        key="positions"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                    >
                        <OrgUnitPositionsTab unit={unit} />
                    </motion.div>
                )}
            </AnimatePresence>
        </PageContainer>
    );
};

export default OrgUnitDetailPage;
