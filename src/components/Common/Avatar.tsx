import React, { useState } from 'react';
import { User as UserIcon } from '../Common/Icon';

interface AvatarProps {
    src?: string | null;
    name?: string | null;
    alt?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    placeholderClass?: string;
}

// Tamaño del ícono de placeholder según el `size` del Avatar.
const PLACEHOLDER_ICON_SIZE: Record<NonNullable<AvatarProps['size']>, number> = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 32,
    xl: 48,
};

const Avatar: React.FC<AvatarProps> = ({
    src,
    name,
    alt = 'Avatar',
    size = 'md',
    className = '',
    placeholderClass = 'bg-neutral text-neutral-content'
}) => {
    const [imgError, setImgError] = useState(false);

    const getInitials = (fullName?: string | null): string | React.ReactNode => {
        if (!fullName) return <UserIcon size={PLACEHOLDER_ICON_SIZE[size]} strokeWidth={2} />;
        const updatedName = fullName.trim();
        if (updatedName.length === 0) return <UserIcon size={PLACEHOLDER_ICON_SIZE[size]} strokeWidth={2} />;

        const parts = updatedName.split(' ').filter(part => part.length > 0);
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const getSizeClass = () => {
        switch (size) {
            case 'xs': return 'w-6 text-[10px]';
            case 'sm': return 'w-8 text-xs';
            case 'md': return 'w-10 text-sm';
            case 'lg': return 'w-16 text-xl';
            case 'xl': return 'w-24 text-3xl';
            default: return 'w-10 text-sm';
        }
    };

    return (
        <div className={`avatar placeholder ${className}`}>
            <div className={`bg-secondary text-white flex items-center justify-center ${getSizeClass()} rounded-full ${(!src || imgError) ? placeholderClass : ''}`}>
                {src && !imgError ? (
                    <img
                        src={src}
                        alt={alt}
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <span>{getInitials(name)}</span>
                )}
            </div>
        </div>
    );
};

export default Avatar;
