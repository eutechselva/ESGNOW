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
            { label: "Cherry", value: "Cherry" },
            { label: "Walnut", value: "Walnut" },
            { label: "Beech", value: "Beech" },
            { label: "Mahogany", value: "Mahogany" },
            { label: "Pine", value: "Pine" },
            { label: "Birch", value: "Birch" },
            { label: "Teak", value: "Teak" },
            { label: "Ash", value: "Ash" },
            { label: "Alder", value: "Alder" },
            { label: "Rubberwood", value: "Rubberwood" },
            { label: "Rosewood", value: "Rosewood" },
            { label: "Poplar", value: "Poplar" },
            { label: "Bamboo", value: "Bamboo" },
            { label: "MDF (Medium Density Fiberboard)", value: "MDF" },


        ],
        Metal: [
            { label: "Stainless Steel", value: "stainless-steel" },
            { label: "Aluminium", value: "Aluminium" },
            { label: "Steel", value: "Steel" },
            { label: "Chromed steel", value: "chromed-steel" },
            { label: "Wroght iron", value: "wroght-iron" },
            { label: "Cast iron", value: "cast-iron" },
            { label: "Brass", value: "Brass" },
            { label: "Copper", value: "Copper" },
            { label: "Zinc", value: "Zinc" },
            { label: "Titanium", value: "Titanium" },
            { label: "Mild steel (Carbon steel)", value: "mild-steel"},
            { label: "Galvanized steel", value: "galvanized-steel" },
            { label: "Nickel", value: "Nickel" },

        ],
        Plastic: [
            { label: "Polypropylene", value: "Polypropylene" },
            { label: "Polyvinyl Chloride", value: "polyvinyl-chloride" },
            { label: "Acrylonitrile Butadiene Styrene (ABS)", value: "ABS" },
            { label: "Polycarbonate (PC)", value: "polycarbonate"},
            { label: "High-Density Polyethylene (HDPE)", value: "HDPE"},
            { label: "Polyurethane (PU)", value: "pu"},
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
