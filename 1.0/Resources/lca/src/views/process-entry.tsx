import React, { useState } from "react";
import { Select, FormField, Label, Button, MultiSelect } from "uxp/components";
import "./process-entry.scss";
import { BillMaterial } from "../types/bill-material-type";

interface ProcessEntryProps {
    material: BillMaterial;
    onProcessAdd: (process: { manufacturingProcess: string; subProcesses: string[] }) => void;
}

const ProcessEntry: React.FC<ProcessEntryProps> = ({ material, onProcessAdd }) => {
    const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
    const [selectedSubProcess, setSelectedSubProcess] = useState<string[] | null>([]);
    const [subProcesses, setSubProcesses] = useState<string[]>([]);
    const [isExpanded, setIsExpanded] = useState(true);


    const processOptions = [
        { label: "Casting", value: "Casting" },
        { label: "Molding", value: "Molding" },
        { label: "Machining", value: "Machining" },
    ];

    const subProcessOptions: Record<string, { label: string; value: string }[]> = {
        Casting: [
            { label: "Die Casting", value: "Die Casting" },
            { label: "Sand Casting", value: "Sand Casting" },
        ],
        Molding: [
            { label: "Injection Molding", value: "Injection Molding" },
            { label: "Blow Molding", value: "Blow Molding" },
        ],
        Machining: [
            { label: "CNC Milling", value: "CNC Milling" },
            { label: "Turning", value: "Turning" },
        ],
    };

    // const handleAddSubProcess = () => {
    //     // if (selectedSubProcess && !subProcesses.includes(selectedSubProcess)) {
    //     //     setSubProcesses([...subProcesses, selectedSubProcess]);
    //     //     setSelectedSubProcess(null);
    //     // }
    // };

    const handleAddProcess = () => {
        if (selectedProcess && selectedSubProcess.length > 0) {
            onProcessAdd({ manufacturingProcess: selectedProcess, subProcesses: selectedSubProcess });
            setSelectedProcess(null);
            setSubProcesses([]);
        }
    };

    return (
        <div className="process-entry-container">
            <div className="collapse-expand-toggle">
                <Button
                    title={isExpanded ? "Collapse" : "Expand"}
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="collapse-expand-button"
                />
            </div>

            {/* Material Summary */}
            <div className="material-summary">
                <p><strong>Material Class:</strong> {material.materialClass}</p>
                <p><strong>Specific Material:</strong> {material.specificMaterial}</p>
                <p><strong>Weight:</strong> {material.weight} {material.unit}</p>
            </div>

            {isExpanded && (
                <div className="process-entry">


                    {/* Manufacturing Process Select */}
                    <FormField className="form-field">
                        <Label>Manufacturing Process</Label>
                        <Select
                            options={processOptions}
                            selected={selectedProcess}
                            onChange={(value) => setSelectedProcess(value)}
                            placeholder="Select manufacturing process"
                        />
                    </FormField>

                    {/* Sub Process Select */}
                    <FormField className="form-field">
                        <Label>Sub Process</Label>
                        <MultiSelect
                            options={
                                selectedProcess
                                    ? subProcessOptions[selectedProcess]
                                    : [{ label: "Select Manufacturing Process first", value: "" }]
                            }
                            selected={selectedSubProcess}
                            onChange={(newValues) => setSelectedSubProcess(newValues)}
                            placeholder="Select sub processes"
                        />
                    </FormField>

                    {/* Button and List of Selected Sub Processes */}
                    <Button
                        title="Save Manufacturing Process"
                        onClick={handleAddProcess}
                        disabled={!selectedProcess || selectedSubProcess.length === 0}
                        className="save-process-button"
                    />
                </div>
            )}

            {/* List of Added Sub Processes */}
            {/* {selectedSubProcess.length > 0 && (
            <div className="sub-process-list">
                <h4>Added Sub Processes:</h4>
                {selectedSubProcess.map((subProcess, index) => (
                    <p key={index} className="sub-process-item">{subProcess}</p>
                ))}
            </div>
        )} */}
        </div>
    );
};

export default ProcessEntry;  