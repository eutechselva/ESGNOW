import React, { useState, useEffect, useRef } from "react";
import { Select, FormField, Label, Button, MultiSelect, Loading } from "uxp/components";
import "./process-entry.scss";
import { BillMaterial } from "../types/bill-material-type";
import { getManufacturingProcesses } from "../../esgnow-service";
import { IContextProvider } from "@uxp";

interface ProcessEntryProps {
    material: BillMaterial;
    onProcessAdd: (process: { manufacturingProcess: string; subProcesses: string[] }) => void;
    uxpContext: IContextProvider;
}

const ProcessEntry: React.FC<ProcessEntryProps> = ({ material, onProcessAdd, uxpContext }) => {
    const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
    const [selectedSubProcess, setSelectedSubProcess] = useState<string[] | null>([]);
    const [subProcesses, setSubProcesses] = useState<string[]>([]);
    const [isExpanded, setIsExpanded] = useState(true);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // State for API data
    const [processOptions, setProcessOptions] = useState<{ label: string; value: string }[]>([]);
    const [subProcessOptions, setSubProcessOptions] = useState<Record<string, { label: string; value: string }[]>>({});
    
    // Fetch manufacturing processes from API
    useEffect(() => {
        const fetchManufacturingProcesses = async () => {
            try {
                setLoading(true);
                const response = await getManufacturingProcesses(uxpContext);
                
                if (!response.data ) {
                    setError("Failed to fetch manufacturing processes");
                    return;
                }
                
                const data = response.data;
                
                // Convert the API response to the required format
                const processes = Object.keys(data).map(process => ({
                    label: process,
                    value: process
                }));
                
                // Create a mapping for sub-processes
                const subProcessMapping: Record<string, { label: string; value: string }[]> = {};
                Object.entries(data).forEach(([process, subProcessList]) => {
                    subProcessMapping[process] = (subProcessList as string[]).map(subProcess => ({
                        label: subProcess,
                        value: subProcess
                    }));
                });
                
                setProcessOptions(processes);
                setSubProcessOptions(subProcessMapping);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching manufacturing processes:", err);
                setError("An error occurred while fetching manufacturing processes");
                setLoading(false);
            }
        };
        
        fetchManufacturingProcesses();
    }, [uxpContext]);

    // const handleAddSubProcess = () => {
    //     // if (selectedSubProcess && !subProcesses.includes(selectedSubProcess)) {
    //     //     setSubProcesses([...subProcesses, selectedSubProcess]);
    //     //     setSelectedSubProcess(null);
    //     // }
    // };

    // Use refs to keep track of previous selections to avoid infinite loops
    const prevSelectionRef = useRef<{process: string | null, subProcesses: string[] | null}>({
        process: null,
        subProcesses: null
    });
    
    // Auto-update parent when selections change
    useEffect(() => {
        // Only update if we have a valid selection
        if (selectedProcess && selectedSubProcess && selectedSubProcess.length > 0) {
            // Check if the selection has actually changed
            const prevProcess = prevSelectionRef.current.process;
            const prevSubProcesses = prevSelectionRef.current.subProcesses;
            
            // Check if the selection has changed
            const hasProcessChanged = prevProcess !== selectedProcess;
            const hasSubProcessesChanged = !prevSubProcesses || 
                prevSubProcesses.length !== selectedSubProcess.length ||
                !prevSubProcesses.every(p => selectedSubProcess.includes(p));
            
            // Only update if something has changed
            if (hasProcessChanged || hasSubProcessesChanged) {
                // Update our reference to the current selection
                prevSelectionRef.current = {
                    process: selectedProcess,
                    subProcesses: [...selectedSubProcess]
                };
                
                // Call the handler
                onProcessAdd({ manufacturingProcess: selectedProcess, subProcesses: selectedSubProcess });
            }
        }
    // We're intentionally omitting onProcessAdd from dependencies to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProcess, selectedSubProcess]);

    return (
        <div className="process-entry-form">
            {loading ? (
                <div className="loading-container">
                    <Loading />
                    <p>Loading manufacturing processes...</p>
                </div>
            ) : error ? (
                <div className="error-message">
                    <p>{error}</p>
                    <Button 
                        title="Retry" 
                        onClick={() => {
                            setError(null);
                            setLoading(true);
                            getManufacturingProcesses(uxpContext)
                                .then(response => {
                                    if (!response.data) {
                                        setError("Failed to fetch manufacturing processes");
                                        return;
                                    }
                                    
                                    const data = response.data;
                                    
                                    // Convert the API response to the required format
                                    const processes = Object.keys(data).map(process => ({
                                        label: process,
                                        value: process
                                    }));
                                    
                                    // Create a mapping for sub-processes
                                    const subProcessMapping: Record<string, { label: string; value: string }[]> = {};
                                    Object.entries(data).forEach(([process, subProcessList]) => {
                                        subProcessMapping[process] = (subProcessList as string[]).map(subProcess => ({
                                            label: subProcess,
                                            value: subProcess
                                        }));
                                    });
                                    
                                    setProcessOptions(processes);
                                    setSubProcessOptions(subProcessMapping);
                                    setLoading(false);
                                })
                                .catch(err => {
                                    console.error("Error fetching manufacturing processes:", err);
                                    setError("An error occurred while fetching manufacturing processes");
                                    setLoading(false);
                                });
                        }}
                    />
                </div>
            ) : (
                <div className="process-form-fields">
                    {/* Manufacturing Process Select */}
                    <FormField className="form-field">
                        <Label>Manufacturing Process</Label>
                        <Select
                            options={processOptions}
                            selected={selectedProcess}
                            onChange={(value) => {
                                setSelectedProcess(value);
                                setSelectedSubProcess([]);
                            }}
                            placeholder="Select manufacturing process"
                        />
                    </FormField>

                    {/* Sub Process Select */}
                    <FormField className="form-field">
                        <Label>Sub Process</Label>
                        <MultiSelect
                            options={
                                selectedProcess && subProcessOptions[selectedProcess]
                                    ? subProcessOptions[selectedProcess]
                                    : [{ label: "Select Manufacturing Process first", value: "" }]
                            }
                            selected={selectedSubProcess}
                            onChange={(newValues) => setSelectedSubProcess(newValues)}
                            placeholder={selectedProcess ? "Select sub processes" : "Select Manufacturing Process first"}
                        />
                    </FormField>
                    
                    {selectedProcess && selectedSubProcess.length > 0 && (
                        <div className="selected-process-summary">
                            <div className="selected-manufacturing-process">
                                <span className="selected-label">Selected Process:</span>
                                <span className="selected-value">{selectedProcess}</span>
                            </div>
                            <div className="selected-sub-processes">
                                <span className="selected-label">Selected Sub-processes:</span>
                                <div className="selected-chips">
                                    {selectedSubProcess.map((subProcess, index) => (
                                        <span key={index} className="sub-process-chip">{subProcess}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProcessEntry;  