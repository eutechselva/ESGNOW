import React, { useState, useEffect } from "react";
import { Button, Select } from "uxp/components";
import MaterialEntry from "./material-entry";
import MaterialSummary from "./material-summary";
import "./bill-materials.scss";
import { BillMaterial } from "../types/bill-material-type";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot, faEdit } from "@fortawesome/free-solid-svg-icons";
import { ProductCategoryInfo } from "../types/product-category-info.type";
import { ProductInfo } from "../types/product-info.type";
import { IContextProvider } from "@uxp";
import { classifyBOM, getAccountPlan } from "../../esgnow-service";

interface BillMaterialProps {
    productCategoryData: ProductCategoryInfo;
    productData: ProductInfo;
    onNext: (productData: BillMaterial[]) => void;
    uxpContext: IContextProvider;
}

const BillMaterials: React.FC<BillMaterialProps> = ({
    productCategoryData,
    productData,
    onNext,
    uxpContext
}) => {
    const prevEntryType = sessionStorage.getItem(`product_${productData.code}_entry_type`);
    const prevAIMaterialsData = sessionStorage.getItem(`product_${productData.code}_ai_materials`);
    const prevManualMaterialsData = sessionStorage.getItem(`product_${productData.code}_manual_materials`);

    const [showMaterialEntry, setShowMaterialEntry] = useState(false);
    const [showBulkEditor, setShowBulkEditor] = useState(false);
    const [entryType, setEntryType] = useState<string>(prevEntryType || "ai");

    // Separate state for AI and manual 
    const [aiMaterials, setAIMaterials] = useState<BillMaterial[]>(
        prevAIMaterialsData ? JSON.parse(prevAIMaterialsData) : []
    );
    const [manualMaterials, setManualMaterials] = useState<BillMaterial[]>(
        prevManualMaterialsData ? JSON.parse(prevManualMaterialsData) : []
    );

    const materials = entryType === "ai" ? aiMaterials : manualMaterials;

    useEffect(() => {
        setShowBulkEditor(false);
        setShowMaterialEntry(false);
    }, [entryType]);

    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [aiGeneratingBOM, setAIGeneratingBOM] = useState<boolean>(false);
    const [plan, setPlan] = useState<string>(null);
    const [validationError, setValidationError] = useState<string>("");

    const entryOptions = [
        { label: "AI Assistance", value: "ai" },
        { label: "Manual Entry", value: "manual" },
    ];

    useEffect(() => {
        getAccountPlanFromAPI();
        return () => {
            setEditIndex(null);
            setShowMaterialEntry(false);
            setValidationError("");
        };
    }, []);

    const getAccountPlanFromAPI = async () => {
        const response = await getAccountPlan(uxpContext);
        setPlan(response.data.plan);
    }

    const fetchMaterialsFromAPI = async () => {
        setAIGeneratingBOM(true);
        try {
            let imageUrl = '';
            if (productCategoryData.images && productCategoryData.images.length > 0) {
                if (productCategoryData.images[0].startsWith('http')) {
                    imageUrl = productCategoryData.images[0];
                } else {
                    const baseUrl = window.location.origin;
                    imageUrl = baseUrl + (productCategoryData.images[0].startsWith('/') ? '' : '/') + productCategoryData.images[0];
                }
            }

            const classifyBOMPayload = {
                name: productData.name,
                description: productData.description,
                productCode: productData.code,
                weight: productCategoryData.totalWeight,
                imageUrl: imageUrl
            };
            const response = await classifyBOM(uxpContext, classifyBOMPayload);

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
                reasoning: material.reasoning
            }));

            setAIMaterials(apiMaterials);
            saveAIMaterialsToStorage(apiMaterials);
            setAIGeneratingBOM(false);
        } catch (error) {
            console.error("Error fetching materials from API:", error);
            setAIGeneratingBOM(false);
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

    // Separate save functions for AI and manual materials
    const saveAIMaterialsToStorage = (updatedMaterials: BillMaterial[]) => {
        sessionStorage.setItem(`product_${productData.code}_ai_materials`, JSON.stringify(updatedMaterials));
    };

    const saveManualMaterialsToStorage = (updatedMaterials: BillMaterial[]) => {
        sessionStorage.setItem(`product_${productData.code}_manual_materials`, JSON.stringify(updatedMaterials));
    };

    const handleMaterialAdd = (newMaterials: BillMaterial[]) => {
        if (entryType === "manual") {
            let updatedMaterials: BillMaterial[];

            if (editIndex !== null) {
                updatedMaterials = [...manualMaterials];
                updatedMaterials.splice(editIndex, 1, ...newMaterials);
                setEditIndex(null);
            } else {
                updatedMaterials = [...manualMaterials, ...newMaterials];
            }

            setManualMaterials(updatedMaterials);
            saveManualMaterialsToStorage(updatedMaterials);
        }

        setShowMaterialEntry(false);
        setValidationError("");
    };

    const handleMaterialEdit = (index: number, material: BillMaterial) => {
        if (entryType === "ai") {
            const updatedMaterials = [...aiMaterials];
            updatedMaterials[index] = { ...material };
            setAIMaterials(updatedMaterials);
            saveAIMaterialsToStorage(updatedMaterials);
        } else {
            const updatedMaterials = [...manualMaterials];
            updatedMaterials[index] = { ...material };
            setManualMaterials(updatedMaterials);
            saveManualMaterialsToStorage(updatedMaterials);
        }

        setValidationError("");
    };

    const handleOpenFullEditor = (index: number) => {
        if (entryType === "manual") {
            setEditIndex(index);
            setShowMaterialEntry(true);
        }
    };

    const handleMaterialDelete = (index: number) => {
        if (entryType === "ai") {
            const updatedMaterials = aiMaterials.filter((_, i) => i !== index);
            setAIMaterials(updatedMaterials);
            saveAIMaterialsToStorage(updatedMaterials);
        } else {
            const updatedMaterials = manualMaterials.filter((_, i) => i !== index);
            setManualMaterials(updatedMaterials);
            saveManualMaterialsToStorage(updatedMaterials);
        }

        setValidationError("");
    };

    const handleEntryTypeChange = (newValue: string) => {
        setEntryType(newValue);
        sessionStorage.setItem(`product_${productData.code}_entry_type`, newValue);

        // Reset editing states when changing entry type
        setShowMaterialEntry(false);
        setShowBulkEditor(false);
        setEditIndex(null);
        setValidationError("");
    };

    const handleEditAllMaterials = () => {
        setShowBulkEditor(true);
    };

    const handleBulkEditDone = (editedMaterials: BillMaterial[]) => {
        if (entryType === "ai") {
            setAIMaterials(editedMaterials);
            saveAIMaterialsToStorage(editedMaterials);
        } else {
            setManualMaterials(editedMaterials);
            saveManualMaterialsToStorage(editedMaterials);
        }

        setShowBulkEditor(false);
        setValidationError("");
    };

    const handleBulkEditCancel = () => {
        setShowBulkEditor(false);
    };

    const handleNext = () => {
        setValidationError("");
        const currentMaterials = entryType === "ai" ? aiMaterials : manualMaterials;

        if (currentMaterials.length === 0) {
            setValidationError("Please add at least one material");
            return;
        }

        const totalMaterialWeight = currentMaterials.reduce((sum, material) => {
            return sum + (parseFloat(material.weight) || 0);
        }, 0);

        const productTotalWeight = parseFloat(productCategoryData.totalWeight) || 0;

        if (Math.abs(totalMaterialWeight - productTotalWeight) > 0.01) {
            setValidationError(`Total material weight (${totalMaterialWeight.toFixed(2)} kg) must match product weight (${productTotalWeight.toFixed(2)} kg)`);
            return;
        }

        if (plan === "basic") {
            const materialClasses = currentMaterials.map(m => m.materialClass);
            const uniqueClasses = new Set(materialClasses);

            if (uniqueClasses.size !== materialClasses.length) {
                setValidationError("Duplicate material classes detected. Please ensure each material class is unique.");
                return;
            }
        } else if (plan === "professional") {
            const specificMaterials = currentMaterials.map(m => m.specificMaterial);
            const uniqueSpecificMaterials = new Set(specificMaterials);

            if (uniqueSpecificMaterials.size !== specificMaterials.length) {
                setValidationError("Duplicate specific materials detected. Please ensure each specific material is unique.");
                return;
            }
        }

        onNext(currentMaterials);
    };

    return (
        <div className="bill-materials">
            <div className="entry-method-container">
                <h3 className="entry-method-title">How would you like to add materials?</h3>

                <div className="entry-method-options">
                    <div
                        className={`entry-method-card ${entryType === "ai" ? "active" : ""}`}
                        onClick={() => handleEntryTypeChange("ai")}
                    >
                        <div className="entry-card-icon">
                            <FontAwesomeIcon icon={faRobot} />
                        </div>
                        <div className="entry-card-content">
                            <h4>AI Assistance</h4>
                            <p>Let AI analyze your product and suggest materials automatically.</p>
                            {entryType === "ai" && (
                                <Button
                                    title="Generate Materials"
                                    className="generate-materials-button"
                                    onClick={handleGenerateMaterials}
                                />
                            )}
                        </div>
                    </div>

                    <div
                        className={`entry-method-card ${entryType === "manual" ? "active" : ""}`}
                        onClick={() => handleEntryTypeChange("manual")}
                    >
                        <div className="entry-card-icon">
                            <FontAwesomeIcon icon={faEdit} />
                        </div>
                        <div className="entry-card-content">
                            <h4>Manual Entry</h4>
                            <p>Manually add and customize materials for your product.</p>
                        </div>
                    </div>
                </div>
            </div>

            {entryType === "manual" && !showMaterialEntry && !manualMaterials.length && (
                <div className="manual-entry-prompt">
                    <p>Click the button below to start adding materials to your product.</p>
                    <Button
                        title="Add First Material"
                        className="add-first-material-button"
                        onClick={handleAddMaterials}
                    />
                </div>
            )}

            {aiGeneratingBOM && (
                <div className="ai-generating-bom">
                    <div className="loader-spinner"></div>
                    <div className="generating-message">
                        <h4>AI is generating your Bill of Materials</h4>
                        <p>Analyzing product information and identifying suitable materials...</p>
                    </div>
                </div>
            )}

            {showMaterialEntry && entryType === "manual" && (
                <div className="material-entry-container">
                    <div className="material-entry-header">
                        <h3>{editIndex !== null ? "Edit Material" : "Add Material"}</h3>
                    </div>
                    <MaterialEntry
                        onAddMaterial={handleMaterialAdd}
                        isEditable={true}
                        initialMaterial={editIndex !== null ? manualMaterials[editIndex] : undefined}
                        existingMaterials={manualMaterials}
                        uxpContext={uxpContext}
                        onCancel={() => setShowMaterialEntry(false)}
                    />
                </div>
            )}

            {showBulkEditor ? (
                <div className="bulk-edit-container">
                    <div className="bulk-edit-header">
                        <h3>Edit Materials</h3>
                    </div>
                    <MaterialEntry
                        onAddMaterial={handleBulkEditDone}
                        isEditable={true}
                        initialMaterials={entryType === "ai" ? aiMaterials : manualMaterials}
                        existingMaterials={[]}
                        uxpContext={uxpContext}
                        isBulkEdit={true}
                        onCancel={handleBulkEditCancel}
                    />
                </div>
            ) : materials.length > 0 ? (
                <>
                    <div className="materials-weight-summary">
                        <div className="weight-info">
                            Total Material Weight: {materials.reduce((sum, material) => sum + (parseFloat(material.weight) || 0), 0).toFixed(2)} kg
                        </div>
                        <div className="weight-info">
                            Target Product Weight: {parseFloat(productCategoryData.totalWeight).toFixed(2)} kg
                        </div>
                    </div>

                    <MaterialSummary
                        plan={plan}
                        materials={materials}
                        onEdit={handleMaterialEdit}
                        onDelete={handleMaterialDelete}
                        onOpenFullEditor={handleOpenFullEditor}
                        onEditAll={handleEditAllMaterials}
                        entryType={entryType}
                    />

                    {validationError && (
                        <div className="validation-error">
                            {validationError}
                        </div>
                    )}

                    <div className="materials-actions">
                        <Button
                            className="esgnow-next-button"
                            title="Next"
                            onClick={handleNext}
                        />
                    </div>
                </>
            ) : (
                !showMaterialEntry && (entryType === "ai") && (
                    <div className="empty-materials-container">
                        <p>No materials added yet. Generate materials using AI or switch to manual entry.</p>
                    </div>
                )
            )}
        </div>
    );
};

export default BillMaterials;