import React, { useState } from 'react';
import { Button, Input, FormField, Label, Select } from 'uxp/components';
import { Modal } from 'uxp/components';
import { ProductInfoSummary } from '../types/product-info-summary.type';
import { TransportLeg } from '../types/transport-leg.type';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official'
import { createProject, createProjectProductMap, projectProductMapping } from "../../esgnow-service";
import { IContextProvider } from '@uxp';
import './emission-summary.scss';

interface SaveResultsModalProps {
    onClose: () => void;
    hasExistingProjects: boolean;
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
    hasExistingProjects,
    product,
    packageWeight,
    palletWeight,
    transportationEmission,
    transportLegs,
    uxpContext
}) => {
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [projectName, setProjectName] = useState('');
    const [projectId, setProjectId] = useState('');
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const projectOptions: ProjectOption[] = [
        { label: "Project Alpha", value: "alpha" },
        { label: "Project Beta", value: "beta" },
        { label: "Project Gamma", value: "gamma" },
    ];

    const handleSave = async () => {
        if (selectedCard === 'new') {
            if (!projectName || !projectId) {
                setError('Please fill in both project name and code');
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const createProjectPayload = {
                    code: projectId,
                    name: projectName,
                };

                const projectResponse = await createProject(uxpContext, createProjectPayload);

                const createProjectProductMapPayload = {
                    projectID: projectResponse.data._id,
                    productID: product._id,
                    packagingWeight : packageWeight,
                    palletWeight : palletWeight,
                    transportationLegs: transportLegs,
                    totalTransportationEmission: transportationEmission
                };

                // Then create the project-product mapping
                const mappingResponse = await createProjectProductMap(uxpContext, createProjectProductMapPayload);

                if (!mappingResponse.data) {
                    throw new Error('Failed to save project-product mapping');
                }

                const savedMapping = await mappingResponse.data;
                //console.log('Project and mapping saved successfully:', { savedProject, savedMapping });
                onClose();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to save project and mapping');
            } finally {
                setIsLoading(false);
            }
        } else if (selectedCard === 'existing') {
            if (!selectedProject) {
                setError('Please select a project');
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                
                const mappingResponse = await projectProductMapping(uxpContext, {
                    projectCode: selectedProject,
                    product,
                    transportationEmission,
                    transportLegs
                });

                if (!mappingResponse.data) {
                    throw new Error('Failed to save project-product mapping');
                }

                const savedMapping = await mappingResponse.data;
                console.log('Mapping saved successfully:', savedMapping);
                onClose();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to save mapping');
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <Modal className="esgnow-save-results" show={true} onClose={onClose} title="Save Transportation-Footprint Results" > 
            <div className="esgnow-save-results-modal">
                {/* {hasExistingProjects ? (
                    <p>Would you like to save these results by creating a new project or adding them to an existing one?</p>
                ) : (
                    <p>No existing projects found. Please create a new project.</p>
                )} */}

                <div className="esgnow-card-container">
                    <div
                        className={`esgnow-option-card ${selectedCard === 'new' ? 'esgnow-selected' : ''}`}
                        onClick={() => setSelectedCard('new')}
                    >
                        <h3>Create New Project</h3>
                        <p>Start a fresh project with these results.</p>
                    </div>
                    {/* {hasExistingProjects && (
                        <div
                            className={`esgnow-option-card ${selectedCard === 'existing' ? 'esgnow-selected' : ''}`}
                            onClick={() => setSelectedCard('existing')}
                        >
                            <h3>Add to Existing Project</h3>
                            <p>Include these results in one of your existing projects.</p>
                        </div>
                    )} */}
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
                            <Select
                                options={projectOptions}
                                selected={selectedProject}
                                onChange={(newValue) => setSelectedProject(newValue)}
                                placeholder="Select a project"
                            />
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


const EmissionSummary: React.FC<{
    product: ProductInfoSummary;
    transportationEmission: string;
    onBack: () => void;
    transportLegs: TransportLeg[];
    uxContext: IContextProvider;
    packageWeight: Number;
    palletWeight: Number;
    hideHeader?: boolean;
    plan :string;
}> = ({ product, onBack, transportationEmission, transportLegs, uxContext , packageWeight,palletWeight ,hideHeader ,plan}) => {

    const transportationEmissionEx = parseFloat(transportationEmission);
    const [isExpanded, setIsExpanded] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const handleViewToggle = (mode: 'list' | 'tree') => setViewMode(mode);
    const [showModal, setShowModal] = useState(false);
    const [hasExistingProjects, setHasExistingProjects] = useState(true);
    const [showProjects, setShowProjects] = useState(false); // Change this based on actual data
    const [activeTab, setActiveTab] = useState<'overview'|'materials' | 'manufacturing' | 'transportation'>('overview');

    const donutChartOptions: Highcharts.Options = {
        chart: {
            type: 'pie',
            backgroundColor: null,
            height: 350,
            width: 600,
            events: {
                render() {
                    const chart = this as Highcharts.Chart & { customText?: Highcharts.SVGElement };
                    const totalValue = (Number(product.co2EmissionRawMaterials) + Number(product.co2EmissionFromProcesses) + Number(transportationEmission)).toFixed(2);
                    if (!chart.customText) {
                        chart.customText = chart.renderer
                            .text(
                                `${totalValue} KgCO₂e`,
                                chart.plotWidth / 2 + chart.plotLeft,
                                chart.plotHeight / 2 + chart.plotTop
                            )
                            .css({
                                fontSize: '16px',
                                fontWeight: 'bold',
                                fontFamily: 'Comfortaa',
                                color: '#424242',
                                textAlign: 'center',
                            })
                            .attr({
                                align: 'center',
                                zIndex: 5,
                            })
                            .add();
                    } else {
                        chart.customText.attr({
                            text: `${totalValue} KgCO₂e`,
                        });
                    }
                },
            },
        },
        title: {
            text: '',
        },
        plotOptions: {
            pie: {
                innerSize: '60%',
                dataLabels: {
                    enabled: true,
                    format: '{point.name}: {point.y} KgCO₂e ({point.percentage:.1f}%)',
                    style: {
                        fontSize: '12px',
                        fontWeight: 'bold',
                        fontFamily: 'Comfortaa',
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
                    { name: 'Raw Materials', y: Number(product.co2EmissionRawMaterials), color: '#78BE7C' },
                    { name: 'Manufacturing', y: Number(product.co2EmissionFromProcesses), color: '#ffaa00' },
                    { name: 'Transportation', y: Number(transportationEmission), color: '#2A9D8F' },
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
                fontFamily: 'Comfortaa',
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
                        backgroundImage: product.images[0] ? `url(${product.images[0]})` : 'none',
                    }}
                >
                    {!product.images[0] && <div className="esgnow-image-placeholder">Image Unavailable</div>}
                    {/* <div className="esgnow-image-label">{`${product.co2Emission} Kg CO₂e`}</div> */}
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
                <h3>Product Carbon Footprint Breakdowns</h3>
                <div className="esgnow-widget-content">
                    <HighchartsReact highcharts={Highcharts} options={donutChartOptions} />
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
                                // Calculate the total emission factor
                                const totalEmissionFactor = product.materials.reduce(
                                    (sum: number, item: any) => sum + item.emissionFactor,
                                    0
                                );

                                // Sort the materials by emissionFactor in descending order
                                const sortedMaterials = product.materials.sort((a: any, b: any) => b.emissionFactor - a.emissionFactor);

                                // Map through the sorted materials and calculate percentage
                                return sortedMaterials.map((item: any) => {
                                    const percentage =
                                        totalEmissionFactor > 0
                                            ? ((item.emissionFactor / totalEmissionFactor) * 100).toFixed(2)
                                            : 0;
                                    return (
                                        <tr key={item.materialClass}>
                                            <td>{item.materialClass}</td>
                                            { (plan == 'professional' && <td>{item.specificMaterial}</td> )}
                                            <td>{item.emissionFactor.toFixed(2)} KgCO₂e</td>
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
                                // Calculate the total emission factor
                                const totalEmissionFactor = product.productManufacturingProcess.reduce(
                                    (sum: number, item: any) => sum + item.emissionFactor,
                                    0
                                );

                                // Sort the productManufacturingProcess by emissionFactor in descending order
                                const sortedProcess = product.productManufacturingProcess.sort((a: any, b: any) => b.emissionFactor - a.emissionFactor);

                                // Map through the sorted materials and calculate percentage
                                return sortedProcess.map((item: any) => {
                                    const percentage =
                                        totalEmissionFactor > 0
                                            ? ((item.emissionFactor / totalEmissionFactor) * 100).toFixed(2)
                                            : 0;
                                    return (
                                        <tr key={item.materialClass}>
                                            <td>{item.materialClass}</td>
                                            <td>{item.manufacturingProcesses[0].category}</td>
                                            <td>{parseFloat(item.emissionFactor).toFixed(2)} KgCO₂e</td>
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
                                // Calculate the total emission factor
                                const totalEmissionFactor = transportLegs.reduce(
                                    (sum: number, item: any) => sum + item.transportEmission,
                                    0
                                );

                                // Sort the materials by emissionFactor in descending order
                                const sortedMaterials = transportLegs.sort((a: any, b: any) => b.transportEmission - a.transportEmission);

                                // Map through the sorted materials and calculate percentage
                                return sortedMaterials.map((item: any) => {
                                    const percentage =
                                        totalEmissionFactor > 0
                                            ? ((item.transportEmission / totalEmissionFactor) * 100).toFixed(2)
                                            : 0;
                                    return (
                                        <tr key={item.id}>
                                            <td>{item.transportMode}</td>
                                            { plan == 'professional' ?  <td>{item.originCountry }</td> : <td>{item.originGateway}</td>} 
                                            { plan == 'professional' ?  <td>{item.destinationCountry }</td> : <td>{item.destinationGateway}</td>} 
                                            <td>{parseFloat(item.transportEmission).toFixed(2)} KgCO₂e</td>
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

    function onSave(): void {
        setShowModal(true);
    }

    return (
        <>
            <div className="esgnow-header-container">
                {!hideHeader && (
                    <>
                        <div className="esgnow-title-section">
                            <h1 className="esgnow-dashboard-title">Transport Summary</h1>
                            <p className="esgnow-subheading">Product: {product.name}</p>
                        </div>
                        <div className="esgnow-action-buttons">
                            <Button
                                title="Save"
                                onClick={() => setShowModal(true)}
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
                <SaveResultsModal
                    onClose={() => setShowModal(false)}
                    hasExistingProjects={hasExistingProjects}
                    product={product}
                    transportationEmission={transportationEmission}
                    transportLegs={transportLegs}
                    packageWeight={packageWeight}
                    palletWeight={packageWeight}
                    uxpContext={uxContext}
                />
            )}
        </>
    );
};

export default EmissionSummary;