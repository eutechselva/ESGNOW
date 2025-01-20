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
import API_BASE_URL from "../config";

interface BillMaterialProps {
    productCategoryData: ProductCategoryInfo;
    productData: ProductInfo;
    onNext: (productData: BillMaterial[]) => void;
}

const BillMaterials: React.FC<BillMaterialProps> = ({ productCategoryData, productData, onNext }) => {
    const [showMaterialEntry, setShowMaterialEntry] = useState(false);
    const [materials, setMaterials] = useState<BillMaterial[]>([]);
    const [entryType, setEntryType] = useState<string>("ai");
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [showTooltip, setShowTooltip] = useState<boolean>(false);

    const entryOptions = [
        { label: "AI Generated", value: "ai" },
        { label: "Manual Entry", value: "manual" },
    ];

    const fetchMaterialsFromAPI = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/classify-bom`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: productData.name,
                    description: productData.description,
                    productCode: productData.code,
                    weight: productCategoryData.totalWeight,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch materials from API");
            }

            const data = await response.json();

            const apiMaterials = data.map((material: any) => ({
                materialClass: material.materialClass,
                specificMaterial: material.specificMaterial,
                weight: material.weight,
                unit: "kg",
            }));

            setMaterials(apiMaterials);
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

    const handleMaterialEdit = (index: number) => {
        setEditIndex(index);
        setShowMaterialEntry(true);
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
                        title="Add Materials"
                        className="add-materials-button"
                        onClick={handleAddMaterials}
                    />
                )}
                {entryType === "ai" && (
                    <Button
                        title="Generate Materials"
                        className="generate-materials-button"
                        onClick={handleGenerateMaterials}
                    />
                )}
            </div>

            {showMaterialEntry && entryType === "manual" && (
                <MaterialEntry
                    onAddMaterial={handleMaterialAdd}
                    isEditable={true}
                    initialMaterial={editIndex !== null ? materials[editIndex] : undefined}
                />
            )}

            {(materials.length > 0 || entryType === "ai") && (
                <>
                    <MaterialSummary
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
