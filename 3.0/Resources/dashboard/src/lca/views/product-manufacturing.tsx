import React, { useState, useEffect } from "react";
import { Button, Select } from "uxp/components";
import ProcessEntry from "./process-entry";
import "./product-manufacturing.scss";
import { BillMaterial } from "../types/bill-material-type";
import { ProductManufacturingProcess } from "../types/product-manufacturing-process.type";
import { ProductCategoryInfo } from "../types/product-category-info.type";
import { ProductInfo } from "../types/product-info.type";
import { IContextProvider } from "@uxp";
import { classifyManufacturingProcess, getAccountPlan } from "../../esgnow-service";
import { faInfoCircle, faRobot, faWrench, faCogs, faIndustry } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface ProductManufacturingProps {
    productCategoryData: ProductCategoryInfo;
    productData: ProductInfo;
    billMaterials: BillMaterial[];
    uxpContext: IContextProvider;
    onProductManufacturingChange: (data: { materialClass: string, specificMaterial: string, weight: number, manufacturingProcesses: ProductManufacturingProcess[]; }[]) => void;
}

const ProductManufacturing: React.FC<ProductManufacturingProps> = ({
    productCategoryData,
    productData,
    billMaterials,
    onProductManufacturingChange,
    uxpContext,
}) => {
    const [entryType, setEntryType] = useState<"manual" | "ai">("ai");
    const [manualProcesses, setManualProcesses] = useState<Record<string, ProductManufacturingProcess[]>>({});
    const [aiProcesses, setAIProcesses] = useState<Record<string, ProductManufacturingProcess[]>>({});
    const [showProcessContent, setShowProcessContent] = useState(false);
    const [aiGeneratingProcess, setAIGeneratingProcess] = useState<boolean>(false);
    const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
    const [showTooltip, setShowTooltip] = useState<boolean>(false);
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
            setShowProcessContent(false);
            setValidationError("");
        };
    }, [uxpContext]);
    
    const getAccountPlanFromAPI = async () => {
        const response = await getAccountPlan(uxpContext);
        setPlan(response.data.plan);
    };

    const handleEntryTypeChange = (newValue: "ai" | "manual") => {
        // Manual mode is always expanded
        if (newValue === "manual") {
            setShowProcessContent(true);
        } else {
            setShowProcessContent(false);
        }
        
        setEntryType(newValue);
        
        // Update the parent component with the appropriate processes for the selected entry type
        const processes = newValue === "ai" ? aiProcesses : manualProcesses;
        updateParentManufacturingProcess(processes);
    };

    const handleProcessAdd = (materialId: string, process: { manufacturingProcess: string; subProcesses: string[] }) => {
        const newProcess: ProductManufacturingProcess = {
            category: process.manufacturingProcess,
            processes: process.subProcesses,
        };

        // Determine which state to update based on the current entry type
        if (entryType === "ai") {
            // Use functional update to ensure we're working with the most current state
            setAIProcesses(prev => {
                // Create a new object to avoid reference issues
                const updatedProcesses = {
                    ...prev,
                    [materialId]: [newProcess], // Only keep the new process
                };
                
                // We need to use setTimeout to break the potential circular update cycle
                // This ensures the state update completes before triggering the parent update
                setTimeout(() => {
                    updateParentManufacturingProcess(updatedProcesses);
                }, 0);
                
                return updatedProcesses;
            });
        } else {
            // Use functional update to ensure we're working with the most current state
            setManualProcesses(prev => {
                // Create a new object to avoid reference issues
                const updatedProcesses = {
                    ...prev,
                    [materialId]: [newProcess], // Only keep the new process
                };
                
                // We need to use setTimeout to break the potential circular update cycle
                // This ensures the state update completes before triggering the parent update
                setTimeout(() => {
                    updateParentManufacturingProcess(updatedProcesses);
                }, 0);
                
                return updatedProcesses;
            });
        }
    };
    
    // Helper function to update the parent component's state
    const updateParentManufacturingProcess = (processes: Record<string, ProductManufacturingProcess[]>) => {
        // Check for valid processes but don't set validation error yet
        // We'll manually check and set the error message
        const processesValid = checkProcessesValidity();
        
        const manufacturingProcesses = [];
        for (const materialClass in processes) {
            const material = billMaterials.find(m => m.materialClass === materialClass);
            if (material) {
                manufacturingProcesses.push({
                    materialClass: material.materialClass,
                    specificMaterial: material.specificMaterial,
                    weight: parseFloat(material.weight),
                    manufacturingProcesses: processes[materialClass] || []
                });
            }
        }
        
        // Only call the parent's callback if we have valid data
        if (manufacturingProcesses.length > 0) {
            onProductManufacturingChange(manufacturingProcesses);
            
            // If processes are valid, clear any validation errors
            if (processesValid) {
                setValidationError(""); 
            } else {
                // Otherwise set the error message
                setValidationError("Please define at least one manufacturing process before proceeding.");
            }
        }
    };

    // This function is no longer needed since we always show process content in manual mode
    // But we'll keep it for backward compatibility
    const handleAddProcess = () => {
        setShowProcessContent(true);
    };

    const handleGenerate = async () => {
        if (entryType === "ai") {
            setAIGeneratingProcess(true);

            try {
                const classifyManufacturingProcessPayLoad = {
                    productCode: productData.code,
                    name: productData.name,
                    description: productData.description,
                    bom: billMaterials,
                };
                const response = await classifyManufacturingProcess(uxpContext, classifyManufacturingProcessPayLoad);


                if (!response.data) {
                    throw new Error("Failed to fetch manufacturing processes");
                }

                const apiResults: { materialClass: string, specificMaterial: string, weight: number, manufacturingProcesses: ProductManufacturingProcess[] }[] =
                    await response.data.manufacturingProcess;

                // Make sure to maintain the same structure as getAccountPlanFromAPI
                setPlan(response.data.plan);

                // Create a mapped object of manufacturing processes by material class
                const mappedProcesses: Record<string, ProductManufacturingProcess[]> = {};
                apiResults.forEach((item) => {
                    if (item.manufacturingProcesses && item.manufacturingProcesses.length > 0) {
                        mappedProcesses[item.materialClass] = item.manufacturingProcesses;
                    }
                });

                console.log("AI generated processes:", mappedProcesses);

                // Update the AI processes state
                setAIProcesses(mappedProcesses);
                
                // Update the parent component
                onProductManufacturingChange(apiResults);
                
                // Hide the loading indicator and process form since we now have AI results
                setAIGeneratingProcess(false);
                setShowProcessContent(false);
            } catch (error) {
                console.error("Error fetching AI processes:", error);
            }
        }
    };

    // These functions are no longer needed since we're making the UI view-only

    // This function is also no longer needed since we're making the UI view-only

    const selectedProcesses = entryType === "ai" ? aiProcesses : manualProcesses;
    
    // Function to validate if there are any manufacturing processes defined without setting state
    const checkProcessesValidity = (): boolean => {
        // Check if there are any entries in the process object
        if (Object.keys(selectedProcesses).length === 0) {
            return false;
        }
        
        // Check if any material has at least one process defined
        let hasAnyProcess = false;
        for (const materialClass in selectedProcesses) {
            if (selectedProcesses[materialClass] && selectedProcesses[materialClass].length > 0) {
                hasAnyProcess = true;
                break;
            }
        }
        
        return hasAnyProcess;
    };
    
    // Separate function that sets the validation error (to be called from event handlers, not during render)
    const validateProcesses = (): boolean => {
        const isValid = checkProcessesValidity();
        
        if (!isValid) {
            setValidationError("Please define at least one manufacturing process before proceeding.");
        } else {
            setValidationError("");
        }
        
        return isValid;
    };
    
    // Check validity without setting state for debugging and UI conditionals
    const hasValidProcesses = checkProcessesValidity();

    return (
        <div className="product-manufacturing">
            <div className="entry-method-container">
                <h3 className="entry-method-title">
                    How would you like to define manufacturing processes?
                    {/* <span
                        className="info-icon"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <FontAwesomeIcon icon={faInfoCircle} />
                        {showTooltip && (
                            <div className="tooltip">
                                Choose how you want to define manufacturing processes for your materials.
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
                            <p>Let AI suggest manufacturing processes based on your materials and product details.</p>
                            {entryType === "ai" && (
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        title="Generate Processes"
                                        className="generate-button"
                                        onClick={handleGenerate}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* <div 
                        className={`entry-method-card ${entryType === "manual" ? "active" : ""}`}
                        onClick={() => handleEntryTypeChange("manual")}
                    >
                        <div className="entry-card-icon">
                            <FontAwesomeIcon icon={faCogs} />
                        </div>
                        <div className="entry-card-content">
                            <h4>Manual Definition</h4>
                            <p>Manually specify manufacturing processes for each material in your product.</p>
                        </div>
                    </div> */}
                </div>
            </div>

            {entryType === "manual" && (
                <div className="manual-manufacturing-container">
                    <div className="manufacturing-process-editor">
                        <h3>Define Manufacturing Processes</h3>
                        <p className="editor-subtitle">Select a manufacturing process and sub-processes for each material. Your selections will be automatically saved.</p>
                        
                        <div className="material-cards-container">
                            {billMaterials.map((item) => (
                                <div key={item.materialClass} className="material-process-entry-card">
                                    <div className="material-header">
                                        <div className="material-info-row">
                                            <h4 className="material-name">{item.materialClass}</h4>
                                            {plan === 'professional' && (
                                                <span className="specific-material">({item.specificMaterial})</span>
                                            )}
                                            <span className="material-weight">{item.weight} {item.unit}</span>
                                        </div>
                                    </div>
                                    
                                    <ProcessEntry
                                        material={item}
                                        onProcessAdd={(process) => handleProcessAdd(item.materialClass, process)}
                                        uxpContext={uxpContext}
                                    />
                                    
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {aiGeneratingProcess && (
                <div className="ai-generating-process">
                    <div className="loader-spinner"></div>
                    <div className="generating-message">
                        <h4>AI is analyzing your materials</h4>
                        <p>Determining optimal manufacturing processes for each material in your product...</p>
                    </div>
                </div>
            )}

            {entryType === "ai" && !aiGeneratingProcess && Object.keys(selectedProcesses).length === 0 && (
                <div className="empty-processes-container">
                    <p>No manufacturing processes defined yet. Generate processes using AI or switch to manual entry.</p>
                </div>
            )}
            
            {/* Display AI-generated processes when they exist */}
            {entryType === "ai" && !aiGeneratingProcess && Object.keys(selectedProcesses).length > 0 && (
                <div className="ai-processes-container">
                    <div className="ai-processes-header">
                        <h3>
                            <FontAwesomeIcon icon={faRobot} className="ai-icon" />
                            AI-Generated Manufacturing Processes
                        </h3>
                        <p className="ai-subtitle">The following manufacturing processes have been generated based on your materials and product details. You can edit processes for each material if needed.</p>
                    </div>
                    
                    <div className="ai-material-cards">
                        {billMaterials.map((item) => {
                            // Check if we're currently editing this material
                            const isEditing = item.materialClass === editingMaterialId;
                            
                            return (
                                <div key={item.materialClass} className="ai-material-card">
                                    <div className="material-header">
                                        <div className="material-info-row">
                                            <h4 className="material-name">{item.materialClass}</h4>
                                            {plan === 'professional' && (
                                                <span className="specific-material">({item.specificMaterial})</span>
                                            )}
                                            <span className="material-weight">{item.weight} {item.unit}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="ai-processes">
                                        {isEditing ? (
                                            <div className="ai-process-edit-form">
                                                <ProcessEntry
                                                    material={item}
                                                    onProcessAdd={(process) => {
                                                        handleProcessAdd(item.materialClass, process);
                                                        setEditingMaterialId(null); // Exit edit mode
                                                    }}
                                                    uxpContext={uxpContext}
                                                />
                                                <div className="edit-actions">
                                                    <Button 
                                                        title="Cancel" 
                                                        className="cancel-edit-button"
                                                        onClick={() => setEditingMaterialId(null)} 
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                {selectedProcesses[item.materialClass]?.length > 0 ? (
                                                    <div>
                                                        {selectedProcesses[item.materialClass].map((process, index) => (
                                                            <div key={index} className="ai-process-item">
                                                                <div className="ai-process-header">
                                                                    <span className="ai-process-name">{process.category}</span>
                                                                    <Button
                                                                        title="Edit"
                                                                        className="edit-process-inline-button"
                                                                        onClick={() => setEditingMaterialId(item.materialClass)}
                                                                    />
                                                                </div>
                                                                <div className="ai-subprocess-list">
                                                                    {process.processes.map((subProcess, subIndex) => (
                                                                        <span key={subIndex} className="ai-subprocess-item">{subProcess}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="no-processes-found">
                                                        <p>No processes generated for this material.</p>
                                                        <Button 
                                                            title="Add Process" 
                                                            className="add-process-button"
                                                            onClick={() => setEditingMaterialId(item.materialClass)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Display validation error if any */}
            {validationError && !hasValidProcesses && (
                <div className="validation-error-container">
                    <p className="validation-error-message">{validationError}</p>
                </div>
            )}
        </div>
    );
};

export default ProductManufacturing;