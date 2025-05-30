import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, FormField, Label, Select, TitleBar, WidgetWrapper } from 'uxp/components';
import { ProductInfoSummary } from '../types/product-info-summary.type';
import { TransportLeg } from '../types/transport-leg.type';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official'
import { IContextProvider } from '@uxp';
import './project-emissions.scss';
import EmissionSummary from './emission-summary';

// Define the structure for a product within a project
interface ProjectProduct {
  productID: {
    $oid: string;
  };
  productName : string;
  packagingWeight: number;
  palletWeight: number;
  totalTransportationEmission: number;
  co2EmissionFromProcesses: number;
  co2EmissionRawMaterials: number;
  transportationEmission: number;
  impacts : [];
  transportationLegs: TransportLeg[];
  _id: {
    $oid: string;
  };

}



// Define the structure for a project with multiple products
interface Project {
  _id: {
    $oid: string;
  };
  projectID: {
    $oid: string;
  };
  projectName?: string;
  projectCode?: string;
  products: ProjectProduct[];
  totalManufacturingImpact: number;
  totalMaterialsImpact: number;
  totalProjectImpact: number;
  totalTransportationImpact: number;
  createdDate: {
    $date: string;
  };
  modifiedDate: {
    $date: string;
  };
  __v: number;
}

interface ProjectEmissionSummaryProps {
  project: Project;
  uxpContext: IContextProvider;
  onBack?: () => void;
  hideHeader?: boolean;
  plan: string;
}

const ProjectEmissionSummary: React.FC<ProjectEmissionSummaryProps> = ({
  project,
  uxpContext,
  onBack,
  hideHeader = false,
  plan = 'basic'
}) => {
  // Reference to persist context
  const contextRef = useRef<IContextProvider | null>(null);

  // State for UI
  const [activeTab, setActiveTab] = useState<'overview' | 'products'>('overview');
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
  const [totalEmissions, setTotalEmissions] = useState({
    materials: 0,
    manufacturing: 0,
    transportation: 0,
    total: 0
  });

  // Update context ref
  useEffect(() => {
    if (uxpContext) {
      contextRef.current = uxpContext;
    }
  }, [uxpContext]);

  // Calculate total emissions from all products
  useEffect(() => {

    setTotalEmissions({
      materials: project.totalMaterialsImpact,
      manufacturing: project.totalManufacturingImpact,
      transportation: project.totalTransportationImpact,
      total: project.totalProjectImpact,
    });
  }, [project]);

  // Chart options for the donut chart showing emission breakdown
  const getDonutChartOptions = (): Highcharts.Options => ({
    chart: {
      type: 'pie',
      backgroundColor: null,
      height: 350,
      width: 600,
      events: {
        render() {
          const chart = this as Highcharts.Chart & { customText?: Highcharts.SVGElement };
          const totalValue = totalEmissions.total.toFixed(3);
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
          { name: 'Raw Materials', y: totalEmissions.materials, color: '#78BE7C' },
          { name: 'Manufacturing', y: totalEmissions.manufacturing, color: '#ffaa00' },
          { name: 'Transportation', y: totalEmissions.transportation, color: '#2A9D8F' },
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
  });

  // Render overview tab with project summary
  const renderOverviewTab = () => (
    <div className="esgnow-tab-content">
      <div className="esgnow-project-info-summary">
        <div className="esgnow-summary-details">
          <div className="esgnow-detail-grid">
            <div className="esgnow-detail-item">
              <strong>Project Code</strong>
              <p>{project.projectCode || 'N/A'}</p>
            </div>
            <div className="esgnow-detail-item">
              <strong>Project Name</strong>
              <p>{project.projectName || 'N/A'}</p>
            </div>
            <div className="esgnow-detail-item">
              <strong>Number of Products</strong>
              <p>{project.products.length}</p>
            </div>

          </div>
        </div>
      </div>

      <div className="esgnow-widget esgnow-project-footprint">
        <h3>Project Carbon Footprint Breakdown</h3>
        <div className="esgnow-widget-content">
          <HighchartsReact highcharts={Highcharts} options={getDonutChartOptions()} />
        </div>
      </div>

      <div className="esgnow-widget esgnow-emission-metrics">
        <h3>Emission Metrics</h3>
        <div className="esgnow-widget-content">
          <div className="esgnow-emission-metrics-grid">
            <div className="esgnow-metric-card">
              <h4>Total Carbon Footprint</h4>
              <p className="esgnow-metric-value">{totalEmissions.total.toFixed(3)} KgCO₂e</p>
            </div>
            <div className="esgnow-metric-card">
              <h4>Raw Materials</h4>
              <p className="esgnow-metric-value">{totalEmissions.materials.toFixed(3)} KgCO₂e</p>
              <p className="esgnow-metric-percentage">
                {totalEmissions.total > 0
                  ? ((totalEmissions.materials / totalEmissions.total) * 100).toFixed(1)
                  : '0'}%
              </p>
            </div>
            <div className="esgnow-metric-card">
              <h4>Manufacturing</h4>
              <p className="esgnow-metric-value">{totalEmissions.manufacturing.toFixed(3)} KgCO₂e</p>
              <p className="esgnow-metric-percentage">
                {totalEmissions.total > 0
                  ? ((totalEmissions.manufacturing / totalEmissions.total) * 100).toFixed(1)
                  : '0'}%
              </p>
            </div>
            <div className="esgnow-metric-card">
              <h4>Transportation</h4>
              <p className="esgnow-metric-value">{totalEmissions.transportation.toFixed(3)} KgCO₂e</p>
              <p className="esgnow-metric-percentage">
                {totalEmissions.total > 0
                  ? ((totalEmissions.transportation / totalEmissions.total) * 100).toFixed(1)
                  : '0'}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render products tab with list of products
  const renderProductsTab = () => (
    <div className="esgnow-tab-content">
      <div className="esgnow-widget esgnow-product-list">
        <h3>Products in this Project</h3>
        <div className="esgnow-widget-content">
          <table className="esgnow-products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Raw Materials</th>
                <th>Manufacturing</th>
                <th>Transportation</th>
                <th>Total Impact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {project.products.map((product, index) => {
                let totalImpact = product.co2EmissionRawMaterials + product.co2EmissionFromProcesses + product.transportationEmission;
                
                return (
                  <tr key={product._id.$oid}>
                    <td>{product?.productID || `Product ${index + 1}`}</td>
                    <td>{product.co2EmissionRawMaterials.toFixed(3)} KgCO₂e</td>
                    <td>{product.co2EmissionFromProcesses.toFixed(3)} KgCO₂e</td>
                    <td>{product.transportationEmission.toFixed(3)} KgCO₂e</td>
                    <td>{totalImpact.toFixed(3)} KgCO₂e</td>
                    <td>
                      <Button
                        title="View Details"
                        onClick={() => setSelectedProductIndex(index)}
                        className="esgnow-view-product-button"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render individual product details
  const renderProductDetails = () => {
    if (selectedProductIndex === null || !project.products[selectedProductIndex]) {
      return null;
    }

    const selectedProduct = project.products[selectedProductIndex];
    const productDetails = selectedProduct;

    if (!productDetails) {
      return (
        <div className="esgnow-product-details">
          <h3>Product Details Not Available</h3>
          <Button
            title="Back to Products"
            onClick={() => setSelectedProductIndex(null)}
            className="esgnow-back-button"
          />
        </div>
      );
    }

    return (
      <div className="esgnow-product-details">
        <div className="esgnow-product-details-header">
          <Button
            title="Back to Products"
            onClick={() => setSelectedProductIndex(null)}
            className="esgnow-back-button"
          >
            <span className="esgnow-back-icon">←</span>
            Back to Products
          </Button>
        </div>

        <EmissionSummary
          product={productDetails}
          transportationEmission={selectedProduct.totalTransportationEmission.toString()}
          transportLegs={selectedProduct.transportationLegs || []}
          uxpContext={uxpContext || contextRef.current}
          packageWeight={selectedProduct.packagingWeight}
          palletWeight={selectedProduct.palletWeight}
          hideHeader={true}
          plan={plan}
        />
      </div>
    );
  };

  return (
    <>
      <div className="esgnow-header-container">
        {!hideHeader && (
          <>
            <div className="esgnow-title-section">
              <h1 className="esgnow-dashboard-title">Project Emission Summary</h1>
              <p className="esgnow-subheading">Project: {project.projectName || project.projectCode || 'N/A'}</p>
            </div>
            <div className="esgnow-action-buttons">
              <Button
                title="Back"
                onClick={onBack}
                className="esgnow-back-button"
              >
                <span className="esgnow-back-icon">←</span>
                Back
              </Button>
            </div>
          </>
        )}
      </div>

      {selectedProductIndex !== null ? (
        // Show individual product details
        renderProductDetails()
      ) : (
        // Show project tabs
        <>
          <div className="esgnow-tabs-container">
            <div className="esgnow-tabs">
              <button
                className={`esgnow-tab-button ${activeTab === 'overview' ? 'esgnow-active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Project Overview
              </button>
              <button
                className={`esgnow-tab-button ${activeTab === 'products' ? 'esgnow-active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                Products ({project.products.length})
              </button>
            </div>

            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'products' && renderProductsTab()}
          </div>
        </>
      )}
    </>
  );
};

export default ProjectEmissionSummary;