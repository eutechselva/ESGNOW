import React, { useState } from "react";
import { Button, Select, Input } from "uxp/components";
import ProcessEntry from "./process-entry";
import "./product-manufacturing.scss";
import { BillMaterial } from "../types/bill-material-type";
import { ProductManufacturingProcess } from "../types/product-manufacturing-process.type";
import { ProductCategoryInfo } from "../types/product-category-info.type";
import { ProductInfo } from "../types/product-info.type";
import { IContextProvider } from "@uxp";
import { classifyManufacturingProcess } from "../../esgnow-service";
import { faInfoCircle, faRobot, faEdit, faWrench, faCogs, faIndustry } from "@fortawesome/free-solid-svg-icons";
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
    const [editingProcess, setEditingProcess] = useState<{ materialClass: string, processIndex: number } | null>(null);
    const [editedProcess, setEditedProcess] = useState<ProductManufacturingProcess | null>(null);
    const [showTooltip, setShowTooltip] = useState<boolean>(false);
    const [plan, setPlan] = useState<string>();

    const entryOptions = [
        { label: "AI Assistance", value: "ai" },
        { label: "Manual Entry", value: "manual" },
    ];

    const handleEntryTypeChange = (newValue: "ai" | "manual") => {
        // Only set showProcessContent to false if changing from manual to AI
        // This preserves any open process forms when switching to manual
        if (entryType === "manual" && newValue === "ai") {
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

        setManualProcesses((prev) => {
            const updatedProcesses = {
                ...prev,
                [materialId]: [...(prev[materialId] || []), newProcess],
            };
            
            // Update the parent component's state for both manual and AI processes
            updateParentManufacturingProcess(updatedProcesses);
            
            return updatedProcesses;
        });
    };
    
    // Helper function to update the parent component's state
    const updateParentManufacturingProcess = (processes: Record<string, ProductManufacturingProcess[]>) => {
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
        onProductManufacturingChange(manufacturingProcesses);
    };

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

                setPlan(response.data.plan.plan);

                const mappedProcesses: Record<string, ProductManufacturingProcess[]> = {};
                apiResults.forEach((item) => {
                    mappedProcesses[item.materialClass] = item.manufacturingProcesses;
                });

                setAIProcesses(mappedProcesses);
                onProductManufacturingChange(apiResults);
                setAIGeneratingProcess(false);
                setShowProcessContent(false);
            } catch (error) {
                console.error("Error fetching AI processes:", error);
            }
        }
    };

    const handleEditProcess = (materialClass: string, processIndex: number) => {
        const processes = entryType === "ai" ? aiProcesses[materialClass] : manualProcesses[materialClass];
        setEditingProcess({ materialClass, processIndex });
        setEditedProcess(processes[processIndex]);
    };

    const handleSaveProcess = () => {
        if (editingProcess && editedProcess) {
            const { materialClass, processIndex } = editingProcess;
            const processes = entryType === "ai" ? aiProcesses[materialClass] : manualProcesses[materialClass];
            const updatedProcesses = [...processes];
            updatedProcesses[processIndex] = editedProcess;

            if (entryType === "ai") {
                setAIProcesses((prev) => {
                    const newProcesses = {
                        ...prev,
                        [materialClass]: updatedProcesses,
                    };
                    updateParentManufacturingProcess(newProcesses);
                    return newProcesses;
                });
            } else {
                setManualProcesses((prev) => {
                    const newProcesses = {
                        ...prev,
                        [materialClass]: updatedProcesses,
                    };
                    updateParentManufacturingProcess(newProcesses);
                    return newProcesses;
                });
            }

            setEditingProcess(null);
            setEditedProcess(null);
        }
    };

    const handleDeleteProcess = (materialClass: string, processIndex: number) => {
        if (entryType === "manual") {
            setManualProcesses((prev) => {
                const updatedProcesses = [...(prev[materialClass] || [])];
                updatedProcesses.splice(processIndex, 1);
                const newProcesses = {
                    ...prev,
                    [materialClass]: updatedProcesses,
                };
                updateParentManufacturingProcess(newProcesses);
                return newProcesses;
            });
        } else {
            setAIProcesses((prev) => {
                const updatedProcesses = [...(prev[materialClass] || [])];
                updatedProcesses.splice(processIndex, 1);
                const newProcesses = {
                    ...prev,
                    [materialClass]: updatedProcesses,
                };
                updateParentManufacturingProcess(newProcesses);
                return newProcesses;
            });
        }
    };

    const selectedProcesses = entryType === "ai" ? aiProcesses : manualProcesses;
    
    // Debug logs to verify button conditions
    console.log("Entry Type is AI:", entryType === "ai");
    console.log("AI Generating Process:", aiGeneratingProcess);
    console.log("Selected Processes Keys:", Object.keys(selectedProcesses));
    console.log("Show Create Button:", entryType === "ai" && !aiGeneratingProcess);

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
                    
                    <div 
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
                    </div>
                </div>
            </div>

            {entryType === "manual" && !showProcessContent && Object.keys(selectedProcesses).length === 0 && (
                <div className="manual-entry-prompt">
                    <p>Click the button below to start defining manufacturing processes for your materials.</p>
                    <Button
                        title="Define Manufacturing Processes"
                        className="define-processes-button"
                        onClick={handleAddProcess}
                    />
                </div>
            )}

            {showProcessContent && entryType === "manual" &&
                billMaterials.map((item) => (
                    <div key={item.materialClass}>
                        <ProcessEntry
                            material={item}
                            onProcessAdd={(process) => handleProcessAdd(item.materialClass, process)}
                        />
                    </div>
                ))}

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

            {Object.keys(selectedProcesses).length > 0 && (
                <div className="process-summary">
                    <div className="process-summary-header">
                        <h3>
                            <FontAwesomeIcon icon={faIndustry} className="summary-icon" />
                            Manufacturing Processes 
                            <span className="method-badge">{entryType === "manual" ? "Manual" : "AI-Generated"}</span>
                        </h3>
                    </div>
                    
                    <div className="material-process-cards">
                        {billMaterials.map((item) => (
                            <div key={item.materialClass} className="material-process-card">
                                <div className="material-header">
                                    <div className="material-info">
                                        <h4 className="material-name">{item.materialClass}</h4>
                                        <div className="material-details">
                                            {plan === 'professional' && (
                                                <span className="specific-material">{item.specificMaterial}</span>
                                            )}
                                            <span className="material-weight">{item.weight} {item.unit}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="process-list">
                                    {selectedProcesses[item.materialClass]?.length > 0 ? (
                                        selectedProcesses[item.materialClass].map((process, index) => (
                                            <div key={index} className="process-item">
                                                <div className="process-content">
                                                    {editingProcess?.materialClass === item.materialClass && 
                                                    editingProcess.processIndex === index ? (
                                                        <div className="process-edit-form">
                                                            <label>Process Category:</label>
                                                            <Input
                                                                value={editedProcess?.category || ""}
                                                                onChange={(val) => setEditedProcess((prev) => 
                                                                    prev ? { ...prev, category: val } : null)}
                                                                className="process-edit-input"
                                                            />
                                                            <label>Sub-processes:</label>
                                                            {editedProcess?.processes.map((subProcess, subIndex) => (
                                                                <div key={subIndex} className="subprocess-edit">
                                                                    <Input
                                                                        value={subProcess}
                                                                        onChange={(val) => {
                                                                            const updatedProcesses = [...(editedProcess.processes || [])];
                                                                            updatedProcesses[subIndex] = val;
                                                                            setEditedProcess((prev) => 
                                                                                prev ? { ...prev, processes: updatedProcesses } : null);
                                                                        }}
                                                                        className="subprocess-edit-input"
                                                                    />
                                                                </div>
                                                            ))}
                                                            <div className="edit-actions">
                                                                <Button
                                                                    title="Save Changes"
                                                                    className="save-button"
                                                                    onClick={handleSaveProcess}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="process-header">
                                                                <h5 className="process-category">
                                                                    <FontAwesomeIcon icon={faWrench} className="process-icon" />
                                                                    {process.category}
                                                                </h5>
                                                                <div className="process-actions">
                                                                    <button 
                                                                        className="icon-button edit"
                                                                        onClick={() => handleEditProcess(item.materialClass, index)}
                                                                        title="Edit Process"
                                                                    >
                                                                        <FontAwesomeIcon icon={faEdit} />
                                                                    </button>
                                                                    <button 
                                                                        className="icon-button delete"
                                                                        onClick={() => handleDeleteProcess(item.materialClass, index)}
                                                                        title="Delete Process"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <ul className="subprocess-list">
                                                                {process.processes.map((subProcess, subIndex) => (
                                                                    <li key={subIndex} className="subprocess-item">{subProcess}</li>
                                                                ))}
                                                            </ul>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-processes">
                                            <p>No manufacturing processes defined for this material.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="processes-actions">
                        {entryType === "manual" && !showProcessContent && (
                            <Button
                                className="add-more-processes-button"
                                title="Add More Processes"
                                onClick={handleAddProcess}
                            />
                        )}
                       
                    </div>
                </div>
            )}
            
        </div>
    );
};

export default ProductManufacturing;