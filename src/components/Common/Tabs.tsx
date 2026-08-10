import React from 'react';

export interface TabItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    /** Badge opcional (contador, peso, etc.). Se renderiza a la derecha del label. */
    badge?: React.ReactNode;
}

interface TabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (tabId: string) => void;
    variant?: 'boxed' | 'bordered';
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, variant = 'boxed' }) => {
    const getTabClasses = (tabId: string) => {
        if (variant === 'boxed') {
            return `tab ${activeTab === tabId ? 'tab-active font-semibold text-primary' : 'text-base-content/70'}`;
        } else if (variant === 'bordered') {
            return `flex items-center gap-1 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150
                    ${activeTab === tabId
                        ? 'border-primary text-primary'
                        : 'border-transparent text-base-content/50 hover:text-base-content hover:border-base-300'
                    }`;
        }
        return '';
    };

    const containerClasses = variant === 'boxed'
        ? 'tabs tabs-boxed mb-6 bg-base-100 p-1 rounded-lg border border-base-200'
        : 'border-b border-base-200 mb-6 overflow-x-auto';

    const innerClasses = variant === 'boxed'
        ? ''
        : 'flex gap-0 min-w-full';

    return (
        <div className={containerClasses}>
            <div className={innerClasses}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChange(tab.id)}
                        className={getTabClasses(tab.id)}
                    >
                        {tab.icon && <span className="mr-2">{tab.icon}</span>}
                        {tab.label}
                        {tab.badge}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Tabs;
