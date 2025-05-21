import React, { useState, useEffect } from "react";
import "./material-summary.scss";
import { Button, IconButton } from "uxp/components";

type Material = {
    materialClass: string;
    specificMaterial: string;
    weight: string;
    unit: string;
    reasoning?: string;
};

interface MaterialSummaryProps {
    materials: Array<Material>;
    plan: string;
    onEdit: (index: number, updatedMaterial: Material) => void;
    onDelete: (index: number) => void;
    onOpenFullEditor?: (index: number) => void;
    onEditAll?: () => void;
    entryType?: string;
}

const MaterialSummary: React.FC<MaterialSummaryProps> = ({
    materials,
    onEdit,
    onDelete,
    plan,
    onOpenFullEditor,
    onEditAll,
    entryType
}) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editedData, setEditedData] = useState<Material | null>(null);

    useEffect(() => {
        setEditingIndex(null);
        setEditedData(null);
    }, [materials]);

    useEffect(() => {
        return () => {
            setEditingIndex(null);
            setEditedData(null);
        };
    }, []);

    return (
        <div className="material-summary">
            <table className="material-summary-table">
                <thead>
                    <tr>
                        <th>Material Class</th>
                        {plan === "professional" && <th>Specific Material</th>}
                        <th>Weight</th>
                        <th>Reasoning</th>
                    </tr>
                </thead>
                <tbody>
                    {materials.map((material, index) => (
                        <tr key={index}>
                            <td>{material.materialClass}</td>
                            {plan === "professional" && <td>{material.specificMaterial}</td>}
                            <td>{`${material.weight} ${material.unit}`}</td>
                            <td className="reasoning-cell">{material.reasoning || "-"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {entryType === "ai" && onEditAll && (
                <div className="edit-all-materials-container">
                    {/* <Button
                        title="Edit Materials"
                        className="edit-all-materials-button"
                        onClick={onEditAll}
                    /> */}
                    <IconButton
                        type="edit"
                        onClick={onEditAll}
                        className="edit-all-materials-icon"
                    />
                </div>
            )}
        </div>

    );

};

export default MaterialSummary;