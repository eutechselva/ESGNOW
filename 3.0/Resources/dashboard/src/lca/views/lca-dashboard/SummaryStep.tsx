// File: SummaryStep.tsx
import * as React from "react";
import { Button } from "uxp/components";
import { TransportLeg } from "./LCADashboardWidget";
import './summary-step.scss';

interface SummaryStepProps {
    selectedProduct: any;
    transportLegs: TransportLeg[];
    packagingWeight: number;
    palletWeight: number;
    includePallet: boolean;
    plan: string;
    onConfirm: () => void;
}

const SummaryStep: React.FC<SummaryStepProps> = ({
    selectedProduct,
    transportLegs,
    packagingWeight,
    palletWeight,
    includePallet,
    plan,
    onConfirm
}) => {
    return (
        <div className="summary-container">
            {/* Product Details */}
            <div className="summary-section">
                <h3>PRODUCT DETAILS</h3>
                <div className="summary-box">
                    <div className="summary-row">
                        <span>Product Code</span>
                        <span>{selectedProduct?.code}</span>
                    </div>
                    <div className="summary-row">
                        <span>Product Name</span>
                        <span>{selectedProduct?.name}</span>
                    </div>
                </div>
            </div>

            {/* Transport Details */}
            <div className="summary-section">
                <h3>TRANSPORT DETAILS</h3>
                {transportLegs.map((leg, index) => (
                    <div key={leg.id} className="summary-box">
                        <h4>Transport Leg {index + 1}</h4>
                        <div className="summary-row">
                            <span>Origin Country</span>
                            <span>{leg.originCountry}</span>
                        </div>
                        {plan === 'professional' && (
                            <div className="summary-row">
                                <span>Origin Gateway</span>
                                <span>{leg.originGateway}</span>
                            </div>
                        )}
                        <div className="summary-row">
                            <span>Destination Country</span>
                            <span>{leg.destinationCountry}</span>
                        </div>
                        {plan === 'professional' && (
                            <div className="summary-row">
                                <span>Destination Gateway</span>
                                <span>{leg.destinationGateway}</span>
                            </div>
                        )}
                        <div className="summary-row">
                            <span>Transport Mode</span>
                            <span>{leg.transportMode}</span>
                        </div>
                        <div className="summary-row">
                            <span>Distance</span>
                            <span>{leg.transportDistance} Km</span>
                        </div>
                        <div className="summary-row">
                            <span>Carbon Footprint - Transportation</span>
                            <span>{leg.transportEmission.toFixed(2)} Kg CO2e</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Weight Details */}
            <div className="summary-section">
                <h3>WEIGHT DETAILS</h3>
                <div className="summary-box">
                    <div className="summary-row">
                        <span>Product Weight</span>
                        <span>{parseFloat(selectedProduct?.weight).toFixed(2)} Kg</span>
                    </div>
                    <div className="summary-row">
                        <span>Packaging Weight</span>
                        <span>{packagingWeight.toFixed(2)} Kg</span>
                    </div>
                    <div className="summary-row">
                        <span>Pallet Weight</span>
                        <span>{(includePallet ? palletWeight : 0).toFixed(2)} Kg</span>
                    </div>
                    <div className="summary-row">
                        <span>Total Weight</span>
                        <span>
                            {(parseFloat(selectedProduct?.weight) + packagingWeight + 
                              (includePallet ? palletWeight : 0)).toFixed(2)} Kg
                        </span>
                    </div>
                </div>
            </div>
            
            <Button title="Calculate" className="confirm-button" onClick={onConfirm} />
        </div>
    );
};

export default SummaryStep;