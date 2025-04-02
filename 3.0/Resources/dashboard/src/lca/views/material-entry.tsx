import React, { useEffect, useState } from "react";
import { Select, FormField, Label, Input, Button } from "uxp/components";
import "./material-entry.scss";
import { getBillOfMaterials } from "../../esgnow-service";
import { IContextProvider } from "@uxp";

interface MaterialEntryProps {
    onAddMaterial: (materials: { materialClass: string; specificMaterial: string; weight: string; unit: string }[]) => void;
    isEditable?: boolean;
    initialMaterial?: { materialClass: string; specificMaterial: string; weight: string; unit: string };
    uxpContext: IContextProvider;
}

const MaterialEntry: React.FC<MaterialEntryProps> = ({ onAddMaterial, isEditable, initialMaterial, uxpContext }) => {
    const [materials, setMaterials] = useState([{ 
        materialClass: initialMaterial?.materialClass || "", 
        specificMaterial: initialMaterial?.specificMaterial || "", 
        weight: initialMaterial?.weight || "", 
        unit: initialMaterial?.unit || "kg" 
    }]);
    
    const [materialOptions, setMaterialOptions] = useState<Record<string, { label: string; value: string }[]>>({});
    const [classOptions, setClassOptions] = useState<{ label: string; value: string }[]>([]);
    
    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                debugger;
                const { data, error } = await getBillOfMaterials(uxpContext);
                if (error) {
                    console.error("Error fetching bill of materials:", error);
                    return;
                }
                
                if (data && (error == undefined)) {
                    // Convert API response to the format needed for the component
                    const options: Record<string, { label: string; value: string }[]> = {};
                    const classes: { label: string; value: string }[] = [];
                    
                    // Transform data into the format needed for the dropdowns
                    Object.keys(data).forEach(category => {
                        classes.push({ label: category, value: category });
                        
                        options[category] = data[category].map((material: string) => ({
                            label: material,
                            value: material
                        }));
                    });
                    
                    setClassOptions(classes);
                    setMaterialOptions(options);
                }
            } catch (error) {
                console.error("Failed to fetch bill of materials:", error);
            }
        };
        
        fetchMaterials();
    }, [uxpContext]);

    // Using only API data, no fallback options

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
                               ? (materialOptions[material.materialClass] || [])
                               : [{ label: "Select Material Class first", value: "" }]
                       }
                       selected={material.specificMaterial}
                       onChange={(value) => handleInputChange(index, "specificMaterial", value)}
                       placeholder="Select specific material"
                       className="specific-material-select"
                   />
               </FormField>
   
               <FormField className="material-weight-field">
                   <Label>Material Weight (Kg)</Label>
                   <Input
                       type="number"
                       value={material.weight}
                       onChange={(value) => handleInputChange(index, "weight", value)}
                       placeholder="Enter weight"
                       inputAttr={{ step: "0.01" }}
                       className="weight-input"
                   />
               </FormField>
   
               {/* <FormField className="unit-field">
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
               </FormField> */}
                    {/* Wrap the button in a new div to place it on a separate line */}
                </div>
            ))}
                <div className="add-another-material-container">
                        <Button
                            title="Add Another Material"
                            className="add-another-material-button"
                            onClick={handleAddAnother}
                        />
                </div>
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
