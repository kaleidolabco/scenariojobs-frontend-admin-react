import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarItemProps {
    to: string;
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, label, icon, onClick }) => {
    return (
        <li>
            <NavLink
                to={to}
                onClick={onClick}
                className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${isActive ? 'bg-primary text-primary-content shadow-md font-medium' : 'hover:bg-base-200'}`
                }
            >
                <div className="is-drawer-close:tooltip z-50 flex items-center w-full" data-tip={label}>
                    {icon}
                    <span className="is-drawer-close:hidden ml-2">{label}</span>
                </div>
            </NavLink>
        </li>
    );
};

export default SidebarItem;
