import React, { useEffect, useState } from "react";
import { Select, FormField, Label, Input, Button } from "uxp/components";
import "./material-entry.scss";
import { getBillOfMaterials } from "../../esgnow-service";
import { IContextProvider } from "@uxp";

interface MaterialEntryProps {
    onAddMaterial: (materials: { materialClass: string; specificMaterial: string; weight: string; unit: string }[]) => void;
    isEditable?: boolean;
    initialMaterial?: { materialClass: string; specificMaterial: string; weight: string; unit: string };
    existingMaterials?: Array<{ materialClass: string; specificMaterial: string; weight: string; unit: string }>;
    uxpContext: IContextProvider;
}

const MaterialEntry: React.FC<MaterialEntryProps> = ({ onAddMaterial, isEditable, initialMaterial, existingMaterials, uxpContext }) => {
    // Start with either the initial material for editing, or a blank material for adding
    const [materials, setMaterials] = useState([{ 
        materialClass: initialMaterial?.materialClass || "", 
        specificMaterial: initialMaterial?.specificMaterial || "", 
        weight: initialMaterial?.weight || "", 
        unit: initialMaterial?.unit || "kg" 
    }]);
    
    // Reset materials when initialMaterial changes
    useEffect(() => {
        if (initialMaterial) {
            // If editing an existing material
            setMaterials([{ 
                materialClass: initialMaterial.materialClass || "", 
                specificMaterial: initialMaterial.specificMaterial || "", 
                weight: initialMaterial.weight || "", 
                unit: initialMaterial.unit || "kg" 
            }]);
        }
    }, [initialMaterial]);
    
    const [materialOptions, setMaterialOptions] = useState<Record<string, { label: string; value: string }[]>>({});
    const [classOptions, setClassOptions] = useState<{ label: string; value: string }[]>([]);
    
    useEffect(() => {
        const fetchMaterials = async () => {
            try {
            
                const { data, error } = await getBillOfMaterials(uxpContext);
                if (error) {
                    console.error("Error fetching bill of materials:", error);
                    return;
                }
                
                if (data && (error == undefined)) {
                    // Convert API response to the format needed for the component
                    const options: Record<string, { label: string; value: string }[]> = {};
                    const classes: { label: string; value: string }[] = [];
                    const sortedCategories = Object.keys(data).sort((a, b) => a.localeCompare(b));
                    
                    // Transform data into the format needed for the dropdowns
                    sortedCategories.forEach(category => {
                        // Add sorted category to classes
                        classes.push({ label: category, value: category });
                        
                        // Sort materials within each category
                        const sortedMaterials = data[category]
                            .map((material: string) => ({
                                label: material,
                                value: material
                            }))
                            .sort((a: { label: string; value: string }, b: { label: string; value: string }) => a.label.localeCompare(b.label));
                        
                        options[category] = sortedMaterials;
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
        setMaterials([...materials, { materialClass: "", specificMaterial: "", weight: "", unit: "kg" }]);
    };

    const handleInputChange = (index: number, field: string, value: string) => {
        const updatedMaterials = [...materials];
        (updatedMaterials[index] as any)[field] = value;
        setMaterials(updatedMaterials);
    };

    const handleAddMaterial = () => {
        // Filter out materials with empty required fields
        const validMaterials = materials.filter(m => 
            m.materialClass.trim() !== "" && m.weight.trim() !== ""
        );
        
        if (validMaterials.length > 0) {
            // If editing a specific material, replace it; otherwise add new materials
            if (initialMaterial) {
                onAddMaterial(validMaterials);
            } else {
                // Add only the new materials without replacing existing ones
                onAddMaterial(validMaterials);
            }
            
            // Reset the entry form
            setMaterials([{ materialClass: "", specificMaterial: "", weight: "", unit: "kg" }]);
        } else {
            // If no valid materials, at least require one form entry
            setMaterials([{ materialClass: "", specificMaterial: "", weight: "", unit: "kg" }]);
        }
    };

    return (
        <>
            {materials.map((material, index) => (
               <div key={index} className="esgnow-material-card">
                  <div className="esgnow-material-card-header">
                      <span className="esgnow-material-number">Material #{index + 1}</span>
                      {materials.length > 1 && (
                          <button 
                              className="esgnow-remove-material-button"
                              onClick={() => {
                                  const updatedMaterials = [...materials];
                                  updatedMaterials.splice(index, 1);
                                  setMaterials(updatedMaterials);
                              }}
                          >
                              ✕
                          </button>
                      )}
                  </div>
                  <div className="esgnow-material-row">
                     <FormField className="esgnow-material-field">
                         <Label className="esgnow-material-entry-label">Material Class</Label>
                         <Select
                             options={classOptions}
                             selected={material.materialClass}
                             onChange={(value) => handleInputChange(index, "materialClass", value)}
                             placeholder="Select an item"
                             className="esgnow-material-select"
                         />
                     </FormField>
         
                     <FormField className="esgnow-specific-material-field">
                         <Label className="esgnow-specific-material-label">Specific Material</Label>
                         <Select
                             options={
                                 material.materialClass
                                     ? (materialOptions[material.materialClass] || [])
                                     : [{ label: "Select Material Class first", value: "" }]
                             }
                             selected={material.specificMaterial}
                             onChange={(value) => handleInputChange(index, "specificMaterial", value)}
                             placeholder="Select specific material"
                             className="esgnow-specific-material-select"
                         />
                     </FormField>
         
                     <FormField className="esgnow-material-weight-field">
                         <Label className="esgnow-material-weight-field-label">Material Weight (Kg)</Label>
                         <Input
                             type="number"
                             value={material.weight}
                             onChange={(value) => handleInputChange(index, "weight", value)}
                             placeholder="Enter weight"
                             inputAttr={{ step: "0.01" }}
                             className="esgnow-weight-input"
                         />
                     </FormField>
                  </div>
              </div>
            ))}
                <div className="esgnow-actions-container">
                    <Button
                        title="Done"
                        className="esgnow-add-material-button"
                        onClick={handleAddMaterial}
                    />
                    <Button
                        title="Add Another Material"
                        className="esgnow-add-another-material-button"
                        onClick={handleAddAnother}
                    />
                </div>
            
        </>
    );
}    

export default MaterialEntry;
