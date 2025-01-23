
import React from "react";
import "./material-summary.scss";
import {Button } from "uxp/components";

interface MaterialSummaryProps {
    materials: { materialClass: string, specificMaterial: string, weight: string, unit: string }[];
    onEdit: (index: number) => void;
    onDelete: (index: number) => void;
}

const MaterialSummary: React.FC<MaterialSummaryProps> = ({ materials, onEdit, onDelete }) => {
    return (
        <div className="material-summary">
            <table>
                <thead>
                    <tr>
                        <th>Material Class</th>
                        <th>Specific Material</th>
                        <th>Material Weight</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {materials.map((material, index) => (
                        <tr key={index}>
                            <td>{material.materialClass}</td>
                            <td>{material.specificMaterial}</td>
                            <td>{material.weight} {material.unit}</td>
                            <td>
                            <Button title="Edit" onClick={() => onEdit(index)} className="edit-button" />
                            <Button title="Delete" onClick={() => onDelete(index)} className="delete-button" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MaterialSummary;



