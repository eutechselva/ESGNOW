// File: TransportSelectionStep.tsx
import * as React from "react";
import { Button, FormField, Label, Select } from "uxp/components";
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

const TransportSelectionStep: React.FC<TransportSelectionStepProps> = ({ 
    transportLegs, 
    setTransportLegs, 
    countries, 
    transportDatabase,
    plan,
    uxpContext
}) => {
    const addTransportLeg = () => {
        setTransportLegs([...transportLegs, {
            id: transportLegs.length + 1,
            originCountry: "",
            destinationCountry: "",
            originGateway: "",
            destinationGateway: "",
            transportMode: "",
            transportDistance: 0,
            transportEmission: 0,
            originGateways: [],
            destinationGateways: []
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
                            [field]: value,
                            ...(field === 'transportMode' && { transportEmission: 0 })
                        };
                    }

                    // Calculate distance if all required fields are filled
                    if (field === 'transportMode' &&
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
                    } else if (field === 'transportMode' &&
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
                    <div className="transport-leg-header">
                        <h3>Transport Leg {index + 1}</h3>
                    </div>
                    
                    <div className="remove-leg-container">
                        {transportLegs.length > 1 && (
                            <Button
                                title="Remove"
                                className="remove-leg-button"
                                onClick={() => removeTransportLeg(leg.id)}
                            />
                        )}
                    </div>

                    <FormField>
                        <Label><span className="label-text">Origin Country</span></Label>
                        <Select
                            className="highlighted-select"
                            options={countries}
                            placeholder="Select Origin Country"
                            selected={leg.originCountry}
                            onChange={(value) => updateTransportLeg(leg.id, 'originCountry', value)}
                        />
                    </FormField>

                    <FormField>
                        <Label><span className="label-text">Destination Country</span></Label>
                        <Select
                            className="highlighted-select"
                            options={countries}
                            placeholder="Select Destination Country"
                            selected={leg.destinationCountry}
                            onChange={(value) => updateTransportLeg(leg.id, 'destinationCountry', value)}
                        />
                    </FormField>

                    {plan === 'professional' && (
                        <FormField>
                            <Label><span className="label-text">Origin Gateway</span></Label>
                            <Select
                                className="highlighted-select"
                                options={leg.originGateways}
                                placeholder="Select Origin Gateway"
                                selected={leg.originGateway}
                                onChange={(value) => updateTransportLeg(leg.id, 'originGateway', value)}
                            />
                        </FormField>
                    )}

                    {plan === 'professional' && (
                        <FormField>
                            <Label><span className="label-text">Destination Gateway</span></Label>
                            <Select
                                className="highlighted-select"
                                options={leg.destinationGateways}
                                placeholder="Select Destination Gateway"
                                selected={leg.destinationGateway}
                                onChange={(value) => updateTransportLeg(leg.id, 'destinationGateway', value)}
                            />
                        </FormField>
                    )}

                    <FormField>
                        <Label><span className="label-text">Transport Mode</span></Label>
                        <Select
                            className="highlighted-select"
                            options={[
                                { label: "SeaFreight", value: "SeaFreight" },
                                // Additional transport modes could be added here
                            ]}
                            placeholder="Select Transport Mode"
                            selected={leg.transportMode}
                            onChange={(value) => updateTransportLeg(leg.id, 'transportMode', value)}
                        />
                    </FormField>
                </div>
            ))}

            <div className="add-transport-leg-container">
                <Button
                    title="Add Transport Leg"
                    className="add-transport-leg-button"
                    onClick={addTransportLeg}
                />
            </div>
        </div>
    );
};

export default TransportSelectionStep;