export interface TransportLeg {
    id: number;
    transportMode: string;
    originCountry:string;
    originGateway: string;
    destinationCountry:string;
    destinationGateway: string;
    transportEmission: number;
}