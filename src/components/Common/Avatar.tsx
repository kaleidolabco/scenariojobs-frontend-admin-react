import React, { useState } from 'react';

interface AvatarProps {
    src?: string | null;
    name?: string | null;
    alt?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    placeholderClass?: string;
}

const avatarSVG = (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></g></svg>);

const Avatar: React.FC<AvatarProps> = ({
    src,
    name,
    alt = 'Avatar',
    size = 'md',
    className = '',
    placeholderClass = 'bg-neutral text-neutral-content'
}) => {
    const [imgError, setImgError] = useState(false);

    const getInitials = (fullName?: string | null) => {
        if (!fullName) return avatarSVG;
        const updatedName = fullName.trim();
        if (updatedName.length === 0) return avatarSVG;

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
