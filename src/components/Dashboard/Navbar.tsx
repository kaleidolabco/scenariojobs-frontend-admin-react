import React from 'react';
import RoleSwitcher from './RoleSwitcher';
import UserDropdown from './UserDropdown';
import { PanelLeft } from '../../components/Common/Icon';

const Navbar: React.FC = () => {
    return (
        <nav className="navbar bg-base-100 shadow-sm w-full z-10">
            <div className="flex-none">
                <label htmlFor="my-drawer" aria-label="open sidebar" className="btn btn-square btn-ghost">
                    {/* Sidebar toggle icon */}
                    <PanelLeft size={24} />
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
