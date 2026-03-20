import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import useAuthStore from '../../store/authStore';
import useFetch from '../../hooks/useFetch';
import { UserRole, ROLE_LABELS } from '../../constants/roles';

// Mock response for roles
const MOCK_USER_ROLES = [
    { role: UserRole.ADMIN, label: ROLE_LABELS[UserRole.ADMIN] },
    { role: UserRole.HR_MANAGER, label: ROLE_LABELS[UserRole.HR_MANAGER] },
    { role: UserRole.EVALUATOR, label: ROLE_LABELS[UserRole.EVALUATOR] },
    { role: UserRole.EMPLOYEE, label: ROLE_LABELS[UserRole.EMPLOYEE] }
];

const RoleSwitcher: React.FC = () => {
    const { activeRole, setActiveRole } = useAuthStore();
    const { fetchData, loading } = useFetch<any[]>();
    const [roles, setRoles] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Simular petición al backend para obtener roles disponibles del usuario
        fetchData({
            url: '/api/user/roles',
            mockData: MOCK_USER_ROLES
        }).then(data => {
            if (data) setRoles(data);
            // Si no hay rol activo, setear el primero
            if (!activeRole && data && data.length > 0) {
                setActiveRole(data[0].role);
            }
        });
    }, [fetchData, activeRole, setActiveRole]);

    if (loading) return <span className="loading loading-spinner loading-sm mx-3"></span>;

    if (!roles.length) return null;

    const handleButtonClick = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY,
                right: window.innerWidth - rect.right
            });
        }
        setIsOpen(!isOpen);
    };

    const handleMenuClick = (role: string) => {
        setActiveRole(role);
        setIsOpen(false);
    };

    const handleClickOutside = () => {
        setIsOpen(false);
    };

    return (
        <>
            <div 
                ref={buttonRef}
                role="button" 
                className="btn btn-ghost btn-sm m-1 cursor-pointer"
                onClick={handleButtonClick}
            >
                {activeRole ? ROLE_LABELS[activeRole as UserRole] : 'Seleccionar Rol'}
                <svg width="12px" height="12px" className="hidden h-2 w-2 fill-current opacity-60 sm:inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path></svg>
            </div>
            {isOpen && createPortal(
                <div 
                    className="fixed inset-0 z-40"
                    onClick={handleClickOutside}
                >
                    <ul 
                        className="absolute menu p-2 shadow bg-base-100 rounded-box w-52 z-50"
                        style={{ top: `${position.top}px`, right: `${position.right}px` }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {roles.map((r) => (
                            <li key={r.role}>
                                <a
                                    className={activeRole === r.role ? 'active' : ''}
                                    onClick={() => handleMenuClick(r.role)}
                                >
                                    {r.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>,
                document.body
            )}
        </>
    );
};

export default RoleSwitcher;
