export interface TransportLeg {
    id: number;
    transportMode: string;
    originGateway: string;
    destinationGateway: string;
    transportEmission: number;
}