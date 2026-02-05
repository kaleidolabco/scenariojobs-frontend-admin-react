import React from 'react';

export interface TableColumn<T> {
    key: keyof T | string;
    label: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
}

export interface TableAction<T> {
    label: string;
    icon: React.ReactNode;
    onClick: (item: T) => void;
    variant?: 'ghost' | 'primary' | 'error';
    tooltip?: string;
}

interface GenericTableProps<T> {
    data: T[];
    columns: TableColumn<T>[];
    actions?: TableAction<T>[];
    keyExtractor: (item: T) => string | number;

    // Pagination
    currentPage: number;
    totalPages: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;

    // Sorting
    sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
    onSort?: (key: string) => void;

    // Empty state
    emptyMessage?: string;
}

function GenericTable<T>({
    data,
    columns,
    actions,
    keyExtractor,
    currentPage,
    totalPages,
    pageSize,
    onPageChange,
    onPageSizeChange,
    sortConfig,
    onSort,
    emptyMessage = 'No se encontraron registros'
}: GenericTableProps<T>) {

    const renderSortIcon = (columnKey: string) => {
        if (!sortConfig || sortConfig.key !== columnKey) {
            return <span className="opacity-75 ml-1">⇅</span>;
        }
        return sortConfig.direction === 'asc' ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>;
    };

    const handleSort = (columnKey: string, sortable?: boolean) => {
        if (sortable && onSort) {
            onSort(columnKey);
        }
    };

    return (
        <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
            <table className="table table-zebra w-full">
                <thead>
                    <tr className="bg-secondary text-secondary-content">
                        {columns.map((column) => (
                            <th
                                key={String(column.key)}
                                className={column.sortable ? 'cursor-pointer hover:bg-primary' : ''}
                                onClick={() => handleSort(String(column.key), column.sortable)}
                            >
                                {column.label}
                                {column.sortable && renderSortIcon(String(column.key))}
                            </th>
                        ))}
                        {actions && actions.length > 0 && (
                            <th className="text-center">Acciones</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? (
                        data.map((item) => (
                            <tr key={keyExtractor(item)} className="hover">
                                {columns.map((column) => (
                                    <td key={String(column.key)}>
                                        {column.render
                                            ? column.render(item)
                                            : String((item as any)[column.key] ?? '')}
                                    </td>
                                ))}
                                {actions && actions.length > 0 && (
                                    <td className="flex justify-center gap-2">
                                        {actions.map((action, idx) => (
                                            <button
                                                key={idx}
                                                className={`btn btn-${action.variant || 'ghost'} btn-xs tooltip`}
                                                data-tip={action.tooltip || action.label}
                                                onClick={() => action.onClick(item)}
                                            >
                                                {action.icon}
                                            </button>
                                        ))}
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-4">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="w-full flex justify-between gap-4 items-center p-4 bg-base-100 border-t border-base-200">
                <div className="flex items-center gap-2">
                    <span className="text-xs md:text-sm md:whitespace-nowrap">Filas por página:</span>
                    <select
                        className="select select-bordered select-sm"
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>

                <div className="join">
                    <button
                        className="join-item btn btn-xs md:btn-sm"
                        disabled={currentPage === 1}
                        onClick={() => onPageChange(currentPage - 1)}
                    >
                        «
                    </button>
                    <button className="join-item btn btn-xs md:btn-sm no-animation">
                        Página {currentPage} de {totalPages}
                    </button>
                    <button
                        className="join-item btn btn-xs md:btn-sm"
                        disabled={currentPage === totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                    >
                        »
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GenericTable;
