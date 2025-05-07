import React, { useState, useEffect } from "react";
import { Button, Select } from "uxp/components";
import MaterialEntry from "./material-entry";
import MaterialSummary from "./material-summary";
import "./bill-materials.scss";
import { BillMaterial } from "../types/bill-material-type";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle, faRobot, faPenToSquare, faLightbulb, faEdit } from "@fortawesome/free-solid-svg-icons";
import { ProductCategoryInfo } from "../types/product-category-info.type";
import { ProductInfo } from "../types/product-info.type";
import { IContextProvider } from "@uxp";
import { classifyBOM, getAccountPlan } from "../../esgnow-service";
import { set } from "lodash";

interface BillMaterialProps {
    productCategoryData: ProductCategoryInfo;
    productData: ProductInfo;
    onNext: (productData: BillMaterial[]) => void;
    uxpContext: IContextProvider;
}

const BillMaterials: React.FC<BillMaterialProps> = ({ productCategoryData, productData, onNext ,uxpContext }) => {
    // Check if we have materials data from a previous visit to this step
    const prevMaterialsData = sessionStorage.getItem(`product_${productData.code}_materials`);
    const prevEntryType = sessionStorage.getItem(`product_${productData.code}_entry_type`);
    
    const [showMaterialEntry, setShowMaterialEntry] = useState(false);
    const [materials, setMaterials] = useState<BillMaterial[]>(prevMaterialsData ? JSON.parse(prevMaterialsData) : []);
    const [entryType, setEntryType] = useState<string>(prevEntryType || "ai");
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [showTooltip, setShowTooltip] = useState<boolean>(false);
    const [aiGeneratingBOM, setAIGeneratingBOM] = useState<boolean>(false);
    const [plan, setPlan] = useState<string>(null);
    const [validationError, setValidationError] = useState<string>("");

    const entryOptions = [
        { label: "AI Assistance", value: "ai" },
        { label: "Manual Entry", value: "manual" },
    ];

    useEffect(() => {
        getAccountPlanFromAPI();
        
        // Add cleanup when component unmounts
        return () => {
            // Reset the local state only (session storage is handled by wizard)
            setEditIndex(null);
            setShowMaterialEntry(false);
            setValidationError("");
        };
    }, []);

    const getAccountPlanFromAPI = async () => {
        const response = await  getAccountPlan( uxpContext);
        setPlan(response.data.plan);
    }

    const fetchMaterialsFromAPI = async () => {
        setAIGeneratingBOM(true);
        try {
            let imageUrl = '';
            if (productCategoryData.images && productCategoryData.images.length > 0) {
                // Check if the image URL already contains a host
                if (productCategoryData.images[0].startsWith('http')) {
                    imageUrl = productCategoryData.images[0];
                } else {
                    // Use window.location.origin to get the base URL
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
            saveMaterialsToStorage(apiMaterials);
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

    // Helper function to save materials to session storage
    const saveMaterialsToStorage = (updatedMaterials: BillMaterial[]) => {
        sessionStorage.setItem(`product_${productData.code}_materials`, JSON.stringify(updatedMaterials));
    };
    
    const handleMaterialAdd = (newMaterials: BillMaterial[]) => {
        let updatedMaterials: BillMaterial[];
        
        if (editIndex !== null) {
            // Replace the material being edited
            updatedMaterials = [...materials];
            updatedMaterials.splice(editIndex, 1, ...newMaterials);
            // Reset edit index
            setEditIndex(null);
        } else {
            // Add new materials to existing ones
            updatedMaterials = [...materials, ...newMaterials];
        }
        
        setMaterials(updatedMaterials);
        saveMaterialsToStorage(updatedMaterials);
        setShowMaterialEntry(false);
        setValidationError(""); // Clear validation errors when materials are updated
    };

    const handleMaterialEdit = (index: number, material: BillMaterial) => {
        // When the user edits in the summary table, update the material directly
        // without showing the material entry form
        const updatedMaterials = [...materials];
        updatedMaterials[index] = {...material};
        setMaterials(updatedMaterials);
        saveMaterialsToStorage(updatedMaterials);
        setValidationError(""); // Clear validation errors when materials are updated
    };

    const handleOpenFullEditor = (index: number) => {
        if (entryType === "manual") {
            setEditIndex(index);
            setShowMaterialEntry(true);
        }
    };

    const handleMaterialDelete = (index: number) => {
        const updatedMaterials = materials.filter((_, i) => i !== index);
        setMaterials(updatedMaterials);
        saveMaterialsToStorage(updatedMaterials);
        setValidationError(""); // Clear validation errors when materials are updated
    };

    const handleEntryTypeChange = (newValue: string) => {
        setEntryType(newValue);
        sessionStorage.setItem(`product_${productData.code}_entry_type`, newValue);
        
        if (newValue === "manual") {
            setMaterials([]);
            saveMaterialsToStorage([]);
        }
        setValidationError(""); // Clear validation errors when entry type changes
    };

    const handleNext = () => {
        // Clear previous validation errors
        setValidationError("");
        
        // Check for validation errors
        if (materials.length === 0) {
            setValidationError("Please add at least one material");
            return;
        }
        
        // Check for total weight matching
        const totalMaterialWeight = materials.reduce((sum, material) => {
            return sum + (parseFloat(material.weight) || 0);
        }, 0);
        
        const productTotalWeight = parseFloat(productCategoryData.totalWeight) || 0;
        
        // Allow a small rounding tolerance (0.01 kg)
        if (Math.abs(totalMaterialWeight - productTotalWeight) > 0.01) {
            setValidationError(`Total material weight (${totalMaterialWeight.toFixed(2)} kg) must match product weight (${productTotalWeight.toFixed(2)} kg)`);
            return;
        }
        
        // Check for duplicates based on plan
        if (plan === "basic") {
            // For basic plan, check for duplicate material classes
            const materialClasses = materials.map(m => m.materialClass);
            const uniqueClasses = new Set(materialClasses);
            
            if (uniqueClasses.size !== materialClasses.length) {
                setValidationError("Duplicate material classes detected. Please ensure each material class is unique.");
                return;
            }
        } else if (plan === "professional") {
            // For professional plan, check for duplicate specific materials
            const specificMaterials = materials.map(m => m.specificMaterial);
            const uniqueSpecificMaterials = new Set(specificMaterials);
            
            if (uniqueSpecificMaterials.size !== specificMaterials.length) {
                setValidationError("Duplicate specific materials detected. Please ensure each specific material is unique.");
                return;
            }
        }
        
        // If validation passes, proceed to next step
        // Keep the storage so when the user goes back, they keep their data
        // We'll rely on the wizard's reset function to clean everything at the end
        onNext(materials);
    };

    return (
        <div className="bill-materials">
            <div className="entry-method-container">
                <h3 className="entry-method-title">
                    How would you like to add materials?
                    {/* <span
                        className="info-icon"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <FontAwesomeIcon icon={faInfoCircle} />
                        {showTooltip && (
                            <div className="tooltip">
                                Choose how you want to add materials to your product.
                            </div>
                        )}
                    </span> */}
                </h3>
                
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

            {entryType === "manual" && !showMaterialEntry && !materials.length && (
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
                        <Button 
                            title="Cancel" 
                            className="cancel-button"
                            onClick={() => setShowMaterialEntry(false)}
                        />
                    </div>
                    <MaterialEntry
                        onAddMaterial={handleMaterialAdd}
                        isEditable={true}
                        initialMaterial={editIndex !== null ? materials[editIndex] : undefined}
                        existingMaterials={materials}
                        uxpContext={uxpContext}
                    />
                </div>
            )}

            {materials.length > 0 ? (
                <>
                 <div className="materials-weight-summary">
                    <div className="weight-info">
                        Total Material Weight: {materials.reduce((sum, material) => sum + (parseFloat(material.weight) || 0), 0).toFixed(2)} kg
                    </div>
                    <div className="weight-info">
                        Target Product Weight: {parseFloat(productCategoryData.totalWeight).toFixed(2)} kg
                    </div>
                 </div>
                 
                 <div className="materials-list-header">
                    <h3>Material List</h3>
                    <p>The materials below will be used to calculate the environmental impact of your product.</p>
                 </div>
                 
                 <MaterialSummary
                        plan={plan}
                        materials={materials}
                        onEdit={handleMaterialEdit}
                        onDelete={handleMaterialDelete}
                        onOpenFullEditor={handleOpenFullEditor}
                    />
                    {validationError && (
                        <div className="validation-error">
                            {validationError}
                        </div>
                    )}
                    
                    <div className="materials-actions">
                        {entryType === "manual" && !showMaterialEntry && (
                            <Button
                                className="add-more-materials-button"
                                title="Add"
                                onClick={handleAddMaterials}
                            />
                        )}
                        <Button
                            className="esgnow-next-button"
                            title="Next"
                            onClick={handleNext}
                        />
                    </div>
                </>
            ) : (
                // Only show the empty container for AI mode or when no specific prompts are shown
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
