export type ProductInfoSummary = {
    icon: string;
    code: string;
    name: string;
    description: string;
    countryOfOrigin: string;
    category: string;
    subCategory: string;
    weight:string;
    images: string[];
    co2Emission : string;
    co2EmissionRawMaterials : string;
    co2EmissionFromProcesses : string;
    productManufacturingProcess : [];
    materials : [];
}