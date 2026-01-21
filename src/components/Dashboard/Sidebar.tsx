import React from 'react';
import SidebarItem from './SidebarItem';
import useAuthStore from '../../store/authStore';

const Sidebar: React.FC = () => {
    const { logout } = useAuthStore();

    const handleItemClick = () => {
        // Solo cerrar el drawer en móvil (< 1024px)
        if (window.innerWidth < 1024) {
            const drawerCheckbox = document.getElementById('my-drawer') as HTMLInputElement;
            if (drawerCheckbox) {
                drawerCheckbox.checked = false;
            }
        }
    };

    return (
        <div className="drawer-side z-20 is-drawer-close:overflow-visible">
            <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay"></label>

            <div className="flex flex-col min-h-full bg-base-100 border-r border-base-200 transition-all duration-300 is-drawer-open:w-64 is-drawer-close:w-20">
                <ul className="menu p-4 w-full grow text-base-content gap-1">
                    {/* Sidebar content */}
                    <li className="mb-4 text-center overflow-hidden h-10">
                        <h2 className="text-2xl font-bold text-primary truncate is-drawer-close:hidden">Scenariojobs</h2>
                    </li>

                    <SidebarItem
                        to="/inicio"
                        label="Inicio"
                        onClick={handleItemClick}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor" className="my-1.5 inline-block size-5"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>}
                    />

                    <SidebarItem
                        to="/cargos"
                        label="Cargos"
                        onClick={handleItemClick}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="my-1.5 inline-block size-5" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M17 7a3 3 0 0 0-3-3h-4a3 3 0 0 0-3 3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3zm-3-1h-4a1 1 0 0 0-1 1h6a1 1 0 0 0-1-1M6 9h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1" clip-rule="evenodd" /></svg>}
                    />

                    <SidebarItem
                        to="/competencias"
                        label="Competencias"
                        onClick={handleItemClick}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" className="my-1.5 inline-block size-5"><path fill="currentColor" d="m4.076 6.47l.495.07zm-.01.07l-.495-.07zm6.858-.07l.495-.07zm.01.07l-.495.07zM9.5 12.5v.5a.5.5 0 0 0 .5-.5zm-4 0H5a.5.5 0 0 0 .5.5zm-.745-3.347l.396-.306zm5.49 0l-.396-.306zM6 15h3v-1H6zM3.58 6.4l-.01.07l.99.14l.01-.07zM7.5 3a3.96 3.96 0 0 0-3.92 3.4l.99.14A2.96 2.96 0 0 1 7.5 4zm3.92 3.4A3.96 3.96 0 0 0 7.5 3v1a2.96 2.96 0 0 1 2.93 2.54zm.01.07l-.01-.07l-.99.14l.01.07zm-.79 2.989c.63-.814.948-1.875.79-2.99l-.99.142a2.95 2.95 0 0 1-.59 2.236zM9 10.9v1.6h1v-1.599zm.5 1.1h-4v1h4zm-3.5.5v-1.599H5V12.5zM3.57 6.47a3.95 3.95 0 0 0 .79 2.989l.79-.612a2.95 2.95 0 0 1-.59-2.236zM6 10.9c0-.823-.438-1.523-.85-2.054l-.79.612c.383.495.64.968.64 1.442zm3.85-2.054C9.437 9.378 9 10.077 9 10.9h1c0-.474.257-.947.64-1.442zM7 0v2h1V0zM0 8h2V7H0zm13 0h2V7h-2zM3.354 3.646l-1.5-1.5l-.708.708l1.5 1.5zm9 .708l1.5-1.5l-.708-.708l-1.5 1.5z" /></svg>}
                    />

                    <SidebarItem
                        to="/usuarios"
                        label="Usuarios"
                        onClick={handleItemClick}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor" className="my-1.5 inline-block size-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>}
                    />

                    <div className="divider lg:hidden"></div>
                    <li className="lg:hidden"><button onClick={logout}>Cerrar Sesión</button></li>
                </ul>
            </div>
        </div>
    );
};

export default Sidebar;
