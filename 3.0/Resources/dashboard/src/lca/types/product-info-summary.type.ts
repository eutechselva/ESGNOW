export type ProductInfoSummary = {
    icon: string;
    code: string;
    name: string;
    description: string;
    countryOfOrigin: string;
    category: string;
    subCategory: string;
    weight:Number;
    images: string[];
    co2Emission : Number;
    co2EmissionRawMaterials : Number;
    co2EmissionFromProcesses : Number;
    productManufacturingProcess : [];
    materials : [];
}
