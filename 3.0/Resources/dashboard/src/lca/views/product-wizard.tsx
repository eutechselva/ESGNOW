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
import { ProductManufacturingProcess } from "../types/product-manufacturing-process.type";
import Assessment from "./assessment";
import { IContextProvider } from "@uxp";
import { createProduct } from "../../esgnow-service";

interface ProductWizardProps {
    show: boolean;
    onClose: () => void;
    uxpContext: IContextProvider;
    onProductCreated?: () => void;
    setShowCloseWarning: React.Dispatch<React.SetStateAction<boolean>>;
}

type ProductData = {
    code: string;
    name: string;
    description: string;
    images: File[];
    document: File | null;
    uploadedImages: string[];
};

export const ProductWizard = ({ show, onClose, uxpContext, onProductCreated ,setShowCloseWarning}: ProductWizardProps) => {
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
        images : [],
    });

    // State to hold bill of materials data
    const [billMaterialsData, setBillMaterialsData] = useState<BillMaterial[]>([]);
    const [productManufacturingProcess, setProductManufacturingProcess] = useState<{ materialClass: string, specificMaterial: String, weight: Number, manufacturingProcesses: ProductManufacturingProcess[]; }[]>([]);

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

    const handleDone = async () => {

        const payload = {
            code: productInfoData.code,
            name: productInfoData.name,
            description: productInfoData.description,
            images: productInfoData.uploadedImages,
            weight: productCategoryData.totalWeight,
            category: productCategoryData.category,
            subCategory: productCategoryData.subCategory,
            brandName: productCategoryData.brandName,
            supplierName: productCategoryData.supplierName,
            countryOfOrigin: productCategoryData.country,
            materials: billMaterialsData,
            productManufacturingProcess: productManufacturingProcess,
            
        };

        try {

            const data = await createProduct(uxpContext, payload);

            console.log('Product creation complete', data);

            setNewlyCreatedProduct(data.data);

            setActiveStep(activeStep + 1);

            // Call the callback to trigger reload in parent component
            if (onProductCreated) {
                onProductCreated();
            }
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }

        //onClose();
    };

    const onCloseEx = () =>{
        // Clean up all session storage related to this product
        if (productInfoData && productInfoData.code) {
            sessionStorage.removeItem(`product_${productInfoData.code}_materials`);
            sessionStorage.removeItem(`product_${productInfoData.code}_entry_type`);
        }
        
        onClose();
        setActiveStep(0);
        setProductInfoData({
            code: "",
            name: "",
    
            description: "",
            images: [],
            document: null,
            uploadedImages: [],
        });
        setProductCategoryData({
            category: "",
            subCategory: "",
            numberOfUnits: "",
            totalWeight: "",
            brandName: "",
            supplierName: "",
            country: "",
            images: [],
        });
        setBillMaterialsData([]);
        setProductManufacturingProcess([]);
        
        // Clear all session storage related to any products
        // Using a separate array to store keys to prevent issues with changing sessionStorage during iteration
        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && (key.includes('_materials') || key.includes('_entry_type'))) {
                keysToRemove.push(key);
            }
        }
        
        // Remove all marked keys
        keysToRemove.forEach(key => {
            sessionStorage.removeItem(key);
        });
    }

    return (
        <Modal className="lgs-create-product-modal" show={show} onOpen={() => {  setShowCloseWarning(true); }} onClose={onCloseEx}
            title="Create Product"
        >
            <Stepper activeStep={activeStep} onStepChange={handleStepChange} />

            {activeStep === 0 && (
                <ProductInformation
                    productData={productInfoData}
                    onNext={handleProductInfoChange} 
                    uxpContext={uxpContext} 
                />
            )}
            {activeStep === 1 && (
                <ProductCategorization
                    productCategoryData={productCategoryData}
                    productData={productInfoData}
                    onNext={handleProductCategoryChange}
                    uxpContext={uxpContext}
                />
            )}
            {activeStep === 2 && (
                <BillMaterials
                    productCategoryData={productCategoryData}
                    productData={productInfoData}
                    onNext={handleBillMaterialsChange}
                    uxpContext={uxpContext}
                />
            )}
            {activeStep === 3 && (
                <ProductManufacturing
                    productCategoryData={productCategoryData}
                    productData={productInfoData}
                    billMaterials={billMaterialsData}
                    onProductManufacturingChange={setProductManufacturingProcess}
                    uxpContext={uxpContext}
                />
            )}

            {/* Rendering the "Done" button on the last step */}
            {/* {activeStep === 3 && (
                <div className="done-button-container">
                    <Button 
                        title="Create" 
                        onClick={handleDone} 
                        disabled={billMaterialsData.length === 0 || !productManufacturingProcess || productManufacturingProcess.length === 0}
                    />
                    {billMaterialsData.length === 0 ? (
                        <p className="button-helper-text">Please add materials before proceeding</p>
                    ) : !productManufacturingProcess || productManufacturingProcess.length === 0 ? (
                        <p className="button-helper-text">Please define at least one manufacturing process</p>
                    ) : null}
                </div>
            )} */}
                {/* Rendering the "Done" button on the last step with verbose logging */}
                {activeStep === 3 && (
                <div className="done-button-container">
                    {productManufacturingProcess.length > 0 ? (
                        <>
                            <Button
                            className="esgnow-next-button"
                            title="Next"
                            disabled={!productManufacturingProcess || productManufacturingProcess.length === 0}
                            onClick={handleDone}
                        />
                        </>
                    ) : null}
                </div>
            )}

            {activeStep === 4 && <Assessment newlyCreatedProduct={newlyCreatedProduct} onClose={onCloseEx} setShowCloseWarning={setShowCloseWarning}/>}

        </Modal>
    );
};

export default ProductWizard;
