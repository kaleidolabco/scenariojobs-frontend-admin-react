import React from 'react';

export interface LoadingIndicatorProps {
    /** Size of the loading indicator */
    size?: 'sm' | 'md' | 'lg';
    /** Optional message to display below the spinner */
    message?: string;
    /** Custom padding (default: 'p-10') */
    padding?: string;
    /** Custom className for additional styling */
    className?: string;
}

/**
 * Reusable loading indicator component
 * Currently uses a spinner, but can be extended to support other loading animations
 */
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
    size = 'lg',
    message,
    padding = 'p-10',
    className = ''
}) => {
    const sizeClass = size === 'sm' ? 'loading-sm' : size === 'md' ? 'loading-md' : 'loading-lg';

    return (
        <div className={`flex flex-col items-center justify-center ${padding} ${className}`}>
            <span className={`loading loading-spinner ${sizeClass}`}></span>
            {message && (
                <p className="mt-4 text-sm text-base-content/70">{message}</p>
            )}
        </div>
    );
};

export default LoadingIndicator;
