import React from 'react';
import GenericModal from './GenericModal';
import Button from './Button';

type ConfirmVariant = 'danger' | 'warning' | 'info';

const CONFIRM_VARIANT: Record<ConfirmVariant, 'error' | 'warning' | 'info'> = {
    danger: 'error',
    warning: 'warning',
    info: 'info',
};

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
    const actions = (
        <div className="flex justify-end gap-2 w-full">
            <Button
                variant="ghost"
                onClick={onClose}
            >
                {cancelText}
            </Button>
            <Button
                variant={CONFIRM_VARIANT[variant]}
                onClick={() => {
                    onConfirm();
                    onClose();
                }}
            >
                {confirmText}
            </Button>
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
