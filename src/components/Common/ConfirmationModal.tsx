import React from 'react';
import GenericModal from './GenericModal';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger'
}) => {
    const getConfirmButtonClass = () => {
        switch (variant) {
            case 'danger': return 'btn-error';
            case 'warning': return 'btn-warning';
            case 'info': return 'btn-info';
            default: return 'btn-primary';
        }
    };

    const actions = (
        <div className="flex justify-end gap-2 w-full">
            <button
                className="btn btn-ghost"
                onClick={onClose}
            >
                {cancelText}
            </button>
            <button
                className={`btn ${getConfirmButtonClass()}`}
                onClick={() => {
                    onConfirm();
                    onClose();
                }}
            >
                {confirmText}
            </button>
        </div>
    );

    return (
        <GenericModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            actions={actions}
            size="sm"
        >
            <p className="text-base text-base-content/80">{message}</p>
        </GenericModal>
    );
};

export default ConfirmationModal;
