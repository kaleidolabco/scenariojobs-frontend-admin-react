import React from 'react';

interface FormSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

const FormSection: React.FC<FormSectionProps> = ({
    title,
    description,
    children,
    className = ''
}) => {
    return (
        <div className={`bg-base-100 rounded-lg p-4 md:p-6 border border-base-300 shadow-sm ${className}`}>
            <div className="mb-4 md:mb-6">
                <h3 className="text-lg font-semibold text-base-content">{title}</h3>
                {description && (
                    <p className="text-sm text-base-content/60 mt-1">{description}</p>
                )}
            </div>
            {children}
        </div>
    );
};

export default FormSection;