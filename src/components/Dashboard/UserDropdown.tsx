import useAuthStore from '../../store/authStore';

const UserDropdown = () => {
    const { logout } = useAuthStore();
    const { user } = useAuthStore();

    const handleLogout = () => {
        logout();
    };
    return (
        <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full">
                    <img
                        alt="Avatar usuario"
                        src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
                </div>
            </div>

            <ul
                tabIndex={-1}
                className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
                <li className="px-4 py-2 mb-2 border-b border-base-200 pointer-events-none w-full">
                    <div className="flex flex-col w-full">
                        <span className="font-bold text-sm truncate w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-center">
                            {user?.nombres} {user?.apellidos}
                        </span>
                    </div>
                </li>
                <li>
                    <a className="justify-between">
                        Perfil
                    </a>
                </li>
                <li>
                    <a>Notificaciones <span className="badge badge-sm indicator-item badge-info">0</span></a>
                </li>
                <li><a onClick={handleLogout}>Cerrar Sesión</a></li>
            </ul>
        </div>
    )
}

export default UserDropdown