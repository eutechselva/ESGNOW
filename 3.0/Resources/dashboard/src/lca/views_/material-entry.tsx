import React, { useEffect, useState } from "react";
import { Select, FormField, Label, Input, Button } from "uxp/components";
import "./material-entry.scss";

interface MaterialEntryProps {
    onAddMaterial: (materials: { materialClass: string; specificMaterial: string; weight: string; unit: string }[]) => void;
    isEditable?: boolean;
    initialMaterial?: { materialClass: string; specificMaterial: string; weight: string; unit: string };
}

const MaterialEntry: React.FC<MaterialEntryProps> = ({ onAddMaterial, isEditable, initialMaterial }) => {
    const [materials, setMaterials] = useState([{ 
        materialClass: initialMaterial?.materialClass || "", 
        specificMaterial: initialMaterial?.specificMaterial || "", 
        weight: initialMaterial?.weight || "", 
        unit: initialMaterial?.unit || "" 
    }]);

    const classOptions = [
        { label: "Wood", value: "Wood" },
        { label: "Metal", value: "Metal" },
        { label: "Plastic", value: "Plastic" },
    ];

    const materialOptions: Record<string, { label: string; value: string }[]> = {
        Wood: [
            { label: "Oak", value: "Oak" },
            { label: "Maple", value: "Maple" },
        ],
        Metal: [
            { label: "Stainless Steel", value: "Stainless Steel" },
            { label: "Aluminium", value: "Aluminium" },
        ],
        Plastic: [
            { label: "Polypropylene", value: "Polypropylene" },
            { label: "Polyvinyl Chloride", value: "Polyvinyl Chloride" },
        ],
    };

    const handleAddAnother = () => {
        setMaterials([...materials, { materialClass: "", specificMaterial: "", weight: "", unit: "" }]);
    };

    const handleInputChange = (index: number, field: string, value: string) => {
        const updatedMaterials = [...materials];
        (updatedMaterials[index] as any)[field] = value;
        setMaterials(updatedMaterials);
    };

    const handleAddMaterial = () => {
        onAddMaterial(materials);
        setMaterials([{ materialClass: "", specificMaterial: "", weight: "", unit: "" }]);
    };

    return (
        <>
            {materials.map((material, index) => (
               <div key={index} className="material-row">
               <FormField className="material-field">
                   <Label>Material Class</Label>
                   <Select
                       options={classOptions}
                       selected={material.materialClass}
                       onChange={(value) => handleInputChange(index, "materialClass", value)}
                       placeholder="Select an item"
                       className="material-select"
                   />
               </FormField>
   
               <FormField className="specific-material-field">
                   <Label>Specific Material</Label>
                   <Select
                       options={
                           material.materialClass
                               ? materialOptions[material.materialClass] || []
                               : [{ label: "Select Material Class first", value: "" }]
                       }
                       selected={material.specificMaterial}
                       onChange={(value) => handleInputChange(index, "specificMaterial", value)}
                       placeholder="Select specific material"
                       className="specific-material-select"
                   />
               </FormField>
   
               <FormField className="material-weight-field">
                   <Label>Material Weight</Label>
                   <Input
                       type="number"
                       value={material.weight}
                       onChange={(value) => handleInputChange(index, "weight", value)}
                       placeholder="Enter weight"
                       inputAttr={{ step: "0.01" }}
                       className="weight-input"
                   />
               </FormField>
   
               <FormField className="unit-field">
                   <Label>Unit</Label>
                   <Select
                       options={[
                           { label: "kg", value: "kg" },
                       ]}
                       selected={material.unit}
                       onChange={(value) => handleInputChange(index, "unit", value)}
                       placeholder="Select unit"
                       className="unit-select"
                   />
               </FormField>
                    {/* Wrap the button in a new div to place it on a separate line */}
                    <div className="add-another-material-container">
                        <Button
                            title="Add Another Material"
                            className="add-another-material-button"
                            onClick={handleAddAnother}
                        />
                    </div>
                    
                </div>
            ))}
    <div className="add-material-button-container">
            <Button
                title="Done"
                className="add-material-button"
                onClick={handleAddMaterial}
            />
        </div>
            
        </>
    );
}    

export default MaterialEntry;
