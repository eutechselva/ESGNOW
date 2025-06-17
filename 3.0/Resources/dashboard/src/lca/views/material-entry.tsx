import React, { useEffect, useState } from "react";
import { Select, FormField, Label, Input, Button, IconButton } from "uxp/components";
import "./material-entry.scss";
import { getBillOfMaterials } from "../../esgnow-service";
import { IContextProvider } from "@uxp";

interface MaterialEntryProps {
    onAddMaterial: (materials: {
        materialClass: string;
        specificMaterial: string;
        weight: string;
        unit: string;
        reasoning?: string
    }[]) => void;
    isEditable?: boolean;
    initialMaterial?: {
        materialClass: string;
        specificMaterial: string;
        weight: string;
        unit: string;
        reasoning?: string
    };
    initialMaterials?: Array<{
        materialClass: string;
        specificMaterial: string;
        weight: string;
        unit: string;
        reasoning?: string
    }>;
    existingMaterials?: Array<{
        materialClass: string;
        specificMaterial: string;
        weight: string;
        unit: string;
        reasoning?: string
    }>;
    uxpContext: IContextProvider;
    isBulkEdit?: boolean;
    onCancel?: () => void;
}

const MaterialEntry: React.FC<MaterialEntryProps> = ({
    onAddMaterial,
    isEditable,
    initialMaterial,
    initialMaterials,
    existingMaterials,
    uxpContext,
    isBulkEdit = false,
    onCancel // Receive onCancel prop
}) => {

    const componentsKey = React.useMemo(() =>
        isBulkEdit
            ? `bulk-${initialMaterials?.length ?? 0}-${Date.now()}`
            : `single-${initialMaterial?.materialClass ?? ""}-${Date.now()}`,
        [initialMaterial, initialMaterials, isBulkEdit]
    );

    const [materials, setMaterials] = useState(
        isBulkEdit && initialMaterials
            ?
            JSON.parse(JSON.stringify(initialMaterials)) as Array<{
                materialClass: string;
                specificMaterial: string;
                weight: string;
                unit: string;
                reasoning?: string
            }>
            : initialMaterial
                ? [{
                    materialClass: initialMaterial.materialClass || "",
                    specificMaterial: initialMaterial.specificMaterial || "",
                    weight: initialMaterial.weight || "",
                    unit: initialMaterial.unit || "kg",
                    reasoning: initialMaterial.reasoning || ""
                }]
                : [{
                    materialClass: "",
                    specificMaterial: "",
                    weight: "",
                    unit: "kg",
                    reasoning: ""
                }]
    );

    const [materialOptions, setMaterialOptions] = useState<Record<string, { label: string; value: string }[]>>({});
    const [classOptions, setClassOptions] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        if (initialMaterial && !isBulkEdit) {
            setMaterials([{
                materialClass: initialMaterial.materialClass || "",
                specificMaterial: initialMaterial.specificMaterial || "",
                weight: initialMaterial.weight || "",
                unit: initialMaterial.unit || "kg",
                reasoning: initialMaterial.reasoning || ""
            }]);
        }
    }, [initialMaterial, isBulkEdit]);

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const { data, error } = await getBillOfMaterials(uxpContext);
                if (error) {
                    console.error("Error fetching bill of materials:", error);
                    return;
                }

                if (data && (error == undefined)) {
                    const options: Record<string, { label: string; value: string }[]> = {};
                    const classes: { label: string; value: string }[] = [];
                    const sortedCategories = Object.keys(data).sort((a, b) => a.localeCompare(b));

                    sortedCategories.forEach(category => {
                        classes.push({ label: category, value: category });

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

    const handleAddAnother = () => {
        setMaterials([...materials, {
            materialClass: "",
            specificMaterial: "",
            weight: "",
            unit: "kg",
            reasoning: ""
        }]);
    };

    const handleInputChange = (index: number, field: string, value: string) => {
        const updatedMaterials = [...materials];
        if ((field === "materialClass" || field === "specificMaterial") &&
            value !== (updatedMaterials[index] as any)[field]) {
            updatedMaterials[index].reasoning = "user edited";
        }
        (updatedMaterials[index] as any)[field] = value;
        setMaterials(updatedMaterials);
    };

    const handleAddMaterial = () => {
        const validMaterials = materials.filter(m =>
            m.materialClass.trim() !== "" && m.weight !== null && m.weight !== undefined && m.weight !== ""
        );

        if (validMaterials.length > 0) {
            onAddMaterial(validMaterials);
            if (!isBulkEdit) {
                setMaterials([{
                    materialClass: "",
                    specificMaterial: "",
                    weight: "",
                    unit: "kg",
                    reasoning: ""
                }]);
            }
        }
    };

    return (
        <div key={componentsKey}>
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
                            <Label className="esgnow-material-weight-field-label">Weight (Kg)</Label>
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

                    <div className="esgnow-material-row">
                        <FormField className="esgnow-material-reasoning-field">
                            <Label className="esgnow-material-reasoning-label">Reasoning</Label>
                            <textarea
                                value={material.reasoning || ""}
                                onChange={(e) => handleInputChange(index, "reasoning", e.target.value)}
                                placeholder="Enter reasoning for this material selection"
                                className="esgnow-reasoning-textarea"
                                rows={3}
                            />
                        </FormField>
                    </div>
                </div>
            ))}
            {!isBulkEdit && (
                <div className="esgnow-add-another-material-container">

                    <IconButton
                        type="plus"
                        className="esgnow-add-another-material-button"
                        onClick={handleAddAnother}
                    />
                </div>

            )}
            <div className="esgnow-actions-container">
                {onCancel && (
                    <Button
                        title="Cancel"
                        className="cancel-button"
                        onClick={onCancel}
                    />
                )}
                <Button
                    title={isBulkEdit ? "Save" : "Done"}
                    className="esgnow-done-button"
                    onClick={handleAddMaterial}
                />
            </div>



        </div>
    );
}

export default MaterialEntry;