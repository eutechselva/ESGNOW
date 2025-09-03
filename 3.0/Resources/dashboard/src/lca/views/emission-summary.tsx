
import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, FormField, Label, Select } from 'uxp/components';
import { Modal } from 'uxp/components';
import { ProductInfoSummary } from '../types/product-info-summary.type';
import { TransportLeg } from '../types/transport-leg.type';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official'
import { createProject, createProjectProductMap, projectProductMapping, getAllProjects, addProductToProject } from "../../esgnow-service";
import { IContextProvider } from '@uxp';
import './emission-summary.scss';

interface SaveResultsModalProps {
    onClose: () => void;
    onSaveComplete: () => void; 
    hasExistingProjects: boolean;
    setHasExistingProjects: (value: boolean) => void;
    product: ProductInfoSummary;
    packageWeight: Number;
    palletWeight: Number;
    transportationEmission: string;
    transportLegs: TransportLeg[];
    uxpContext: IContextProvider;
    className?: string; // Added className property
}

interface ProjectOption {
    label: string;
    value: string;
}

const SaveResultsModal: React.FC<SaveResultsModalProps> = ({
    onClose,
    onSaveComplete,
    hasExistingProjects,
    setHasExistingProjects,
    product,
    packageWeight,
    palletWeight,
    transportationEmission,
    transportLegs,
    uxpContext
}) => {

    // Create a safety check for context
    const mockContextRef = useRef<IContextProvider | null>(null);
    
    // Initialize fallback mock context if needed
    useEffect(() => {
        if (!uxpContext && !mockContextRef.current) {
            console.warn("SaveResultsModal: Creating fallback mock context");
            mockContextRef.current = createMockContext();
        }
    }, [uxpContext]);
    
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [projectName, setProjectName] = useState('');
    const [projectId, setProjectId] = useState('');
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [projectsLoaded, setProjectsLoaded] = useState(false);

    // Fetch existing projects
    useEffect(() => {
        async function fetchProjects() {
            // Use mock context as a fallback if real context is missing
            const effectiveContext = uxpContext || mockContextRef.current;
            
            if (!effectiveContext) {
                console.error("Both uxpContext and mockContextRef.current are undefined when fetching projects");
                return;
            }
            
            setLoadingProjects(true);
            try {
                const response = await getAllProjects(effectiveContext, {});
                if (response.data && Array.isArray(response.data.projects)) {
                    const options = response.data.projects.map((project : any) => ({
                        label: project.projectName,
                        value: project._id
                    }));
                    setProjectOptions(options);
                    setProjectsLoaded(true);
                    
                    // Update hasExistingProjects based on actual data
                    if (options.length > 0) {
                        setHasExistingProjects(true);
                    }
                } else {
                    // If no projects or error, use empty array
                    setProjectOptions([]);
                    console.warn("No projects found or invalid response format", response);
                }
            } catch (err) {
                console.error("Error fetching projects:", err);
                setProjectOptions([]);
            } finally {
                setLoadingProjects(false);
            }
        }
        
        fetchProjects();
    }, [uxpContext]);

// In SaveResultsModal, add detailed debugging to handleSave:

const handleSave = async () => {
    
    // Debug log to check uxpContext right before we use it
    console.log("SaveResultsModal handleSave - uxpContext before API call:", uxpContext);
    
    // Use mock context as a fallback if real context is missing
    const effectiveContext = uxpContext || mockContextRef.current;
    
    if (!effectiveContext) {
        console.error("Both uxpContext and mockContextRef.current are undefined in SaveResultsModal handleSave");
        setError('System error: Missing context. Please try again later.');
        return;
    }
    
    // Add warning if using mock context
    if (!uxpContext && mockContextRef.current) {
        console.warn("Using mock context for API calls - changes will not persist!");
    }
    
    if (selectedCard === 'new') {
        console.log("Taking 'new' project path");
        if (!projectName || !projectId) {
            console.log("Validation failed: missing projectName or projectId");
            setError('Please fill in both project name and code');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Step 1: Create the project (without products)
            const createProjectPayload = {
                code: projectId,
                name: projectName
            };
            
            console.log("Creating project:", createProjectPayload);
            const projectResponse = await createProject(effectiveContext, createProjectPayload);
            console.log("Project created successfully:", projectResponse);
            
            if (!projectResponse.data) {
                throw new Error('Failed to create project');
            }
            
            // Verify we have a valid project ID
            const projectID = projectResponse.data._id;
            if (!projectID) {
                console.error("Project created but missing _id:", projectResponse.data);
                throw new Error('Project created but missing ID');
            }
            console.log("Successfully created project with ID:", projectID);
            
            // Step 2: Map the product to the newly created project
            const createProjectProductMapPayload = {
                projectID: projectID,
                products :[{
                    productID: product._id,
                packagingWeight: packageWeight,
                palletWeight: palletWeight,
                 totalTransportationEmission: transportationEmission,
                transportationLegs: transportLegs,
               
                }],
                
                
            };
            
            console.log("Adding product to project:", createProjectProductMapPayload);
            let mappingResponse;
            try {
                mappingResponse = await createProjectProductMap(effectiveContext, createProjectProductMapPayload);
                console.log("Product added to project successfully:", mappingResponse);
                
                if (!mappingResponse.data) {
                    throw new Error('API returned success but no data in response');
                }
            } catch (err) {
                console.error("Error adding product to project:", err);
                throw new Error(`Failed to add product to project: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }

            onClose();
            console.log("About to call onSaveComplete");
            onSaveComplete();
            console.log("Callbacks completed");
            
        } catch (err) {
            console.error("Error creating project with product:", err);
            setError(err instanceof Error ? err.message : 'Failed to create project with product');
        } finally {
            setIsLoading(false);
        }
    } else if (selectedCard === 'existing') {
        console.log("Taking 'existing' project path");
        // ... similar debugging for existing project path
        if (!selectedProject) {
            console.log("Validation failed: no project selected");
            setError('Please select a project');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log("Using addProductToProject API endpoint");
            
            // Verify we have a valid project ID from selection
            if (!selectedProject) {
                throw new Error('Selected project ID is empty or invalid');
            }
            console.log("Using selected project ID:", selectedProject);
            
            // Format the payload to match the expected structure of the API
            const addProductPayload = {
                projectID: selectedProject,
                productID: product._id,
                packagingWeight: packageWeight,
                palletWeight: palletWeight,
                transportationLegs: transportLegs,
                totalTransportationEmission: transportationEmission
            };
            
            console.log("Adding product to existing project payload:", addProductPayload);
            
            // Call the API to add product to existing project
            const mappingResponse = await addProductToProject(effectiveContext, addProductPayload);
            console.log('Product added to existing project response:', mappingResponse);
            
            if (!mappingResponse.data) {
                throw new Error('Failed to add product to project (no data in response)');
            }

            console.log("About to call callbacks for existing project");
            onClose();
            onSaveComplete();
            console.log("Callbacks completed for existing project");
        } catch (err) {
            console.error("Error adding product to existing project:", err);
            setError(err instanceof Error ? err.message : 'Failed to add product to project');
        } finally {
            setIsLoading(false);
        }
    } else {
        console.log("No card selected - this shouldn't happen");
    }
};
    return (
        <Modal className="esgnow-save-results" show={true} onClose={onClose} title="Save Transportation Results" > 
            <div className="esgnow-save-results-modal">
                {hasExistingProjects ? (
                    <p>Would you like to save these results by creating a new project or adding them to an existing one?</p>
                ) : (
                    <p>No existing projects found. Please create a new project.</p>
                )}

                <div className="esgnow-card-container">
                    <div
                        className={`esgnow-option-card ${selectedCard === 'new' ? 'esgnow-selected' : ''}`}
                        onClick={() => setSelectedCard('new')}
                    >
                        <h3>Create New Project</h3>
                        <p>Start a fresh project with these results.</p>
                    </div>
                    {hasExistingProjects && (
                        <div
                            className={`esgnow-option-card ${selectedCard === 'existing' ? 'esgnow-selected' : ''}`}
                            onClick={() => setSelectedCard('existing')}
                        >
                            <h3>Add to Existing Project</h3>
                            <p>Include these results in one of your existing projects.</p>
                        </div>
                    )}
                </div>

                {selectedCard === 'new' && (
                    <div className="esgnow-new-project-inputs">
                        <FormField>
                            <Label><span style={{ fontSize: '12px' }}>Project Name</span></Label>
                            <Input
                                type="text"
                                value={projectName}
                                onChange={(value) => setProjectName(value)}
                                placeholder="Enter project name"
                            />
                        </FormField>
                        <FormField>
                            <Label><span style={{ fontSize: '12px' }}>Project Code</span></Label>
                            <Input
                                type="text"
                                value={projectId}
                                onChange={(value) => setProjectId(value)}
                                placeholder="Enter project ID"
                            />
                        </FormField>
                    </div>
                )}

                {selectedCard === 'existing' && (
                    <div className="esgnow-existing-project-selection">
                        <FormField>
                            <Label><span style={{ fontSize: '12px' }}>Select an existing project</span></Label>
                            {loadingProjects ? (
                                <div className="esgnow-loading-indicator">Loading projects...</div>
                            ) : projectOptions.length > 0 ? (
                                <Select
                                    options={projectOptions}
                                    selected={selectedProject}
                                    onChange={(newValue) => setSelectedProject(newValue)}
                                    placeholder="Select a project"
                                />
                            ) : (
                                <div className="esgnow-no-projects-message">
                                    No existing projects found. Please create a new project.
                                </div>
                            )}
                        </FormField>
                    </div>
                )}

                {error && (
                    <div className="esgnow-error-message" style={{ color: 'red', marginBottom: '10px' }}>
                        {error}
                    </div>
                )}

                <div className="esgnow-save-button-container">
                    <Button
                        title={isLoading ? "Saving..." : "Save"}
                        onClick={handleSave}
                        className="esgnow-save-results"
                        disabled={isLoading}
                    />
                </div>
            </div>
        </Modal>
    );
};


// Create a mock context as a fallback when real context is missing
const createMockContext = () => {
    console.warn("Creating mock UXP context as a fallback");
    // Create a simpler mock with just the essential methods we need
    return {
        executeComponent: (serviceName, route, method, params, body, headers, config) => {
            console.warn(`MOCK executeComponent called: ${serviceName} - ${route}`);
            
            // Return specific mock data based on the route
            if (route === '/api/projects') {
                return Promise.resolve({
                    data: {
                        projects: [
                            {
                                _id: "mock_project_1",
                                projectCode: "P001",
                                projectName: "Mock Project 1"
                            },
                            {
                                _id: "mock_project_2",
                                projectCode: "P002",
                                projectName: "Mock Project 2"
                            }
                        ]
                    }
                });
            }
            
            // Default response for other routes
            return Promise.resolve({
                data: { 
                    _id: "mock_" + Math.random().toString(36).substring(2),
                    mockGenerated: true,
                    timestamp: new Date().toISOString()
                }
            });
        },
        getUserDetails: () => Promise.resolve({
            name: "Mock User",
            id: "mock-user-id",
            key: "mock-user-key",
            email: "mock@example.com",
            userGroup: "user"
        })
        // We're using type assertion below to avoid implementing the full interface
    } as IContextProvider;
};

const EmissionSummary: React.FC<{
    product: ProductInfoSummary;
    transportationEmission: string;
    onBack ?: () => void;
    onCloseModal ?: ()=>void;
    transportLegs: TransportLeg[];
    uxpContext: IContextProvider;
    packageWeight: Number;
    palletWeight: Number;
    hideHeader?: boolean;
    plan :string;
}> = ({ product, onBack , onCloseModal,transportationEmission, transportLegs, uxpContext , packageWeight,palletWeight ,hideHeader ,plan}) => {

    // Create a ref to persist the uxpContext across renders
    const contextRef = useRef<IContextProvider | null>(null);
    
    // Debug logs to check if uxpContext is defined
    console.log("EmissionSummary - uxpContext received:", uxpContext);
    
    // Initialize with a mock context if needed
    useEffect(() => {
        if (!contextRef.current && !uxpContext) {
            console.warn("No context available, creating mock context");
            contextRef.current = createMockContext();
        }
    }, []);
    
    // Update the ref whenever uxpContext changes and is not null
    useEffect(() => {
        if (uxpContext) {
            console.log("EmissionSummary - Storing real uxpContext in ref");
            contextRef.current = uxpContext;
        }
    }, [uxpContext]);
    
    // Log current ref value after update
    useEffect(() => {
        console.log("EmissionSummary - contextRef.current status:", !!contextRef.current);
    }, [contextRef.current]);

    const transportationEmissionEx = parseFloat(transportationEmission);
    const [isExpanded, setIsExpanded] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const handleViewToggle = (mode: 'list' | 'tree') => setViewMode(mode);
    const [showModal, setShowModal] = useState(false);
    const [hasExistingProjects, setHasExistingProjects] = useState(false);
    const [showProjects, setShowProjects] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview'|'materials' | 'manufacturing' | 'transportation'>('overview');
    
    // Check if existing projects are available
    useEffect(() => {
        const checkForExistingProjects = async () => {
            const effectiveContext = uxpContext || contextRef.current;
            if (!effectiveContext) return;
            
            try {
                const response = await getAllProjects(effectiveContext, {});
                console.log("Projects response:", response);
                // Check for projects in the response.data.projects array
                if (response.data && 
                    (Array.isArray(response.data.projects) && response.data.projects.length > 0) || 
                    (Array.isArray(response.data) && response.data.length > 0)) {
                    setHasExistingProjects(true);
                }
            } catch (err) {
                console.error("Error checking for existing projects:", err);
            }
        };
        
        checkForExistingProjects();
    }, [uxpContext, contextRef.current]);

    const formatTransportMode = (mode: string): string => {
    return mode.replace(/([A-Z])/g, ' $1').trim();
};

    // Calculate total value for the display box
    const totalValue = (
        Number(product.co2EmissionRawMaterials || 0) + 
        Number(product.co2EmissionFromProcesses || 0) + 
        Number(transportationEmission || 0)
    ).toFixed(2);

    const donutChartOptions: Highcharts.Options = {
        chart: {
            type: 'pie',
            backgroundColor: null,
            height: 350,
            width: 600,
        },
        title: {
            text: '',
        },
        plotOptions: {
            pie: {
                innerSize: '60%',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b><br>{point.y:.2f} KgCO₂e',
                    style: {
                        fontSize: '12px',
                        fontWeight: 'bold',
                        
                        color: '#424242',
                    },
                },
            },
        },
        series: [
            {
                name: 'Contribution',
                type: 'pie',
                data: [
                    { name: 'Raw Materials', y: Number(product.co2EmissionRawMaterials || 0), color: '#78BE7C' },
                    { name: 'Manufacturing', y: Number(product.co2EmissionFromProcesses || 0), color: '#ffaa00' },
                    { name: 'Transportation', y: Number(transportationEmission || 0), color: '#2A9D8F' },
                ],
            },
        ],
        legend: {
            enabled: true,
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'bottom',
            symbolRadius: 5,
            symbolHeight: 10,
            symbolWidth: 10,
            itemMarginTop: 5,
            itemStyle: {
                
                fontWeight: 'bold',
                fontSize: '12px',
            },
        },
        tooltip: {
            pointFormat: '<b>{point.name}</b>: {point.y} KgCO₂e ({point.percentage:.1f}%)',
        },
        credits: {
            enabled: false,
        },
    };

    const renderOverviewTab = () => (
        <div className="esgnow-tab-content">
            <div className="esgnow-product-info-summary">
            <div
                className="esgnow-summary-image"
                style={{
                    backgroundImage: Array.isArray(product.images) && product.images.length > 0 ? `url(${product.images[0]})` : 'none',
                }}
                >
                {!(Array.isArray(product.images) && product.images.length > 0) && (
                    <div className="esgnow-image-placeholder">Image Unavailable</div>
                )}
            </div>


                <div className="esgnow-summary-details">
                    <div className="esgnow-detail-grid">
                        <div className="esgnow-detail-item">
                            <strong>Project Code</strong>
                            <p>{product.code}</p>
                        </div>
                        <div className="esgnow-detail-item">
                            <strong>Product Category</strong>
                            <p>{product.category}</p>
                        </div>
                        <div className="esgnow-detail-item">
                            <strong>Sub Category</strong>
                            <p>{product.subCategory}</p>
                        </div>
                        <div className="esgnow-detail-item">
                            <strong>Weight</strong>
                            <p>{product.weight} Kg</p>
                        </div>
                        <div className="esgnow-detail-item">
                            <strong>Country of Manufacture</strong>
                            <p>
                                {product.countryOfOrigin === "CN" ? "China" :
                                product.countryOfOrigin === "VN" ? "Vietnam" :
                                product.countryOfOrigin}
                            </p>
                        </div>
                    </div>
                    <div className="esgnow-description-field">
                        <strong>Product Description</strong>
                        <div className="esgnow-rich-text-editor">
                            <textarea 
                                defaultValue={product.description}
                                className="esgnow-editable-description"
                                rows={4}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="esgnow-widget esgnow-product-footprint">
                <h3>Product Carbon Footprint Breakdown</h3>
                <div className="esgnow-widget-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <HighchartsReact highcharts={Highcharts} options={donutChartOptions} />
                        <div 
                            style={{
                                border: '2px solid #e0e0e0',
                                borderRadius: '8px',
                                padding: '20px',
                                backgroundColor: '#f9f9f9',
                                textAlign: 'center',
                                minWidth: '150px'
                            }}
                        >
                            <div style={{
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: '#424242',
                               
                            }}>
                                {totalValue} KgCO₂e
                            </div>
                            <div style={{
                                fontSize: '14px',
                                color: '#666',
                                marginTop: '5px',
                                
                            }}>
                                Total Footprint
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderMaterialsTab = () => (
        <div className="esgnow-tab-content">
            <div className="esgnow-widget esgnow-contribution-raw-material">
                <h3>Contribution by Raw Material</h3>
                <div className="esgnow-widget-content">
                    <table>
                        <thead>
                            <tr>
                                <th>Material Class</th>
                                { (plan == 'professional' &&  <th>Specific Material</th>)  }
                                <th>Contribution</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                // Define material type
                                interface Material {
                                    materialClass: string;
                                    specificMaterial?: string;
                                    emissionFactor: number;
                                    quantity?: number;
                                }
                                
                                // Calculate the total emission factor
                                const materials: Material[] = Array.isArray(product.materials) ? product.materials : [];
                                const totalEmissionFactor = materials.reduce(
                                    (sum: number, item: Material) => sum + (item.emissionFactor || 0),
                                    0
                                );

                                // Sort the materials by emissionFactor in descending order
                                const sortedMaterials = [...materials].sort((a: Material, b: Material) => 
                                    (b.emissionFactor || 0) - (a.emissionFactor || 0));

                                // Map through the sorted materials and calculate percentage
                                return sortedMaterials.map((item: Material) => {
                                    const percentage =
                                        totalEmissionFactor > 0
                                            ? ((item.emissionFactor / totalEmissionFactor) * 100).toFixed(3)
                                            : 0;
                                    return (
                                        <tr key={item.materialClass}>
                                            <td>{item.materialClass}</td>
                                            { (plan == 'professional' && <td>{item.specificMaterial}</td> )}
                                            <td>{item.emissionFactor.toFixed(3)} KgCO₂e</td>
                                            <td>
                                                <div className="esgnow-percentage-bar">
                                                    <div 
                                                        className="esgnow-percentage-fill" 
                                                        style={{width: `${percentage}%`, backgroundColor: '#78BE7C'}}
                                                    ></div>
                                                    <span>{percentage}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderManufacturingTab = () => (
        <div className="esgnow-tab-content">
            <div className="esgnow-widget esgnow-contribution-manufacturing">
                <h3>Contribution by Manufacturing</h3>
                <div className="esgnow-widget-content">
                    <table>
                        <thead>
                            <tr>
                                { plan == 'basic' ? <th> Material</th> : <th>Specific Material</th>  }
                                <th>Manufacturing Process</th>
                                <th>Contribution</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                // Define manufacturing process type
                                interface ManufacturingProcess {
                                    materialClass: string;
                                    emissionFactor: number;
                                    manufacturingProcesses: Array<{
                                        category: string;
                                        process?: string;
                                        emissionFactor: number;
                                    }>;
                                }
                                
                                // Calculate the total emission factor
                                const manufacturingProcesses: ManufacturingProcess[] = Array.isArray(product.productManufacturingProcess) ? 
                                    product.productManufacturingProcess : [];
                                const totalEmissionFactor = manufacturingProcesses.reduce(
                                    (sum: number, item: ManufacturingProcess) => sum + (item.emissionFactor || 0),
                                    0
                                );

                                // Sort the productManufacturingProcess by emissionFactor in descending order
                                const sortedProcess = [...manufacturingProcesses].sort((a: ManufacturingProcess, b: ManufacturingProcess) => 
                                    (b.emissionFactor || 0) - (a.emissionFactor || 0));

                                // Map through the sorted materials and calculate percentage
                                return sortedProcess.map((item: ManufacturingProcess) => {
                                    const percentage =
                                        totalEmissionFactor > 0
                                            ? ((item.emissionFactor / totalEmissionFactor) * 100).toFixed(3)
                                            : 0;
                                    return (
                                        <tr key={item.materialClass}>
                                            <td>{item.materialClass}</td>
                                            <td>{item.manufacturingProcesses && item.manufacturingProcesses[0] ? 
                                                item.manufacturingProcesses[0].category : 'Unknown'}</td>
                                            <td>{parseFloat(item.emissionFactor.toString()).toFixed(3)} KgCO₂e</td>
                                            <td>
                                                <div className="esgnow-percentage-bar">
                                                    <div 
                                                        className="esgnow-percentage-fill" 
                                                        style={{width: `${percentage}%`, backgroundColor: '#ffaa00'}}
                                                    ></div>
                                                    <span>{percentage}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderTransportationTab = () => (
        <div className="esgnow-tab-content">
            <div className="esgnow-widget esgnow-contribution-raw-material">
                <h3>Contribution by Transportation</h3>
                <div className="esgnow-widget-content">
                    <table>
                        <thead>
                            <tr>
                                <th>Mode</th>
                                <th>Origin</th>
                                <th>Destination</th>
                                <th>Contribution</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                // Use the TransportLeg type from props
                                
                                // Calculate the total emission factor
                                const legs: TransportLeg[] = Array.isArray(transportLegs) ? transportLegs : [];
                                const totalEmissionFactor = legs.reduce(
                                    (sum: number, item: TransportLeg) => sum + (item.transportEmission || 0),
                                    0
                                );

                                // Sort the legs by transportEmission in descending order
                                const sortedLegs = [...legs].sort((a: TransportLeg, b: TransportLeg) => 
                                    (b.transportEmission || 0) - (a.transportEmission || 0));
                 
                                // Map through the sorted legs and calculate percentage
                                return sortedLegs.map((item: TransportLeg) => {
                                    const percentage =
                                        totalEmissionFactor > 0
                                            ? ((item.transportEmission / totalEmissionFactor) * 100).toFixed(3)
                                            : 0;
                                    return (
                                        <tr key={item.id}>
                                            <td>{formatTransportMode(item.transportMode) || 'Unknown'}</td>
                                            { plan == 'professional' ? 
                                              <td>{item.originCountry || 'Unknown'}</td> : 
                                              <td>{item.originGateway || 'Unknown'}</td>
                                            } 
                                            { plan == 'professional' ? 
                                              <td>{item.destinationCountry || 'Unknown'}</td> : 
                                              <td>{item.destinationGateway || 'Unknown'}</td>
                                            } 
                                            <td>{parseFloat(item.transportEmission.toString() || '0').toFixed(3)} KgCO₂e</td>
                                            <td>{percentage} %</td>
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

const handleSaveComplete = () => {
        setShowModal(false);
        if (onCloseModal) {
            onCloseModal(); // Close parent modal
        }
        onBack(); // Keep existing functionality
};
    return (
        <>
            <div className="esgnow-header-container">
                {!hideHeader && (
                    <>
                        <div className="esgnow-title-section">
                            <h1 className="esgnow-dashboard-title">Transport Summary</h1>
                            <p className="esgnow-subheading">Product: {product?.name}</p>
                        </div>
                        <div className="esgnow-action-buttons">
                            <Button
                                title="Save"
                                onClick={() => {
                                    setShowModal(true);
                                }}
                                className="esgnow-save-results-button"
                            >
                                <span className="esgnow-back-icon">←</span>
                                Back
                            </Button>
                                
                            <Button
                                title="< Back"
                                onClick={onBack}
                                className="esgnow-back-button"
                            >
                                <span className="esgnow-delete-icon">×</span>
                                Delete
                            </Button>
                        </div>
                    </>
                )}
            </div>
            <div className="esgnow-tabs-container">
                <div className="esgnow-tabs">
                    <button 
                        className={`esgnow-tab-button ${activeTab === 'overview' ? 'esgnow-active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button 
                        className={`esgnow-tab-button ${activeTab === 'materials' ? 'esgnow-active' : ''}`}
                        onClick={() => setActiveTab('materials')}
                    >
                        Raw Materials
                    </button>
                    <button 
                        className={`esgnow-tab-button ${activeTab === 'manufacturing' ? 'esgnow-active' : ''}`}
                        onClick={() => setActiveTab('manufacturing')}
                    >
                        Manufacturing
                    </button>
                    <button 
                        className={`esgnow-tab-button ${activeTab === 'transportation' ? 'esgnow-active' : ''}`}
                        onClick={() => setActiveTab('transportation')}
                    >
                        Transportation
                    </button>
                </div>

                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'materials' && renderMaterialsTab()}
                {activeTab === 'manufacturing' && renderManufacturingTab()}
                {activeTab === 'transportation' && renderTransportationTab()}
            </div>

            {showModal && (
                <>
                    {(!uxpContext && !contextRef.current) && (
                        <div style={{ 
                            position: 'fixed', 
                            top: 0, 
                            left: 0, 
                            right: 0, 
                            backgroundColor: '#ffdddd', 
                            padding: '10px', 
                            textAlign: 'center',
                            zIndex: 9999,
                            color: 'red',
                            fontWeight: 'bold'
                        }}>
                            System data connection issue detected. Your changes will be saved temporarily but may not persist after page refresh.
                        </div>
                    )}
                    <SaveResultsModal
                        onClose={() => setShowModal(false)}
                        onSaveComplete={handleSaveComplete}
                        hasExistingProjects={hasExistingProjects}
                        setHasExistingProjects={setHasExistingProjects}
                        product={product}
                        transportationEmission={transportationEmission}
                        transportLegs={transportLegs}
                        packageWeight={packageWeight}
                        palletWeight={palletWeight}
                        uxpContext={uxpContext || contextRef.current}
                    />
                </>
            )}
        </>
    );
};

export default EmissionSummary;