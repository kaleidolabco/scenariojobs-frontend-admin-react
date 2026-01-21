import React from 'react';
import useAuthStore from '../../store/authStore';

const Navbar: React.FC = () => {
    const { logout } = useAuthStore();

    const handleLogout = () => {
        logout();
    };

    return (
        <nav className="navbar bg-base-100 shadow-sm w-full z-10">
            <div className="flex-none">
                <label htmlFor="my-drawer" aria-label="open sidebar" className="btn btn-square btn-ghost">
                    {/* Sidebar toggle icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor" className="inline-block w-6 h-6"><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path><path d="M9 4v16"></path><path d="M14 10l2 2l-2 2"></path></svg>
                </label>
            </div>

            <div className="flex-1 px-2 mx-2 lg:text-xl sm:text-sm font-bold text-primary">PANEL DE ADMINISTRACIÓN</div>

            <div className="flex-none hidden lg:block">
                <ul className="menu menu-horizontal">
                    {/* Profile/Logout */}
                    <li><button onClick={handleLogout}>Cerrar Sesión</button></li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
