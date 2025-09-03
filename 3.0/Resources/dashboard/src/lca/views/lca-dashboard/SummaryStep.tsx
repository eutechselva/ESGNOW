// File: SummaryStep.tsx
import * as React from "react";
import { Button, Modal } from "uxp/components";
import { TransportLeg } from "./LCADashboardWidget";
import './summary-step.scss';
import EmissionSummary from "../emission-summary";

interface SummaryStepProps {
    selectedProduct: any;
    transportLegs: TransportLeg[];
    packagingWeight: number;
    palletWeight: number;
    includePallet: boolean;
    plan: string;
    onConfirm: () => void;
    onCloseAll ?: () =>void;
    uxpContext: any;
    onPrevious?: () => void;
}

const SummaryStep: React.FC<SummaryStepProps> = ({
    selectedProduct,
    transportLegs,
    packagingWeight,
    palletWeight,
    includePallet,
    plan,
    onConfirm,
    onCloseAll,
    uxpContext,
    onPrevious
}) => {
    const [showEmissionSummary, setShowEmissionSummary] = React.useState(false);
    const [transportationEmission, setTransportationEmission] = React.useState("0");

    // Utility function to format transport mode (add spaces before capital letters)
    const formatTransportMode = (mode: string): string => {
        return mode.replace(/([A-Z])/g, ' $1').trim();
    };

    // Calculate total transportation emission
    React.useEffect(() => {
        const totalEmission = transportLegs.reduce((sum, leg) => sum + leg.transportEmission, 0);
        setTransportationEmission(totalEmission.toFixed(3));
    }, [transportLegs]);

    const handleCalculate = () => {
        setShowEmissionSummary(true);
    };
    
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
                        
                        {/* Show warehouse to origin distance for first leg only */}
                        {index === 0 && leg.warehouseToOriginDistance && leg.warehouseToOriginDistance > 0 && (
                            <div className="summary-row">
                                <span>Road Distance from Warehouse to Origin Port</span>
                                <span>{leg.warehouseToOriginDistance} Km</span>
                            </div>
                        )}
                        
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
                            <span>{formatTransportMode(leg.transportMode)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Main Transport Distance</span>
                            <span>{leg.transportDistance} Km</span>
                        </div>
                        
                        {/* Show destination to warehouse distance for single leg or last leg only */}
                        {(transportLegs.length === 1 || index === transportLegs.length - 1) && 
                         leg.destinationToWarehouseDistance && leg.destinationToWarehouseDistance > 0 && (
                            <div className="summary-row">
                                <span>Road Distance from Destination Port to Warehouse</span>
                                <span>{leg.destinationToWarehouseDistance} Km</span>
                            </div>
                        )}
                        
                        <div className="summary-row">
                            <span>Carbon Footprint - Transportation</span>
                            <span>{leg.transportEmission.toFixed(3)} Kg CO2e</span>
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
                        <span>{parseFloat(selectedProduct?.weight).toFixed(3)} Kg</span>
                    </div>
                    <div className="summary-row">
                        <span>Packaging Weight</span>
                        <span>{packagingWeight.toFixed(3)} Kg</span>
                    </div>
                    <div className="summary-row">
                        <span>Pallet Weight</span>
                        <span>{(includePallet ? palletWeight : 0).toFixed(3)} Kg</span>
                    </div>
                    <div className="summary-row">
                        <span>Total Weight</span>
                        <span>
                            {(parseFloat(selectedProduct?.weight) + packagingWeight +
                                (includePallet ? palletWeight : 0)).toFixed(3)} Kg
                        </span>
                    </div>
                </div>
            </div>

            <div className="summary-buttons">
                {onPrevious && (
                    <Button
                        className="button-secondary"
                        title="Previous"
                        onClick={onPrevious}
                    />
                )}
                <Button
                    title="Calculate"
                    className="button-primary-confirm-button"
                    onClick={handleCalculate}
                />
            </div>

            {/* Emission Summary Modal */}
            <Modal
                show={showEmissionSummary}
                onClose={() => setShowEmissionSummary(false)}
                title="Emission Summary"
                className="emission-summary-modal"

            >
                <EmissionSummary
                    product={selectedProduct}
                    transportationEmission={transportationEmission}
                    onBack={() => setShowEmissionSummary(false)}
                    transportLegs={transportLegs}
                    uxpContext={uxpContext}
                    packageWeight={packagingWeight}
                    palletWeight={includePallet ? palletWeight : 0}
                    plan={plan}
                    onCloseModal={onCloseAll}
                 
                />
            </Modal>
        </div>
    );
};

export default SummaryStep;