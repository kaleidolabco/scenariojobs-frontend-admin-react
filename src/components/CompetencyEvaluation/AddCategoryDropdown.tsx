import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category } from '../../services/categoryService';
import { Plus, Search } from '../Common/Icon';
import Button from '../Common/Button';
import ChevronToggle from '../Common/ChevronToggle';

interface AddCategoryDropdownProps {
    availableCategories: Category[];
    onAdd: (slug: string) => void;
}

const AddCategoryDropdown: React.FC<AddCategoryDropdownProps> = ({ availableCategories, onAdd }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = availableCategories.filter((c) =>
        c.nombre.toLowerCase().includes(search.toLowerCase())
    );

    if (availableCategories.length === 0) return null;

    return (
        <div className="relative" ref={ref}>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen((o) => !o)}
            >
                <Plus size={16} />
                Agregar categoría
                <ChevronToggle open={open} />
            </Button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 z-30 w-72 bg-base-100 border border-base-200 rounded-xl shadow-lg overflow-hidden"
                    >
                        <div className="p-2 border-b border-base-200">
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/30 pointer-events-none">
                                    <Search size={16} />
                                </span>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Buscar categoría..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="input input-bordered input-xs w-full pl-8"
                                />
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto">
                            {filtered.length === 0 ? (
                                <p className="text-center text-sm text-base-content/40 py-6">
                                    Sin resultados
                                </p>
                            ) : (
                                filtered.map((cat) => (
                                    <button
                                        key={cat.slug}
                                        type="button"
                                        onClick={() => { onAdd(cat.slug); setOpen(false); setSearch(''); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-base-200 transition-colors text-left border-b border-base-100 last:border-0"
                                    >
                                        <span className={`badge badge-${cat.color} badge-sm font-semibold shrink-0`}>
                                            {cat.nombre}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AddCategoryDropdown;
