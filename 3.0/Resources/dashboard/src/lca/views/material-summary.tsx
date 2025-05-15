import React, { useState, useEffect } from "react";
import "./material-summary.scss";
import { Button, Input, Select, IconButton } from "uxp/components";

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
}

const MaterialSummary: React.FC<MaterialSummaryProps> = ({ materials, onEdit, onDelete, plan, onOpenFullEditor }) => {

    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editedData, setEditedData] = useState<Material | null>(null);
    
    // Reset state when materials prop changes (like when reopening)
    useEffect(() => {
        setEditingIndex(null);
        setEditedData(null);
    }, [materials]);
    
    // Add cleanup effect
    useEffect(() => {
        return () => {
            // Clean up state when component unmounts
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
                        {plan == "professional" && (<th>Specific Material</th>)}
                        <th> Weight</th>
                        <th>Reasoning</th>
                        {/* <th>Actions</th> */}
                    </tr>
                </thead>
                <tbody>
                    {materials.map((material, index) => (
                        <tr key={index}>
                            <td>
                                {material.materialClass}
                            </td>

                            {plan == "professional" && (
                                <td>
                                    {material.specificMaterial}
                                </td>
                            )}
                            
                            <td>
                                {`${material.weight} ${material.unit}`}
                            </td>
                            <td className="reasoning-cell">
                                {material.reasoning || "-"}
                            </td>
                            {/* <td>
                                {onOpenFullEditor && (
                                    <IconButton
                                        type="edit"
                                        onClick={() => onOpenFullEditor(index)}
                                        className="edit-button"
                                    />
                                )}
                                <IconButton
                                    type="delete"
                                    onClick={() => onDelete(index)}
                                    className="delete-button"
                                />
                            </td> */}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MaterialSummary;
