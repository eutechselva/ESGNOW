import React, { useState, useEffect } from "react";
import { Button, Select } from "uxp/components";
import MaterialEntry from "./material-entry";
import MaterialSummary from "./material-summary";
import "./bill-materials.scss";
import { BillMaterial } from "../types/bill-material-type";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { ProductCategoryInfo } from "../types/product-category-info.type";
import { ProductInfo } from "../types/product-info.type";
import { IContextProvider } from "@uxp";
import { classifyBOM } from "../../esgnow-service";
import { set } from "lodash";

interface BillMaterialProps {
    productCategoryData: ProductCategoryInfo;
    productData: ProductInfo;
    onNext: (productData: BillMaterial[]) => void;
    uxpContext: IContextProvider;
}

const BillMaterials: React.FC<BillMaterialProps> = ({ productCategoryData, productData, onNext ,uxpContext }) => {
    const [showMaterialEntry, setShowMaterialEntry] = useState(false);
    const [materials, setMaterials] = useState<BillMaterial[]>([]);
    const [entryType, setEntryType] = useState<string>("ai");
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [showTooltip, setShowTooltip] = useState<boolean>(false);
    const [aiGeneratingBOM, setAIGeneratingBOM] = useState<boolean>(false);
    const [plan, setPlan] = useState<string>(null);

    const entryOptions = [
        { label: "AI Assistance", value: "ai" },
        { label: "Manual Entry", value: "manual" },
    ];

    const fetchMaterialsFromAPI = async () => {
        setAIGeneratingBOM(true);
        try {
            const classifyBOMPayload = {
                name: productData.name,
                description: productData.description,
                productCode: productData.code,
                weight: productCategoryData.totalWeight,
            };
            const response = await  classifyBOM( uxpContext, classifyBOMPayload);
            

            if (!response.data) {
                throw new Error("Failed to fetch materials from API");
            }

            const data = await response.data.bom;
            setPlan(response.data.plan);

            const apiMaterials = data.map((material: any) => ({
                materialClass: material.materialClass,
                specificMaterial: material.specificMaterial,
                weight: material.weight,
                unit: "kg",
            }));

            setMaterials(apiMaterials);
            setAIGeneratingBOM(false);
        } catch (error) {
            console.error("Error fetching materials from API:", error);
        }
    };

    const handleAddMaterials = () => {
        if (entryType === "manual") {
            setShowMaterialEntry(true);
            setEditIndex(null);
        }
    };

    const handleGenerateMaterials = () => {
        if (entryType === "ai") {
            fetchMaterialsFromAPI();
        }
    };

    const handleMaterialAdd = (newMaterials: BillMaterial[]) => {
        if (editIndex !== null) {
            const updatedMaterials = [...materials];
            updatedMaterials.splice(editIndex, 1, ...newMaterials);
            setMaterials(updatedMaterials);
        } else {
            setMaterials([...materials, ...newMaterials]);
        }
        setShowMaterialEntry(false);
    };

    const handleMaterialEdit = (index: number, material: BillMaterial) => {
        setEditIndex(index);
        setShowMaterialEntry(true);
        const materialData = [...materials]
        materialData[index] = {...material}
        setMaterials(materialData)
    };

    const handleMaterialDelete = (index: number) => {
        setMaterials(materials.filter((_, i) => i !== index));
    };

    const handleEntryTypeChange = (newValue: string) => {
        setEntryType(newValue);
        if (newValue === "manual") {
            setMaterials([]);
        }
    };

    const handleNext = () => {
        onNext(materials);
    };

    return (
        <div className="bill-materials">
            <div className="entry-type-select">
                <label htmlFor="entryType" className="select-method-label">
                    Select Method
                    <span
                        className="info-icon"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <FontAwesomeIcon icon={faInfoCircle} />
                        {showTooltip && (
                            <div className="tooltip">
                                Use manual entry or let AI assist you to generate the Bill of Materials
                                based on the product details provided.
                            </div>
                        )}
                    </span>
                </label>
                <Select
                    options={entryOptions}
                    selected={entryType}
                    onChange={handleEntryTypeChange}
                />
                {entryType === "manual" && (
                    <Button
                        title="Add "
                        className="add-materials-button"
                        onClick={handleAddMaterials}
                    />
                )}
                {entryType === "ai" && (
                    <Button
                        title="Generate"
                        className="generate-materials-button"
                        onClick={handleGenerateMaterials}
                    />
                )}
            </div>

            {aiGeneratingBOM && <div className="ai-generating-bom">Generating Bill of Materials...</div>}

            {showMaterialEntry && entryType === "manual" && (
                <MaterialEntry
                    onAddMaterial={handleMaterialAdd}
                    isEditable={true}
                    initialMaterial={editIndex !== null ? materials[editIndex] : undefined}
                />
            )}

            {(materials.length > 0 && entryType === "ai") && (
                <>
                 <MaterialSummary
                 plan={plan}
                        materials={materials}
                        onEdit={handleMaterialEdit}
                        onDelete={handleMaterialDelete}
                    />
                    <Button
                        className="button-container"
                        title="Next"
                        onClick={handleNext}
                    />
                </>
            )}
        </div>
    );
};

export default BillMaterials;
