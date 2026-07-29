import React, { useState } from 'react';
import { Upload, Check, X, Info } from '../Common/Icon';
import { FileResource } from '../../services/functionService';
import Button from '../Common/Button';
import TreeNodeRow from './TreeNodeRow';

interface FileEditorProps {
    file: FileResource;
    onUpdate: (file: FileResource) => void;
    onDelete: () => void;
    defaultOpen?: boolean;
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const FileEditor: React.FC<FileEditorProps> = ({
    file,
    onUpdate,
    onDelete,
    defaultOpen = false,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [fileError, setFileError] = useState<string | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const maxSize = 50 * 1024 * 1024;
        if (selectedFile.size > maxSize) {
            setFileError('El archivo debe ser menor a 50MB');
            return;
        }

        setFileError(null);
        const fileUrl = URL.createObjectURL(selectedFile);
        onUpdate({
            ...file,
            archivoNombre: selectedFile.name,
            archivoUrl: fileUrl,
            archivoTamaño: selectedFile.size,
        });
    };

    const handleClearFile = () => {
        if (file.archivoUrl) URL.revokeObjectURL(file.archivoUrl);
        onUpdate({ ...file, archivoNombre: undefined, archivoUrl: undefined, archivoTamaño: undefined });
    };

    const rowLabel = file.nombre || file.archivoNombre || '';

    return (
        <div>
            <TreeNodeRow
                isOpen={isOpen}
                onToggle={() => setIsOpen(v => !v)}
                dotColorClass="bg-info"
                label={rowLabel}
                onDelete={onDelete}
            />

            {isOpen && (
                <div className="ml-4 pl-4 border-l border-base-300 py-2 space-y-3">

                    {/* Name */}
                    <div>
                        <label className="text-xs text-base-content/50 uppercase tracking-wide mb-1 block">
                            Nombre del archivo
                        </label>
                        <input
                            type="text"
                            className="input input-sm input-bordered w-full"
                            value={file.nombre}
                            onChange={e => onUpdate({ ...file, nombre: e.target.value })}
                            placeholder="Ej. Guía_de_Implementación"
                        />
                    </div>

                    {/* Upload area */}
                    <div className="border border-dashed border-base-300 rounded-lg p-3 bg-base-200/30">
                        <label className="text-xs text-base-content/50 uppercase tracking-wide mb-2 block">
                            Archivo
                        </label>

                        {!file.archivoNombre ? (
                                <label className="flex items-center justify-center w-full cursor-pointer">
                                <input type="file" className="hidden" onChange={handleFileUpload} accept="*" />
                                <div className="text-center py-2">
                                    <Upload size={20} className="mx-auto text-base-content/30 mb-1" />
                                    <p className="text-xs text-base-content/50">Haz clic para seleccionar un archivo</p>
                                </div>
                            </label>
                        ) : (
                            <div className="space-y-2">
                                    <div className="bg-base-100 rounded p-2 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Check size={16} className="text-success flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-base-content truncate">{file.archivoNombre}</p>
                                            {file.archivoTamaño && (
                                                <p className="text-xs text-base-content/50">{formatFileSize(file.archivoTamaño)}</p>
                                            )}
                                        </div>
                                    </div>
                                    <Button size="xs" variant="ghost" className="text-error hover:bg-error/10" onClick={handleClearFile} title="Quitar archivo">
                                        <X size={12} />
                                    </Button>
                                </div>
                                <label className="flex justify-center w-full cursor-pointer text-xs text-base-content/50 hover:text-base-content/70 transition-colors">
                                    <input type="file" className="hidden" onChange={handleFileUpload} accept="*" />
                                    <span className="border-b border-dashed border-base-content/30">Reemplazar archivo</span>
                                </label>
                            </div>
                        )}

                        {fileError && (
                            <div className="alert alert-error mt-2 py-2">
                                <Info size={16} className="flex-shrink-0" />
                                <span className="text-xs">{fileError}</span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs text-base-content/50 uppercase tracking-wide mb-1 block">
                            Descripción <span className="normal-case">(opcional)</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered textarea-sm w-full resize-none"
                            rows={2}
                            value={file.descripcion || ''}
                            onChange={e => onUpdate({ ...file, descripcion: e.target.value })}
                            placeholder="Breve descripción del contenido del archivo..."
                        />
                    </div>

                    {/* Comments */}
                    <div>
                        <label className="text-xs text-base-content/50 uppercase tracking-wide mb-1 block">
                            Comentarios <span className="normal-case">(opcional)</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered textarea-sm w-full resize-none"
                            rows={2}
                            value={file.comentario || ''}
                            onChange={e => onUpdate({ ...file, comentario: e.target.value })}
                            placeholder="Observaciones o notas adicionales..."
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileEditor;