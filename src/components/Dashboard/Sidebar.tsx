import React from 'react';
import useAuthStore from '../../store/authStore';
import { ROUTES } from '../../constants/routes';
import { UserRole } from '../../constants/roles';
import SidebarItem from './SidebarItem';
import LogoImg from '../../assets/logos/scenario-logo-color.png';
import { Home, Building2, Users, Mail, Network, Briefcase, CircleCheck, ClipboardList, Target, BarChart3, Pencil, FileText, Zap, BookOpen, CircleDot } from '../../components/Common/Icon';
import Button from '../../components/Common/Button';

interface MenuItem {
    label: string;
    to?: string;
    icon?: React.ReactNode;
    allowedRoles?: UserRole[] | 'ALL';
    divider?: boolean; // Section divider
}

const SIDEBAR_CONFIG: MenuItem[] = [
    {
        label: 'Inicio',
        to: ROUTES.HOME,
        allowedRoles: 'ALL',
        icon: <Home size={20} />
    },

    // --- ADMIN / CONFIG MODULE ---
    { label: 'Configuración', divider: true, allowedRoles: [UserRole.ADMIN] },
    {
        label: 'Empresa',
        to: ROUTES.COMPANY_CONFIG,
        allowedRoles: [UserRole.ADMIN],
        icon: <Building2 size={20} />
    },
    {
        label: 'Usuarios y Roles',
        to: ROUTES.USERS,
        allowedRoles: [UserRole.ADMIN],
        icon: <Users size={20} />
    },
    {
        label: 'Correos',
        to: ROUTES.EMAIL_CONFIG,
        allowedRoles: [UserRole.ADMIN],
        icon: <Mail size={20} />
    },

    // --- ORG STRUCTURE MODULE (New) ---
    { label: 'Estructura Org.', divider: true, allowedRoles: [UserRole.ADMIN] },
    {
        label: 'Organigrama',
        to: ROUTES.ORG_CHART,
        allowedRoles: [UserRole.ADMIN],
        icon: <Network size={20} />
    },

    // --- TALENT MODULE ---
    { label: 'Talento', divider: true, allowedRoles: [UserRole.ADMIN, UserRole.HR_MANAGER] },
    {
        label: 'Cargos (Perfiles)',
        to: ROUTES.JOBS,
        allowedRoles: [UserRole.ADMIN],
        icon: <Briefcase size={20} />
    },
    {
        label: 'Competencias',
        to: ROUTES.COMPETENCIES,
        allowedRoles: [UserRole.ADMIN],
        icon: <CircleCheck size={20} />
    },
    {
        label: 'Colaboradores',
        to: ROUTES.STAFF_DIRECTORY,
        allowedRoles: [UserRole.ADMIN, UserRole.HR_MANAGER],
        icon: <Users size={20} />
    },

    // --- HR MODULE ---
    { label: 'Módulos', divider: true, allowedRoles: [UserRole.HR_MANAGER] },
    {
        label: 'Selección',
        to: "https://dev.admin.scenariojobs.scenariovr.co/",
        allowedRoles: [UserRole.HR_MANAGER],
        icon: <ClipboardList size={20} />
    },
    {
        label: 'Evaluación Integral',
        to: ROUTES.HR_EVALUACIONES_INTEGRAL,
        allowedRoles: [UserRole.HR_MANAGER],
        icon: <ClipboardList size={20} />
    },
    {
        label: 'Evaluación de Competencias',
        to: ROUTES.COMPETENCIES_EVAL,
        allowedRoles: [UserRole.HR_MANAGER],
        icon: <Target size={20} />
    },
    {
        label: 'Evaluación de Desempeño',
        to: ROUTES.PERFORMANCE,
        allowedRoles: [UserRole.HR_MANAGER],
        icon: <Target size={20} />
    },
    {
        label: 'Assessments',
        to: ROUTES.ASSESSMENTS,
        allowedRoles: [UserRole.HR_MANAGER],
        icon: <ClipboardList size={20} />
    },
    {
        label: 'Procesos',
        to: ROUTES.PROCESSES,
        allowedRoles: [UserRole.HR_MANAGER],
        icon: <Target size={20} />
    },
    {
        label: 'Analítica',
        to: ROUTES.ANALYTICS_DASHBOARD,
        allowedRoles: [UserRole.HR_MANAGER, UserRole.ADMIN],
        icon: <BarChart3 size={20} />
    },

    // --- EVALUATOR MODULE ---
    { label: 'Evaluación', divider: true, allowedRoles: [UserRole.EVALUATOR] },
    {
        label: 'Por Calificar',
        to: ROUTES.GRADING_PENDING,
        allowedRoles: [UserRole.EVALUATOR],
        icon: <Pencil size={20} />
    },
    {
        label: 'Mi Equipo',
        to: ROUTES.MY_TEAM,
        allowedRoles: [UserRole.EVALUATOR],
        icon: <Users size={20} />
    },

    // --- EMPLOYEE MODULE ---
    { label: 'Mi Desarrollo', divider: true, allowedRoles: [UserRole.EMPLOYEE] },
    {
        label: 'Mis Evaluaciones',
        to: ROUTES.MY_ASSESSMENTS,
        allowedRoles: [UserRole.EMPLOYEE],
        icon: <FileText size={20} />
    },
    {
        label: 'Mis Objetivos',
        to: ROUTES.MY_OBJECTIVES,
        allowedRoles: [UserRole.EMPLOYEE],
        icon: <Zap size={20} />
    },
    {
        label: 'Autoevaluación Competencias',
        to: ROUTES.MI_COMPETENCIAS_EVAL,
        allowedRoles: [UserRole.EMPLOYEE],
        icon: <CircleDot size={20} />
    },
];

const Sidebar: React.FC = () => {
    const { activeRole } = useAuthStore();

    const handleItemClick = () => {
        // Solo cerrar el drawer en móvil (< 1024px)
        if (window.innerWidth < 1024) {
            const drawerCheckbox = document.getElementById('my-drawer') as HTMLInputElement;
            if (drawerCheckbox) {
                drawerCheckbox.checked = false;
            }
        }
    };

    // Filter items based on active role
    const filteredItems = SIDEBAR_CONFIG.filter(item => {
        if (!activeRole) return false;
        if (item.allowedRoles === 'ALL') return true;
        return item.allowedRoles?.includes(activeRole as UserRole);
    });

    return (
        <div className="drawer-side z-20 is-drawer-close:overflow-visible">
            <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay"></label>

            <div className="flex flex-col min-h-full bg-base-100 border-r border-base-200 transition-all duration-300 is-drawer-open:w-64 is-drawer-close:w-20">
                <ul className="menu p-4 w-full grow text-base-content gap-1">
                    <li className="mb-4 text-center overflow-hidden flex items-center justify-center h-12">
                        <img src={LogoImg} alt="Scenariojobs" className="h-full object-contain is-drawer-close:hidden" />
                        <span className="text-2xl font-bold text-primary hidden is-drawer-close:block">SJ</span>
                    </li>

                    {filteredItems.map((item, index) => (
                        item.divider ? (
                            <li key={index} className="menu-title mt-4 is-drawer-close:hidden">{item.label}</li>
                        ) : (
                            <SidebarItem
                                key={index}
                                to={item.to!}
                                label={item.label}
                                onClick={handleItemClick}
                                icon={item.icon}
                            />
                        )
                    ))}

                    {/* <div className="divider lg:hidden"></div> */}
                    <li className="mt-auto pt-4 is-drawer-close:hidden">
                        <div className="bg-base-200 p-4 rounded-xl flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <BookOpen size={20} />
                                </div>
                                <span className="font-bold text-sm">Centro de Ayuda</span>
                            </div>
                            <p className="text-xs text-base-content/60">
                                ¿Necesitas ayuda? Consulta nuestra documentación y tutoriales.
                            </p>
                            <Button variant="primary" size="sm" fullWidth>Ver Tutorial</Button>
                        </div>
                    </li>

                </ul>
            </div>
        </div>
    );
};

export default Sidebar;
