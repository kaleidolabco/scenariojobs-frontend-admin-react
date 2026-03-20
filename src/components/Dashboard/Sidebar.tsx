import React from 'react';
import useAuthStore from '../../store/authStore';
import { ROUTES } from '../../constants/routes';
import { UserRole } from '../../constants/roles';
import SidebarItem from './SidebarItem';
import LogoImg from '../../assets/logos/scenario-logo-color.png';

// Helper for icons (using generic svg for now or specific ones if available)
const Icon = ({ path }: { path: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path} />
    </svg>
);

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
        icon: <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    },

    // --- ADMIN / CONFIG MODULE ---
    { label: 'Configuración', divider: true, allowedRoles: [UserRole.ADMIN] },
    {
        label: 'Empresa',
        to: ROUTES.COMPANY_CONFIG,
        allowedRoles: [UserRole.ADMIN],
        icon: <Icon path="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    },
    {
        label: 'Usuarios y Roles',
        to: ROUTES.USERS,
        allowedRoles: [UserRole.ADMIN],
        icon: <Icon path="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    },

    // --- ORG STRUCTURE MODULE (New) ---
    { label: 'Estructura Org.', divider: true, allowedRoles: [UserRole.ADMIN] },
    {
        label: 'Organigrama',
        to: ROUTES.ORG_CHART,
        allowedRoles: [UserRole.ADMIN],
        icon: <Icon path="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
    },

    // --- TALENT MODULE ---
    { label: 'Talento', divider: true, allowedRoles: [UserRole.ADMIN, UserRole.HR_MANAGER] },
    {
        label: 'Cargos (Perfiles)',
        to: ROUTES.JOBS,
        allowedRoles: [UserRole.ADMIN],
        icon: <Icon path="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    },
    {
        label: 'Competencias',
        to: ROUTES.COMPETENCIES,
        allowedRoles: [UserRole.ADMIN],
        icon: <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    },
    {
        label: 'Colaboradores',
        to: ROUTES.STAFF_DIRECTORY,
        allowedRoles: [UserRole.ADMIN, UserRole.HR_MANAGER],
        icon: <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    },

    // --- HR MODULE ---
    { label: 'Módoulos', divider: true, allowedRoles: [UserRole.HR_MANAGER] },
    {
        label: 'Selección',
        to: "https://dev.admin.scenariojobs.scenariovr.co/",
        allowedRoles: [UserRole.HR_MANAGER],
        icon: <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    },
    {
        label: 'Evaluación de Competencias',
        to: "https://highpotential.scenariojobs.com/admin/login.php",
        allowedRoles: [UserRole.HR_MANAGER],
        icon: <Icon path="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    },
    {
        label: 'Evaluación de Desempeño',
        to: ROUTES.PERFORMANCE,
        allowedRoles: [UserRole.HR_MANAGER],
        icon: <Icon path="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    },
    {
        label: 'Evaluaciones',
        to: ROUTES.ASSESSMENTS,
        allowedRoles: [UserRole.HR_MANAGER],
        icon: <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    },
    {
        label: 'Procesos',
        to: ROUTES.PROCESSES,
        allowedRoles: [UserRole.HR_MANAGER],
        icon: <Icon path="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    },
    {
        label: 'Analítica',
        to: ROUTES.ANALYTICS_DASHBOARD,
        allowedRoles: [UserRole.HR_MANAGER, UserRole.ADMIN],
        icon: <Icon path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
    },

    // --- EVALUATOR MODULE ---
    { label: 'Evaluación', divider: true, allowedRoles: [UserRole.EVALUATOR] },
    {
        label: 'Por Calificar',
        to: ROUTES.GRADING_PENDING,
        allowedRoles: [UserRole.EVALUATOR],
        icon: <Icon path="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    },
    {
        label: 'Mi Equipo',
        to: ROUTES.MY_TEAM,
        allowedRoles: [UserRole.EVALUATOR],
        icon: <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    },

    // --- EMPLOYEE MODULE ---
    { label: 'Mi Desarrollo', divider: true, allowedRoles: [UserRole.EMPLOYEE] },
    {
        label: 'Mis Evaluaciones',
        to: ROUTES.MY_ASSESSMENTS,
        allowedRoles: [UserRole.EMPLOYEE],
        icon: <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    },
    {
        label: 'Mis Objetivos',
        to: ROUTES.MY_OBJECTIVES,
        allowedRoles: [UserRole.EMPLOYEE],
        icon: <Icon path="M13 10V3L4 14h7v7l9-11h-7z" />
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
                                    <Icon path="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </div>
                                <span className="font-bold text-sm">Centro de Ayuda</span>
                            </div>
                            <p className="text-xs text-base-content/60">
                                ¿Necesitas ayuda? Consulta nuestra documentación y tutoriales.
                            </p>
                            <button className="btn btn-primary btn-sm w-full normal-case">
                                Ver Tutorial
                            </button>
                        </div>
                    </li>

                </ul>
            </div>
        </div>
    );
};

export default Sidebar;
