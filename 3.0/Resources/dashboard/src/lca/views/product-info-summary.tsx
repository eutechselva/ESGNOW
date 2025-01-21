import React, { useState } from 'react';
import './product-info-summary.scss';
import { Button } from 'uxp/components';
import { ProductInfoSummary } from '../types/product-info-summary.type';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

interface ProductInfoSummaryProps {
    product: ProductInfoSummary
    ;
    onClose: () => void;
}

const ProductInfoSummary: React.FC<ProductInfoSummaryProps> = ({ product, onClose }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const handleViewToggle = (mode: 'list' | 'tree') => setViewMode(mode);

    const totalValue = parseInt(product.co2Emission).toFixed(2); // Replace with dynamic calculation 
    const rawMaterialPercentage = parseInt(((parseInt(product.co2EmissionRawMaterials) / parseInt(product.co2Emission)) * 100).toFixed(2));
    const manufacturingPercentage = parseInt(((parseInt(product.co2EmissionFromProcesses) / parseInt(product.co2Emission)) * 100).toFixed(2));


    const donutChartOptions: Highcharts.Options = {
        chart: {
            type: 'pie',
            backgroundColor: null,
            height: 300,
            width: 600,
            events: {
                render() {
                    const chart = this as Highcharts.Chart & { customText?: Highcharts.SVGElement };

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
                    { name: 'Raw Materials', y: rawMaterialPercentage, color: '#78BE7C' },
                    { name: 'Manufacturing', y: manufacturingPercentage, color: '#ffaa00' },
                ],
            },
        ],
        legend: {
            layout: 'horizontal',
            align: 'center',
            verticalAlign: 'bottom',
            symbolRadius: 0, // Makes the symbols square (for circles, remove this line)
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

    return (
        <>
            <div className="title-container">
                <h1 className="dashboard-title">Product Summary</h1>
                <p className="subheading">{product.name}</p>
                <Button
                    title="Go back"
                    onClick={onClose}
                    className="back-button"
                />
            </div>
            <div className="product-info-summary">
                <div
                    className="summary-image"
                    style={{
                        backgroundImage: product.images[0] ? `url(${product.images[0]})` : 'none',
                    }}
                >
                    {!product.images[0] && <div className="image-placeholder">Image Unavailable</div>}
                    <div className="image-label">{`${totalValue}  Kg CO₂e`}</div>
                </div>
                <div className="summary-details">
                    <div className="details-left">
                        <div className="detail-item">
                            <strong>Product Code:</strong>
                            <p>{product.code}</p>
                        </div>

                        <div className="detail-item">
                            <strong>Weight:</strong>
                            <p>{product.weight}</p>
                        </div>
                        <div className="detail-item">
                            <strong>Category:</strong>
                            <p>{product.category}</p>
                        </div>
                        <div className="detail-item">
                            <strong>SubCategory:</strong>
                            <p>{product.subCategory}</p>
                        </div>

                    </div>
                    <div className="details-right">
                        <div className="description-field">
                            <strong>Description:</strong>
                            <p>{product.description}</p>
                        </div>



                    </div>
                </div>
            </div>

            <div className="widgets-section">
                <div className="widget product-footprint">
                    <h3>Product Footprint</h3>
                    <div className="widget-content">
                        <HighchartsReact highcharts={Highcharts} options={donutChartOptions} />
                    </div>
                </div>
                <div className="widgets-row">
                    <div className="widget contribution-raw-material">
                        <h3>Contribution by Raw Material</h3>
                        <div className="widget-content">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Material Class</th>
                                        <th>Specific Material</th>
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

                                        // Map through the materials and calculate percentage
                                        return product.materials.map((item: any) => {
                                            const percentage =
                                                totalEmissionFactor > 0
                                                    ? ((item.emissionFactor / totalEmissionFactor) * 100).toFixed(2)
                                                    : 0;
                                            return (
                                                <tr key={item.materialClass}>
                                                    <td>{item.materialClass}</td>
                                                    <td>{item.specificMaterial}</td>
                                                    <td>{ parseInt(item.emissionFactor).toFixed(2) } KgCO₂e</td>
                                                    <td>{percentage} %</td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="widget contribution-manufacturing">
                        <h3>Contribution by Manufacturing</h3>
                        <div className="widget-content">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Material Class</th>
                                        <th>Specific Material</th>
                                        <th>Contribution</th>
                                        <th>Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        product.productManufacturingProcess.map((item: any) => (
                                            <tr key={item.materialClass}>
                                                <td>{item.materialClass}</td>
                                                <td>{item.specificMaterial}</td>
                                                <td>{item.emissionFactor} </td>
                                                <td>{25}</td>
                                            </tr>
                                        ))}

                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>


            <div className="inventory-section">
                <div className="inventory-header">
                    <h3>Inventory Information</h3>
                    {/* <div className="view-toggle">
                        <button
                            className={`toggle-button ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => handleViewToggle('list')}
                        >
                            List
                        </button>
                        <button
                            className={`toggle-button ${viewMode === 'tree' ? 'active' : ''}`}
                            onClick={() => handleViewToggle('tree')}
                        >
                            Tree
                        </button>
                    </div> */}
                </div>

                {viewMode === 'tree' ? (
                    <div className="inventory-tree">
                        <div className="tree-item" onClick={toggleExpand}>
                            <span>{isExpanded ? '▼' : '▶'} Single - Pane aluminium window (Finished Good)</span>
                        </div>
                        {isExpanded && (
                            <div className="tree-children">
                                <div className="tree-sub-item">Aluminium Frame</div>
                                <div className="tree-sub-item">Glass pane</div>
                                <div className="tree-sub-item">Latch</div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="inventory-list">
                        <table>
                            <thead>
                                <tr>
                                    <th>Material Class</th>
                                    <th>Specific Material</th>
                                    <th>Weight</th>
                                    <th>Manufacturing Process</th>
                                    <th>Sub Process</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    // @ts-ignore
                                    product.productManufacturingProcess.map((item: any) => (
                                        <tr key={item.materialClass}>
                                            <td>{item.materialClass}</td>
                                            <td>{item.specificMaterial}</td>
                                            <td>{item.weight} Kg</td>
                                            <td>{item.manufacturingProcesses[0].category}</td>
                                            <td>{item.manufacturingProcesses[0].processes.join(', ')}</td>
                                        </tr>
                                    ))
                                }



                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};

export default ProductInfoSummary;
