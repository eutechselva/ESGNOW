import React, { useState } from 'react';
import './product-info-summary.scss';
import { Button, Modal } from 'uxp/components';
import { ProductInfoSummary } from '../types/product-info-summary.type';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { deleteProductByID } from "../../esgnow-service";
import { IContextProvider } from '@uxp';

interface ProductInfoSummaryProps {
    product: ProductInfoSummary;
    onClose: () => void;
    onDelete: () => void;
    hideHeader?: boolean;
    hideDelete?: boolean;
    uxpContext: IContextProvider;
    plan: string;
    show?: boolean; 
}

const ProductInfoSummary: React.FC<ProductInfoSummaryProps> = ({ product, onClose, onDelete, hideHeader, uxpContext, hideDelete, plan }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'manufacturing' | 'inventory'>('overview');

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const deleteProduct = async () => {
        setShowDeleteConfirm(true);
    }

    const confirmDelete = async () => {
        await deleteProductByID(uxpContext, { _id: product._id });
        onDelete();
        setShowDeleteConfirm(false);
    }

    const donutChartOptions: Highcharts.Options = {
        chart: {
            type: 'pie',
            backgroundColor: null,
            height: 280,
            width: 500,
            events: {
                render() {
                    const chart = this as Highcharts.Chart & { customText?: Highcharts.SVGElement };

                    if (!chart.customText) {
                        chart.customText = chart.renderer
                            .text(
                                `${product.co2Emission} <br> KgCO₂e`,
                                chart.plotWidth / 2 + chart.plotLeft,
                                chart.plotHeight / 2 + chart.plotTop
                            )
                            .css({
                                fontSize: '18px',
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
                            text: `${product.co2Emission} KgCO₂e`,
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
                ],
            },
        ],
        legend: {
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'bottom',
            symbolRadius: 0,
            symbolHeight: 10,
            symbolWidth: 10,
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
                    <div className="esgnow-image-label">{`${product.co2Emission} Kg CO₂e`}</div>
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
                                {plan === 'professional' && (<th>Specific Material</th>)}
                                <th>Contribution</th>
                                {/* <th>Reasoning</th> */}
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const totalEmissionFactor = product.materials.reduce(
                                    (sum: number, item: any) => sum + item.emissionFactor,
                                    0
                                );

                                const sortedMaterials = product.materials.sort((a: any, b: any) => b.emissionFactor - a.emissionFactor);

                                return sortedMaterials.map((item: any) => {
                                    const percentage =
                                        totalEmissionFactor > 0
                                            ? ((item.emissionFactor / totalEmissionFactor) * 100).toFixed(2)
                                            : 0;
                                    return (
                                        <tr key={item.materialClass}>
                                            <td>{item.materialClass}</td>
                                            {plan === 'professional' && (<td>{item.specificMaterial}</td>)}
                                            <td> {parseFloat(item.emissionFactor).toFixed(2)} KgCO₂e ({parseFloat(item.weight).toFixed(2)} Kg)</td>
                                            {/* <td className="esgnow-reasoning-cell">{item.reasoning || "-"}</td> */}
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
                <h3>Contribution by Manufacturing Process</h3>
                <div className="esgnow-widget-content">
                    <table>
                        <thead>
                            <tr>
                                <th> Material</th>
                                {/* <th>Manufacturing Process</th> */}
                                <th>Contribution</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const totalEmissionFactor = product.productManufacturingProcess.reduce(
                                    (sum: number, item: any) => sum + item.emissionFactor,
                                    0
                                );

                                const sortedProcess = product.productManufacturingProcess.sort((a: any, b: any) => b.emissionFactor - a.emissionFactor);

                                return sortedProcess.map((item: any) => {
                                    const percentage =
                                        totalEmissionFactor > 0
                                            ? ((item.emissionFactor / totalEmissionFactor) * 100).toFixed(2)
                                            : 0;
                                    return (
                                        <tr key={item.materialClass}>
                                            <td>{item.materialClass}</td>
                                            {/* <td>{item.manufacturingProcesses[0].category}</td> */}
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

    const renderInventoryTab = () => (
        <div className="esgnow-tab-content">
            <div className="esgnow-widget esgnow-inventory-info">
                <div className="esgnow-inventory-header">
                    <h3>Inventory Information</h3>
                    <div className="esgnow-view-toggle">
                        {/* <button
                            className={`esgnow-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            List View
                        </button>
                        <button
                            className={`esgnow-toggle-button ${viewMode === 'tree' ? 'active' : ''}`}
                            onClick={() => setViewMode('tree')}
                        >
                            Tree View
                        </button> */}
                    </div>
                </div>

                {viewMode === 'tree' ? (
                    <div className="esgnow-inventory-tree">
                        <div className="esgnow-tree-item" onClick={toggleExpand}>
                            <span className="esgnow-expand-icon">{isExpanded ? '▼' : '▶'}</span>
                            <span>Single - Pane aluminium window (Finished Good)</span>
                        </div>
                        {isExpanded && (
                            <div className="esgnow-tree-children">
                                {(() => {
                                    // Create a map to merge processes with materials
                                    const mergedItems = new Map();
                                    
                                    // First, add all manufacturing processes
                                    product.productManufacturingProcess.forEach((item: any) => {
                                        const key = `${item.materialClass}-${item.specificMaterial}`;
                                        mergedItems.set(key, {
                                            ...item,
                                            reasoning: "" // Default empty reasoning
                                        });
                                    });
                                    
                                    // Then, merge with materials data (including reasoning)
                                    product.materials.forEach((material: any) => {
                                        const key = `${material.materialClass}-${material.specificMaterial}`;
                                        if (mergedItems.has(key)) {
                                            // Update existing item with reasoning from materials
                                            const existingItem = mergedItems.get(key);
                                            mergedItems.set(key, {
                                                ...existingItem,
                                                reasoning: material.reasoning || "-"
                                            });
                                        }
                                    });
                                    
                                    // Convert map values to array and render
                                    return Array.from(mergedItems.values()).map((item: any) => (
                                        <div key={`${item.materialClass}-${item.specificMaterial}`} className="esgnow-tree-sub-item">
                                            <div className="esgnow-tree-main-content">
                                                <span className="esgnow-material-dot"></span>
                                                <span>{item.materialClass} - {item.specificMaterial} ({item.weight} Kg)</span>
                                            </div>
                                            {item.reasoning && <div className="esgnow-tree-reasoning">{item.reasoning}</div>}
                                        </div>
                                    ));
                                })()}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                                        <div className="esgnow-widget-content">
                        <table className="esgnow-inventory-table">
                            <thead>
                                <tr>
                                    <th>Material Class</th>
                                    {plan === 'professional' && (<th>Specific Material</th>)}
                                    <th>Weight</th>
                                    {/* <th>Manufacturing Process</th>
                                    <th>Sub Process</th> */}
                                    <th>Reasoning</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    // Create a map to merge processes with materials based on materialClass and specificMaterial
                                    const mergedItems = new Map();
                                    
                                    // First, add all manufacturing processes
                                    product.productManufacturingProcess.forEach((item: any) => {
                                        const key = `${item.materialClass}-${item.specificMaterial}`;
                                        mergedItems.set(key, {
                                            ...item,
                                            reasoning: "" // Default empty reasoning
                                        });
                                    });
                                    
                                    // Then, merge with materials data (including reasoning)
                                    product.materials.forEach((material: any) => {
                                        const key = `${material.materialClass}-${material.specificMaterial}`;
                                        if (mergedItems.has(key)) {
                                            // Update existing item with reasoning from materials
                                            const existingItem = mergedItems.get(key);
                                            mergedItems.set(key, {
                                                ...existingItem,
                                                reasoning: material.reasoning || "-"
                                            });
                                        }
                                    });
                                    
                                    // Convert map values to array and render
                                    return Array.from(mergedItems.values()).map((item: any) => (
                                        <tr key={`${item.materialClass}-${item.specificMaterial}`}>
                                            <td>{item.materialClass}</td>
                                            {plan === 'professional' && (<td>{item.specificMaterial}</td>)}
                                            <td>{item.weight} Kg</td>
                                            {/* <td>{item.manufacturingProcesses[0].category}</td>
                                            <td>{item.manufacturingProcesses[0].processes.join(', ')}</td> */}
                                            <td className="esgnow-reasoning-cell">{item.reasoning}</td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                    
                    <h3>Material Emission Summary</h3>

                    <div className="esgnow-widget-content">
                        <table className="esgnow-inventory-table">
                            <thead>
                                <tr>
                                    <th>Specific Material</th>
                                    <th>Emission Factor</th>
                                    <th>Source</th>
                                    <th>Geography</th>
                                    <th>Rationale</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const mergedItems = new Map();
                                    product.productManufacturingProcess.forEach((item: any) => {
                                        const key = `${item.materialClass}-${item.specificMaterial}`;
                                        mergedItems.set(key, { ...item, reasoning: "" });                                        
                                    });
                                    product.materials.forEach((material: any) => {
                                        const key = `${material.materialClass}-${material.specificMaterial}`;
                                        if (mergedItems.has(key)) {
                                            const existingItem = mergedItems.get(key);
                                            mergedItems.set(key, {
                                                ...existingItem,
                                                reasoning: material.reasoning || "-",
                                                emissionFactor: material.emissionFactor,
                                                countryOfOrigin: product.countryOfOrigin,
                                                EF_Source: material.EF_Source || "",
                                                Type_Rationale: material.Type_Rationale || ""
                                            });
                                        }
                                    });

                                    return Array.from(mergedItems.values()).map((item: any) => (
                                        <tr key={`${item.materialClass}-${item.specificMaterial}`}>
                                            <td>{item.specificMaterial || "-"}</td>
                                            <td>{item.emissionFactor ? parseFloat(item.emissionFactor).toFixed(2) : "-"} KgCO₂e</td>
                                            <td>{item.EF_Source || "-"}</td>
                                            <td>{item.countryOfOrigin || "-"}</td>
                                            <td className='esgnow-reasoning-cell'>{item.Type_Rationale || "-"}</td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>


                    </>

                    
                )}
            </div>
        </div>
    );

    return (
        <div className="esgnow-product-summary-container">
            <div className="esgnow-header-container">
                {!hideHeader && (
                    <>
                        <div className="esgnow-title-section">
                            <h1 className="esgnow-dashboard-title">Product Summary</h1>
                            <p className="esgnow-subheading">Product: {product.name}</p>
                        </div>
                        <div className="esgnow-action-buttons">
                            {/* <Button
                                title="Back"
                                onClick={onClose}
                                className="esgnow-back-button"
                            >
                                <span className="esgnow-back-icon">←</span>
                                Back
                            </Button> */}
                            {!hideDelete && (
                                <Button 
                                    title="Delete" 
                                    onClick={deleteProduct} 
                                    className="esgnow-delete-button"
                                >
                                    <span className="esgnow-delete-icon">×</span>
                                    Delete
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </div>

            <div className="esgnow-tabs-container">
                <div className="esgnow-tabs">
                    <button 
                        className={`esgnow-tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button 
                        className={`esgnow-tab-button ${activeTab === 'materials' ? 'active' : ''}`}
                        onClick={() => setActiveTab('materials')}
                    >
                        Raw Materials
                    </button>
                    <button 
                        className={`esgnow-tab-button ${activeTab === 'manufacturing' ? 'active' : ''}`}
                        onClick={() => setActiveTab('manufacturing')}
                    >
                        Manufacturing
                    </button>
                    <button 
                        className={`esgnow-tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
                        onClick={() => setActiveTab('inventory')}
                    >
                        Inventory
                    </button>
                </div>

                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'materials' && renderMaterialsTab()}
                {activeTab === 'manufacturing' && renderManufacturingTab()}
                {activeTab === 'inventory' && renderInventoryTab()}
            </div>

            {showDeleteConfirm && (
                <Modal
                    show={showDeleteConfirm}
                    title="Confirm Deletion"
                    onClose={() => setShowDeleteConfirm(false)}
                    className="esgnow-delete-modal"
                >
                    <div className="esgnow-delete-confirmation">
                        <div className="esgnow-warning-icon">⚠️</div>
                        <p>Are you sure you want to delete this product?</p>
                        <p className="esgnow-delete-warning">This action cannot be undone.</p>
                        <div className="esgnow-modal-actions">
                            <Button title="Cancel" onClick={() => setShowDeleteConfirm(false)} className="esgnow-cancel-button">Cancel</Button>
                            <Button title="Delete" onClick={confirmDelete} className="esgnow-confirm-button">Delete</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ProductInfoSummary;