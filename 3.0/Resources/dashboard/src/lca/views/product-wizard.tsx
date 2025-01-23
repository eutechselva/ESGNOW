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
import API_BASE_URL from "../config";
import { ProductManufacturingProcess } from "../types/product-manufacturing-process.type";
import Assessment from "./assessment";
import { IContextProvider } from "@uxp";

interface ProductWizardProps {
    show: boolean; 
    onClose: () => void;
    uxpContext : IContextProvider;
}

type ProductData = {
    code: string;
    name: string;
    description: string;
    images: File[];
    document: File | null;
    uploadedImages: string[];
};

export const ProductWizard = ({ show, onClose ,uxpContext }: ProductWizardProps) => {
    const [activeStep, setActiveStep] = useState(0);

    const [newlyCreatedProduct, setNewlyCreatedProduct] = useState<any>();

    // State to hold product information data
    const [productInfoData, setProductInfoData] = useState<ProductData>({
        code: "",
        name: "",
        
        description: "",
        images: [],
        document: null,
        uploadedImages: [],
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
    const [productManufacturingProcess, setProductManufacturingProcess] = useState< { materialClass: string ,specificMaterial : String, weight : Number, manufacturingProcesses: ProductManufacturingProcess[]; }[]>([]);

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

    const handleDone = async () =>  {
      
       
        

        const payload = {
            code: productInfoData.code,
            name: productInfoData.name,
            description: productInfoData.description,
            images: productInfoData.uploadedImages,
            weight : productCategoryData.totalWeight,
            category: productCategoryData.category,
            subCategory: productCategoryData.subCategory,
            brandName: productCategoryData.brandName,
            supplierName: productCategoryData.supplierName,
            countryOfOrigin: productCategoryData.country,
            materials : billMaterialsData,
            productManufacturingProcess : productManufacturingProcess,
            
        };
    
        try {
            const response = await fetch(`${API_BASE_URL}/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
    
            const data = await response.json();
            setNewlyCreatedProduct(data);
            console.log('Product creation complete', data);
            setActiveStep(activeStep + 1);
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
        
        //onClose();
    };

    return (
        <Modal show={show} onOpen={() => { }} onClose={onClose}  
        title="Create Product" 
    className="custom-modal">
            <Stepper activeStep={activeStep} onStepChange={handleStepChange} />

            {activeStep === 0 && (
                <ProductInformation
                    productData={productInfoData}
                    onNext={handleProductInfoChange} uxpContext={uxpContext}                />
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
                onProductManufacturingChange={setProductManufacturingProcess}
                />
            )}

            {/* Rendering the "Done" button on the last step */}
            {activeStep === 3 && (
                <div className="done-button-container">
                    <Button title="Create" onClick={handleDone} />
                </div>
            )}

            {activeStep === 4 && <Assessment newlyCreatedProduct={newlyCreatedProduct} onClose={onClose} />}

        </Modal>
    );
};

export default ProductWizard;
