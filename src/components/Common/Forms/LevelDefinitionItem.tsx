import React from 'react';

interface LevelDefinitionItemProps {
    level: number;
    name: string;
    description: string;
    required?: boolean;
    onNameChange: (name: string) => void;
    onDescriptionChange: (description: string) => void;
}

const LevelDefinitionItem: React.FC<LevelDefinitionItemProps> = ({
    level,
    name,
    description,
    required = false,
    onNameChange,
    onDescriptionChange
}) => {
    return (
        <div className="space-y-3 p-3 md:p-4 bg-base-100 rounded-lg border border-base-300 hover:border-primary/30 transition-colors">
            {/* Header del nivel */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-content font-bold shrink-0">
                        {level}
                    </div>
                    <div className="flex-1 md:hidden">
                        <input
                            required={required}
                            type="text"
                            className="input input-sm input-bordered w-full focus:border-primary focus:ring-2 focus:ring-primary/20"
                            placeholder="Nombre del nivel"
                            value={name}
                            onChange={(e) => onNameChange(e.target.value)}
                        />
                    </div>
                </div>

                <div className="hidden md:block flex-1">
                    <input
                        type="text"
                        className="input input-sm input-bordered w-full focus:border-primary focus:ring-2 focus:ring-primary/20"
                        placeholder="Nombre del nivel (Ej: Principiante, Intermedio...)"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                    />
                </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-base-content/80">
                    Descripción del comportamiento esperado
                </label>
                <textarea
                    className="textarea textarea-bordered w-full text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder={`Describe las habilidades, comportamientos y resultados esperados para el nivel ${level}...`}
                    rows={2}
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                ></textarea>
            </div>
        </div>
    );
};

export default LevelDefinitionItem;