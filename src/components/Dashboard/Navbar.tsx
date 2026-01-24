import React from 'react';
import RoleSwitcher from './RoleSwitcher';
import UserDropdown from './UserDropdown';

const Navbar: React.FC = () => {
    return (
        <nav className="navbar bg-base-100 shadow-sm w-full z-10">
            <div className="flex-none">
                <label htmlFor="my-drawer" aria-label="open sidebar" className="btn btn-square btn-ghost">
                    {/* Sidebar toggle icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor" className="inline-block w-6 h-6"><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path><path d="M9 4v16"></path><path d="M14 10l2 2l-2 2"></path></svg>
                </label>
            </div>

            <div className="flex-1 px-2 mx-2 lg:text-xl lg:block hidden font-bold text-primary">PANEL DE ADMINISTRACIÓN</div>

            <div className="flex-1 px-2 mx-2 lg:hidden block">
                <div className="flex justify-end">
                    {/* Role Switcher */}
                    <RoleSwitcher />
                    {/* Profile/Logout */}
                    <UserDropdown />
                </div>
            </div>

            <div className="flex-none hidden lg:block px-2">
                {/* Role Switcher */}
                <RoleSwitcher />
                {/* Profile/Logout */}
                <UserDropdown />
            </div>
        </nav>
    );
};

export default Navbar;
