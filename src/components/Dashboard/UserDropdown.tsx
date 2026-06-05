import useAuthStore from '../../store/authStore';
import Avatar from '../Common/Avatar';

const avatarSVG = (<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 24 24"><path fill="#fff" d="M7.5 6.5C7.5 8.981 9.519 11 12 11s4.5-2.019 4.5-4.5S14.481 2 12 2S7.5 4.019 7.5 6.5M20 21h1v-1c0-3.859-3.141-7-7-7h-4c-3.86 0-7 3.141-7 7v1z"/></svg>);

const UserDropdown = () => {
    const { logout } = useAuthStore();
    const { user } = useAuthStore();

    const handleLogout = () => {
        logout();
    };
    return (
        <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <Avatar
                    src={user?.foto_de_perfil}
                    name={user?.nombres && user?.apellidos ? `${user?.nombres} ${user?.apellidos}` : null}
                    size="md"
                    className="w-10 rounded-full"
                />
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