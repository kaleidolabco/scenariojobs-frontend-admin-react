import React, { useEffect, useState, ReactNode } from 'react';

// store
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';

// component
import Loader from '../Loader/Loader';

interface AuthLoaderProps {
  children: ReactNode;
}

const AuthLoader: React.FC<AuthLoaderProps> = ({ children }) => {
  const { validateToken } = useAuthStore();
  const { openAlert } = useUIStore();

  const [pending, setPending] = useState<boolean>(true);

  useEffect(() => {
    validateAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateAuth = async () => {
    setPending(true);
    const valid_token = await validateToken();
    if (!valid_token) {
      // Puedes activar la alerta si lo deseas
      openAlert("Sesión expirada", "error");
    }
    setPending(false);
  };

  if (pending) {
    return (
      <div className='flex items-center justify-center w-full h-full'>
        <Loader />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthLoader;
