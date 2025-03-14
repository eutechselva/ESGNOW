import React, { useState } from "react";
import "./material-summary.scss";
import { Button, Input, Select, IconButton } from "uxp/components";

type Material = {
    materialClass: string;
    specificMaterial: string;
    weight: string;
    unit: string;
};

interface MaterialSummaryProps {
    materials: Array<Material>;
    plan: string;
    onEdit: (index: number, updatedMaterial: Material) => void;
    onDelete: (index: number) => void;
}

const MaterialSummary: React.FC<MaterialSummaryProps> = ({ materials, onEdit, onDelete, plan }) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editedData, setEditedData] = useState<Material | null>(null);

    const specificMaterialOptions = [
        { label: "Oak", value: "Oak" },
        { label: "Maple", value: "Maple" },

    ];

    const unitOptions = [
        { label: "kg", value: "kg" },
        // { label: "lbs", value: "lbs" },
    ];

    const handleEditClick = (index: number, material: Material) => {
        setEditingIndex(index);
        setEditedData(material);
    };

    const handleSaveClick = (index: number) => {
        if (editedData) {
            onEdit(index, editedData);
            setEditingIndex(null);
        }
    };

    const handleChange = (field: string, value: string) => {
        if (editedData) {
            setEditedData({ ...editedData, [field]: value });
        }
    };

    return (
        <div className="material-summary">
            <table className="material-summary-table">
                <thead>
                    <tr>
                        <th>Material Class</th>
                        {plan !== "basic" && (<th>Specific Material</th>)}
                        <th>Material Weight</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {materials.map((material, index) => (
                        <tr key={index}>
                            <td>
                                {editingIndex === index ? (
                                    <Input className="material-class-input"
                                        value={editedData?.materialClass || ""}
                                        onChange={(val) => handleChange("materialClass", val)}
                                    />
                                ) : (
                                    material.materialClass
                                )}
                            </td>

                            {plan !== "basic" && (
                                <td>
                                    {editingIndex === index ? (
                                        <Select
                                            options={specificMaterialOptions}
                                            selected={editedData?.specificMaterial || specificMaterialOptions[0].value}
                                            onChange={(newValue) => handleChange("specificMaterial", newValue)}
                                        />
                                    ) : (
                                        material.specificMaterial
                                    )}
                                </td>
                            )}
                            
                            <td>
                                {editingIndex === index ? (
                                    <div className="weight-unit-input">
                                        <Input className="weight-input-field" value={editedData?.weight || ""} onChange={(val) => handleChange("weight", val)} />
                                        <Select className="unit-select-field"
                                            options={unitOptions}
                                            selected={editedData?.unit || unitOptions[0].value}
                                            onChange={(newValue) => handleChange("unit", newValue)}
                                        />
                                    </div>
                                ) : (
                                    `${material.weight} ${material.unit}`
                                )}
                            </td>
                            <td>
                                {editingIndex === index ? (
                                    <Button title="Save" onClick={() => handleSaveClick(index)} className="save-materials-button" />
                                ) : (
                                    <IconButton
                                        type="edit"
                                        onClick={() => handleEditClick(index, material)}
                                        className="edit-button"
                                    />
                                )}
                                <IconButton
                                    type="delete"
                                    onClick={() => onDelete(index)}
                                    className="delete-button"
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MaterialSummary;
