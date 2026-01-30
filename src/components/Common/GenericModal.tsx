import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface GenericModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    className?: string;
}

const GenericModal: React.FC<GenericModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    actions,
    size = 'md',
    className = ''
}) => {
    // const dialogRef = useRef<HTMLDialogElement>(null);

    // Close on ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const getSizeClass = () => {
        switch (size) {
            case 'sm': return 'max-w-md';
            case 'md': return 'max-w-2xl'; // Default
            case 'lg': return 'max-w-4xl';
            case 'xl': return 'max-w-6xl';
            case 'full': return 'max-w-full m-4';
            default: return 'max-w-2xl';
        }
    };

    // if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="modal modal-open modal-bottom sm:modal-middle bg-base-300/50 backdrop-blur-sm z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`modal-box ${getSizeClass()} ${className} relative overflow-visible`}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl text-base-content">{title}</h3>
                            <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>✕</button>
                        </div>

                        {/* Body */}
                        <div className="text-base-content/80 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            {children}
                        </div>

                        {/* Actions / Footer */}
                        {actions && (
                            <div className="modal-action mt-8 pt-4 border-t border-base-200">
                                {actions}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default GenericModal;
