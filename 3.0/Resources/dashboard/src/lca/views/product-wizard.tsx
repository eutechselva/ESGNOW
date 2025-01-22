import React, { useState } from "react";
import { Modal, Button } from "uxp/components";
import Stepper from "./stepper";
import ProductInformation from "./product-information";
import ProductCategorization from "./product-categorization";
import BillMaterials from "./bill-materials";
import ProductManufacturing from "./product-manufacturing";
import { ProductCategoryInfo } from "../types/product-category-info.type";
import { ProductInfo } from "../types/product-info.type";
import { BillMaterial } from "../types/bill-material-type";
import "./product-wizard.scss";
import Assessment from "./assessment";

interface ProductWizardProps {
    show: boolean; 
    onClose: () => void;
}

type ProductData = {
    code: string;
    name: string;
    description: string;
    images: File[];
    document: File | null;
};

export const ProductWizard = ({ show, onClose }: ProductWizardProps) => {
    const [activeStep, setActiveStep] = useState(0);

    // State to hold product information data
    const [productInfoData, setProductInfoData] = useState<ProductData>({
        code: "",
        name: "",
        
        description: "",
        images: [],
        document: null,
    });

    // State to hold product categorization data
    const [productCategoryData, setProductCategoryData] = useState<ProductCategoryInfo>({
        category: "",
        subCategory: "",
        numberOfUnits: "",
        totalWeight: "",
        brandName: "",
        supplierName: "",
        country: "",
    });

    // State to hold bill of materials data
    const [billMaterialsData, setBillMaterialsData] = useState<BillMaterial[]>([]);

    const handleStepChange = (step: number) => {
        setActiveStep(step);
    };

    const handleProductInfoChange = (productData: ProductInfo) => {
        setProductInfoData(productData);
        if (activeStep < 4) setActiveStep(activeStep + 1);
    };

    const handleProductCategoryChange = (productData: ProductCategoryInfo) => {
        setProductCategoryData(productData);
        setActiveStep(activeStep + 1);
    };

    const handleBillMaterialsChange = (materials: BillMaterial[]) => {
        setBillMaterialsData(materials);
        setActiveStep(activeStep + 1);
    };

    const handleDone = () => {
        console.log("Product creation complete");
        onClose();
    };

    return (
        <Modal show={show} onOpen={() => { }} onClose={onClose}
            title="Create Product" // Use title instead of headerContent
            className="custom-modal">
            <Stepper activeStep={activeStep} onStepChange={handleStepChange} />

            {activeStep === 0 && (
                <ProductInformation
                    productData={productInfoData}
                    onNext={handleProductInfoChange}
                />
            )}
            {activeStep === 1 && (
                <ProductCategorization
                    productCategoryData={productCategoryData}
                    productData={productInfoData}
                    onNext={handleProductCategoryChange}
                />
            )}
            {activeStep === 2 && (
                <BillMaterials
                    productCategoryData={productCategoryData}
                    productData={productInfoData}
                    onNext={handleBillMaterialsChange}
                />
            )}
            {activeStep === 3 && (
                <ProductManufacturing
                    productCategoryData={productCategoryData}
                    productData={productInfoData}
                    billMaterials={billMaterialsData}
                />
            )}

            {/* Rendering the "Done" button on the last step */}
            {activeStep === 3 && (
                <div className="done-button-container">
                    <Button title="Done" onClick={handleDone} />
                </div>
            )}

            {activeStep === 4 && <Assessment />}

        </Modal>
    );
};

export default ProductWizard;
