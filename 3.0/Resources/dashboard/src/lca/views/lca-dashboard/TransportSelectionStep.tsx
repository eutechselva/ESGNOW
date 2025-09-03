// File: TransportSelectionStep.tsx
import * as React from "react";
import { Button, FormField, IconButton, Label, Select } from "uxp/components";
import { IContextProvider } from "@uxp";
import { calculateTransportDistance } from "../../../esgnow-service";
import { TransportLeg } from "./LCADashboardWidget";
import './transport-selection-step.scss';

interface TransportSelectionStepProps {
    transportLegs: TransportLeg[];
    setTransportLegs: React.Dispatch<React.SetStateAction<TransportLeg[]>>;
    countries: any[];
    transportDatabase: { [key: string]: any };
    plan: string;
    uxpContext: IContextProvider;
}
interface ValidationError {
    originCountry?: boolean;
    destinationCountry?: boolean;
    originGateway?: boolean;
    destinationGateway?: boolean;
    // Removed transportMode from validation since it's hardcoded
}

interface TransportSelectionStepProps {
    transportLegs: TransportLeg[];
    setTransportLegs: React.Dispatch<React.SetStateAction<TransportLeg[]>>;
    countries: any[];
    transportDatabase: { [key: string]: any };
    plan: string;
    uxpContext: IContextProvider;
    errors: ValidationError[]; // Add errors prop
    setErrors?: React.Dispatch<React.SetStateAction<ValidationError[]>>; // Optional setter for errors
}
const TransportSelectionStep: React.FC<TransportSelectionStepProps> = ({
    transportLegs,
    setTransportLegs,
    countries,
    transportDatabase,
    plan,
    uxpContext,
    errors
}) => {
    const addTransportLeg = () => {
        setTransportLegs([...transportLegs, {
            id: transportLegs.length + 1,
            originCountry: "",
            destinationCountry: "",
            originGateway: "",
            destinationGateway: "",
            transportMode: "SeaFreight", // Hardcoded to SeaFreight
            transportDistance: 0,
            transportEmission: 0,
            originGateways: [],
            destinationGateways: [],
            warehouseToOriginDistance: 0,
            destinationToWarehouseDistance: 0
        }]);
    };

    const removeTransportLeg = (legId: number) => {
        if (transportLegs.length > 1) {
            setTransportLegs(transportLegs.filter(leg => leg.id !== legId));
        }
    };

    const distance = async (origin: string, destination: string): Promise<number> => {
        try {
            const response = await calculateTransportDistance(uxpContext, {
                origin: origin,
                destination: destination
            });
            return response.data.distance_in_km;
        } catch (error) {
            console.error('Error calculating transport distance:', error);
            return 0;
        }
    };

    const updateTransportLeg = async (legId: number, field: keyof TransportLeg, value: any) => {
        setTransportLegs(prevLegs => {
            const updatedLegs = prevLegs.map(leg => {
                if (leg.id === legId) {
                    let updatedLeg = { ...leg };

                    if (field === 'originCountry') {
                        updatedLeg = {
                            ...updatedLeg,
                            originCountry: value,
                            originGateways: transportDatabase[value]?.map((gateway: any) => ({
                                label: gateway,
                                value: gateway
                            })) || [],
                            originGateway: '',
                            transportEmission: 0
                        };
                    }
                    else if (field === 'destinationCountry') {
                        updatedLeg = {
                            ...updatedLeg,
                            destinationCountry: value,
                            destinationGateways: transportDatabase[value]?.map((gateway: any) => ({
                                label: gateway,
                                value: gateway
                            })) || [],
                            destinationGateway: '',
                            transportEmission: 0
                        };
                    }
                    else {
                        updatedLeg = {
                            ...updatedLeg,
                            [field]: value
                        };
                    }

                    // Calculate distance only when destination gateway is selected (for professional plan)
                    if (plan === 'professional' && 
                        field === 'destinationGateway' &&
                        updatedLeg.originGateway &&
                        updatedLeg.destinationGateway) {
                        setTimeout(() => {
                            distance(
                                updatedLeg.originGateway,
                                updatedLeg.destinationGateway
                            ).then((distance: number) => {
                                setTransportLegs(currentLegs =>
                                    currentLegs.map(currentLeg =>
                                        currentLeg.id === legId
                                            ? { ...currentLeg, transportDistance: distance, transportEmission: 0 }
                                            : currentLeg
                                    )
                                );
                            }).catch((error: Error) => {
                                console.error('Failed to calculate transport distance:', error);
                            });
                        }, 0);
                    } 
                    // Calculate distance only when destination country is selected (for basic plan)
                    else if (plan !== 'professional' &&
                        field === 'destinationCountry' &&
                        updatedLeg.originCountry &&
                        updatedLeg.destinationCountry) {
                        setTimeout(() => {
                            distance(
                                updatedLeg.originCountry,
                                updatedLeg.destinationCountry
                            ).then((distance: number) => {
                                setTransportLegs(currentLegs =>
                                    currentLegs.map(currentLeg =>
                                        currentLeg.id === legId
                                            ? { ...currentLeg, transportDistance: distance, transportEmission: 0 }
                                            : currentLeg
                                    )
                                );
                            }).catch((error: Error) => {
                                console.error('Failed to calculate transport distance:', error);
                            });
                        }, 0);
                    }

                    return updatedLeg;
                }
                return leg;
            });

            return updatedLegs;
        });
    };

    return (
        <div className="transport-selection-container">
            {transportLegs.map((leg, index) => (
                <div key={leg.id} className="transport-selection-form">
                    <div className="transport-leg-header" style={{ gridColumn: '1 / -1' }}>
                        <h3>Transport Leg {index + 1}</h3>
                        {transportLegs.length > 1 && (
                            <IconButton
                                type="delete"
                                className="remove-leg-button"
                                onClick={() => removeTransportLeg(leg.id)}
                            />
                        )}
                    </div>

                    {/* Road Distance from Warehouse to Origin Port - FULL WIDTH - NOW IN ALL LEGS */}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <FormField>
                            <Label><span className="label-text">Road Distance from Warehouse to Origin Port (km)</span></Label>
                            <input
                                type="number"
                                className="highlighted-select"
                                placeholder="Enter distance in km"
                                value={leg.warehouseToOriginDistance || ''}
                                onChange={(e) => updateTransportLeg(leg.id, 'warehouseToOriginDistance', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.1"
                            />
                        </FormField>
                    </div>

                    {/* Origin Country - LEFT COLUMN */}
                    <FormField>
                        <Label><span className="label-text">Origin Country</span></Label>
                        <Select
                            className={`highlighted-select ${errors[index]?.originCountry ? 'error-field' : ''}`}
                            options={[...countries].sort((a, b) => a.label.localeCompare(b.label))}
                            placeholder="Select Origin Country"
                            selected={leg.originCountry}
                            onChange={(value) => updateTransportLeg(leg.id, 'originCountry', value)}
                        />
                        {errors[index]?.originCountry && (
                            <span className="error-text">Origin country is required</span>
                        )}
                    </FormField>

                    {/* Origin Gateway - RIGHT COLUMN (next to Origin Country) */}
                    {plan === 'professional' ? (
                        <FormField>
                            <Label><span className="label-text">Origin Gateway</span></Label>
                            <Select
                                className={`highlighted-select ${errors[index]?.originGateway ? 'error-field' : ''}`}
                                options={leg.originGateways}
                                placeholder="Select Origin Gateway"
                                selected={leg.originGateway}
                                onChange={(value) => updateTransportLeg(leg.id, 'originGateway', value)}
                            />
                            {errors[index]?.originGateway && (
                                <span className="error-text">Origin gateway is required</span>
                            )}
                        </FormField>
                    ) : (
                        <div></div> // Empty div to maintain grid structure for basic plan
                    )}

                    {/* Destination Country - LEFT COLUMN */}
                    <FormField>
                        <Label><span className="label-text">Destination Country</span></Label>
                        <Select
                            className={`highlighted-select ${errors[index]?.destinationCountry ? 'error-field' : ''}`}
                            options={[...countries].sort((a, b) => a.label.localeCompare(b.label))}
                            placeholder="Select Destination Country"
                            selected={leg.destinationCountry}
                            onChange={(value) => updateTransportLeg(leg.id, 'destinationCountry', value)}
                        />
                        {errors[index]?.destinationCountry && (
                            <span className="error-text">Destination country is required</span>
                        )}
                    </FormField>

                    {/* Destination Gateway - RIGHT COLUMN (next to Destination Country) */}
                    {plan === 'professional' ? (
                        <FormField>
                            <Label><span className="label-text">Destination Gateway</span></Label>
                            <Select
                                className={`highlighted-select ${errors[index]?.destinationGateway ? 'error-field' : ''}`}
                                options={leg.destinationGateways}
                                placeholder="Select Destination Gateway"
                                selected={leg.destinationGateway}
                                onChange={(value) => updateTransportLeg(leg.id, 'destinationGateway', value)}
                            />
                            {errors[index]?.destinationGateway && (
                                <span className="error-text">Destination gateway is required</span>
                            )}
                        </FormField>
                    ) : (
                        <div></div> // Empty div to maintain grid structure for basic plan
                    )}

                    {/* Road Distance from Destination Port to Warehouse - FULL WIDTH - NOW IN ALL LEGS */}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <FormField>
                            <Label><span className="label-text">Road Distance from Destination Port to Warehouse (km)</span></Label>
                            <input
                                type="number"
                                className="highlighted-select"
                                placeholder="Enter distance in km"
                                value={leg.destinationToWarehouseDistance || ''}
                                onChange={(e) => updateTransportLeg(leg.id, 'destinationToWarehouseDistance', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.1"
                            />
                        </FormField>
                    </div>
                </div>
            ))}

            <div className="esgnow-add-transport-leg-container">
                <IconButton
                    type="plus"
                    className="esgnow-add-transport-leg-button"
                    onClick={addTransportLeg}
                />
            </div>
        </div>
    );
};

export default TransportSelectionStep;