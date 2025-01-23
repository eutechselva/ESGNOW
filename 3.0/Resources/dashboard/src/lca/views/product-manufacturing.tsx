import React, { useState } from "react";
import { Button, Select } from "uxp/components";
import ProcessEntry from "./process-entry";
import "./product-manufacturing.scss";
import { BillMaterial } from "../types/bill-material-type";
import { ProductManufacturingProcess } from "../types/product-manufacturing-process.type";
import { ProductCategoryInfo } from "../types/product-category-info.type";
import { ProductInfo } from "../types/product-info.type";
import API_BASE_URL from "../config";

interface ProductManufacturingProps {
    productCategoryData: ProductCategoryInfo;
    productData: ProductInfo;
    billMaterials: BillMaterial[];
}

const ProductManufacturing: React.FC<ProductManufacturingProps> = ({
    productCategoryData,
    productData,
    billMaterials,
}) => {
    const [entryType, setEntryType] = useState<"manual" | "ai">("ai");
    const [manualProcesses, setManualProcesses] = useState<Record<string, ProductManufacturingProcess[]>>({});
    const [aiProcesses, setAIProcesses] = useState<Record<string, ProductManufacturingProcess[]>>({});
    const [showProcessContent, setShowProcessContent] = useState(false);

    const entryOptions = [
        { label: "AI Assistance", value: "ai" },
        { label: "Manual Entry", value: "manual" },
        
    ];

    const handleEntryTypeChange = (newValue: "ai" | "manual") => {
        setEntryType(newValue);
        setShowProcessContent(false);
    };

    const handleProcessAdd = (materialId: string, process: { manufacturingProcess: string; subProcesses: string[] }) => {
        const newProcess: ProductManufacturingProcess = {
            category: process.manufacturingProcess, // Map manufacturingProcess to category
            processes: process.subProcesses, // Map subProcesses to processes
        };
    
        setManualProcesses((prev) => ({
            ...prev,
            [materialId]: [...(prev[materialId] || []), newProcess],
        }));
    };
    

    const handleAddProcess = () => {
        setShowProcessContent(true);
    };

    const handleGenerate = async () => {
        if (entryType === "ai") {
            try {
                const response = await fetch(`${API_BASE_URL}/api/classify-manufacturing-process`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        productCode: productData.code,
                        name: productData.name,
                        description: productData.description,
                        bom: billMaterials,
                    }),
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch manufacturing processes");
                }

                const apiResults: { materialClass: string; manufacturingProcesses: ProductManufacturingProcess[] }[] =
                    await response.json();

                const mappedProcesses: Record<string, ProductManufacturingProcess[]> = {};
                apiResults.forEach((item) => {
                    mappedProcesses[item.materialClass] = item.manufacturingProcesses;
                });

                setAIProcesses(mappedProcesses);
                setShowProcessContent(false);
            } catch (error) {
                console.error("Error fetching AI processes:", error);
            }
        }
    };

    const handleEditProcess = (materialClass: string, processIndex: number) => {
        console.log(`Editing process at index ${processIndex} for material class ${materialClass}`);
    };

    const handleDeleteProcess = (materialClass: string, processIndex: number) => {
        setManualProcesses((prev) => {
            const updatedProcesses = [...(prev[materialClass] || [])];
            updatedProcesses.splice(processIndex, 1);
            return {
                ...prev,
                [materialClass]: updatedProcesses,
            };
        });
        setAIProcesses((prev) => {
            const updatedProcesses = [...(prev[materialClass] || [])];
            updatedProcesses.splice(processIndex, 1);
            return {
                ...prev,
                [materialClass]: updatedProcesses,
            };
        });
    };

    const selectedProcesses = entryType === "ai" ? aiProcesses  : manualProcesses ;

    return (
        <div className="product-manufacturing">
            <div className="entry-type-select">
                <label htmlFor="entryType" className="select-method-label">
                    Select Method
                </label>
                <Select
                    options={entryOptions}
                    selected={entryType}
                    onChange={handleEntryTypeChange}
                />
                {entryType === "ai" && (
                    <Button
                        title="Generate"
                        className="generate-button"
                        onClick={handleGenerate}
                    />
                )}
                 {entryType === "manual" && (
                    <Button
                        title="Add Process"
                        className="add-process-button"
                        onClick={handleAddProcess}
                    />
                )}
            </div>

            {showProcessContent && entryType === "manual" &&
                billMaterials.map((item) => (
                    <div key={item.materialClass}>
                        <ProcessEntry
                            material={item}
                            onProcessAdd={(process) => handleProcessAdd(item.materialClass, process)}
                        />
                    </div>
                ))}

            {Object.keys(selectedProcesses).length > 0 && (
                <div className="process-summary">
                    <h3>Manufacturing Processes Summary ({entryType === "manual" ? "Manual" : "AI"})</h3>
                    <table className="summary-table">
                        <thead>
                            <tr>
                                <th>Material Class</th>
                                <th>Specific Material</th>
                                <th>Weight</th>
                                <th>Processes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {billMaterials.map((item) => (
                                <tr key={item.materialClass}>
                                    <td>{item.materialClass}</td>
                                    <td>{item.specificMaterial}</td>
                                    <td>{item.weight} {item.unit}</td>
                                    <td>
                                        {selectedProcesses[item.materialClass]?.map((process, index) => (
                                            <div key={index} className="process-item">
                                                <strong>{process.category}</strong>
                                                <ul>
                                                    {process.processes.map((subProcess, subIndex) => (
                                                        <li key={subIndex}>{subProcess}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </td>
                                    <td>
                                        {selectedProcesses[item.materialClass]?.map((_, index) => (
                                            <div key={index} className="action-buttons">
                                                <Button
                                                    title="Edit"
                                                    className="edit-button"
                                                    onClick={() => handleEditProcess(item.materialClass, index)}
                                                />
                                                <Button
                                                    title="Delete"
                                                    className="delete-button"
                                                    onClick={() => handleDeleteProcess(item.materialClass, index)}
                                                />
                                            </div>
                                        ))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ProductManufacturing;
