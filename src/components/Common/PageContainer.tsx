import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTE_LABELS, ROUTES } from '../../constants/routes';

interface PageContainerProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    breadcrumbs?: Array<{ label: string; to?: string }>;
}

const PageContainer: React.FC<PageContainerProps> = ({ title, subtitle, actions, children, breadcrumbs }) => {
    const location = useLocation();

    // Generate breadcrumbs if not provided
    const generateBreadcrumbs = () => {
        if (breadcrumbs) return breadcrumbs;

        const pathnames = location.pathname.split('/').filter((x) => x);
        const crumbs = [];

        // Always start with Home if configured
        if (ROUTE_LABELS[ROUTES.HOME]) {
            crumbs.push({ label: ROUTE_LABELS[ROUTES.HOME], to: ROUTES.HOME });
        }

        let currentPath = '';

        pathnames.forEach((value) => {
            currentPath += `/${value}`;
            // Avoid duplicating Home if it is already in the path
            if (currentPath === ROUTES.HOME) return;

            const label = ROUTE_LABELS[currentPath];
            if (label) {
                crumbs.push({ label, to: currentPath });
            } else {
                // Fallback: capitalize and replace hyphens
                const fallbackLabel = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
                crumbs.push({ label: fallbackLabel, to: currentPath });
            }
        });

        return crumbs;
    };

    const breadcrumbItems = generateBreadcrumbs();

    return (
        <div className="container mx-auto p-0 pb-6 md:p-2 md:pb-4 space-y-6 animate-in fade-in duration-300">
            {/* Breadcrumbs */}
            <div className="text-sm breadcrumbs text-base-content/60">
                <ul>
                    {breadcrumbItems.map((crumb, index) => {
                        const isLast = index === breadcrumbItems.length - 1;
                        return (
                            <li key={crumb.to || index}>
                                {crumb.to && !isLast ? (
                                    <Link to={crumb.to} className="hover:text-primary transition-colors">{crumb.label}</Link>
                                ) : (
                                    <span className="font-medium text-base-content">{crumb.label}</span>
                                )}
                            </li>
                        )
                    })}
                </ul>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-base-200 pb-2">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-base-content">{title}</h1>
                    {subtitle && <p className="text-base-content/70 mt-1">{subtitle}</p>}
                </div>
                {actions && (
                    <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end sm:justify-start">
                        {actions}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="w-full">
                {children}
            </div>
        </div>
    );
};

export default PageContainer;
