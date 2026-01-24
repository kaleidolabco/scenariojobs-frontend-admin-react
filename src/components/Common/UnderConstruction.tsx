import React from 'react';
import { useLocation } from 'react-router-dom';

const UnderConstruction: React.FC<{ title?: string }> = ({ title }) => {
    const location = useLocation();
    const displayTitle = title || location.pathname.substring(1).replace(/-/g, ' ').toUpperCase();

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="text-9xl mb-4">🚧</div>
            <h1 className="text-4xl font-bold text-base-content mb-2">{displayTitle}</h1>
            <p className="text-xl text-base-content/70">
                Estamos trabajando en esta funcionalidad.
            </p>
            <div className="mt-8 p-4 bg-base-200 rounded-lg max-w-lg">
                <p className="font-mono text-sm">Ruta actual: <span className="text-primary">{location.pathname}</span></p>
            </div>
        </div>
    );
};

export default UnderConstruction;
