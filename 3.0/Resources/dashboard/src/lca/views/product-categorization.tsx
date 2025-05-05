import React, { useEffect, useState } from "react";
import { Modal, FormField, Label, Input, Button, Select } from "uxp/components";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import './product-categorization.scss';
import { ProductCategoryInfo } from "../types/product-category-info.type";
import { ProductInfo } from "../types/product-info.type";
import { classifyProduct, productCategories } from "../../esgnow-service";
import { IContextProvider } from "@uxp";

interface ProductCategorizationProps {
    productCategoryData: ProductCategoryInfo;
    productData: ProductInfo;
    onNext?: (productCategory: ProductCategoryInfo) => void;
    uxpContext: IContextProvider;
}

const ProductCategorization: React.FC<ProductCategorizationProps> = ({ productCategoryData, productData, onNext, uxpContext }) => {
    const [productCategory, setProductCategory] = useState<string>("");
    const [productSubCategory, setProductSubCategory] = useState<string>("");
    const [categoryOptions, setCategoryOptions] = useState<{ label: string, value: string }[]>([]);
    const [subcategoryOptions, setSubcategoryOptions] = useState<{ label: string, value: string }[]>([]);
    const [numberOfUnits, setNumberOfUnits] = useState<string>(productCategoryData.numberOfUnits || "");
    const [totalWeight, setTotalWeight] = useState<string>(productCategoryData.totalWeight || "");
    const [productBrandName, setProductBrandName] = useState<string>(productCategoryData.brandName);
    const [supplierName, setSupplierName] = useState<string>(productCategoryData.supplierName);
    const [country, setCountry] = useState<string>(productCategoryData.country);
    const [showTooltip, setShowTooltip] = useState(false);
    const [aiGenerating, setAIGenerating] = useState(false);

    const [errorTotalWeight, setErrorTotalWeight] = useState<string>("");

    const [categoryData, setCategoryData] = useState<{ [key: string]: string[] }>({}); // Store the entire category data

    const handleTotalWeightChange = (value: string) => {
        setTotalWeight(value);
        if (parseFloat(value) <= 0) {
            setErrorTotalWeight("Total weight must be a positive number");
        } else {
            setErrorTotalWeight("");
        }
    };

    useEffect(() => {
        const fetchCategoryDataAndClassify = async () => {
            try {

                // Fetch category data
                const response = await productCategories(uxpContext);

                const data = await response.data;
                console.log("Fetched Category Data:", data);

                setCategoryData(data); // Store the full category data

                const formattedCategories = Object.keys(data).map(category => ({
                    label: String(category), // Explicitly cast to string
                    value: String(category) // Explicitly cast to string
                }));
                setCategoryOptions(formattedCategories);

                // Call classifyProduct after setting options
                await fetchClassifyProduct(data);
            } catch (error) {
                console.error("Error fetching category data:", error);
            }
        };

        const fetchClassifyProduct = async (data: { [key: string]: string[] }) => {
            try {
                setAIGenerating(true);
                const classifyProductPayload = {
                    name: productData.name,
                    description: productData.description,
                    productCode: productData.code
                };

                const response = await classifyProduct(uxpContext, classifyProductPayload);

                const classificationData = await response.data;
                console.log("Classified Product Data:", classificationData);

                // Set default category and subcategory
                setProductCategory(classificationData.category || "");
                setProductSubCategory(classificationData.subcategory || "");

                // Update subcategory options based on the classified category
                const initialSubcategories = data[classificationData.category] || [];
                setSubcategoryOptions(initialSubcategories.map(subcategory => ({
                    label: String(subcategory),
                    value: String(subcategory)
                })));
                setAIGenerating(false);
            } catch (error) {
                console.error("Error classifying product:", error);
            }
        };

        fetchCategoryDataAndClassify();
    }, [productData]);

    const handleCategoryChange = (selectedCategory: string) => {
        setProductCategory(selectedCategory);

        // Update subcategory options based on the selected category
        const subcategories = categoryData[selectedCategory] || [];
        setSubcategoryOptions(subcategories.map(subcategory => ({
            label: String(subcategory),
            value: String(subcategory)
        })));
        setProductSubCategory(""); // Reset subcategory selection
    };

    const handleNext = () => {
        if (totalWeight === "" || parseFloat(totalWeight) <= 0) {
            setErrorTotalWeight("Total weight must be a positive number");
            return

        }

        const productData: ProductCategoryInfo = {
            category: productCategory,
            subCategory: productSubCategory,
            numberOfUnits: numberOfUnits,
            totalWeight: totalWeight,
            brandName: productBrandName,
            supplierName: supplierName,
            country: country
        };
        onNext?.(productData);
    };

    return (
        <div className="modal-content">

            {aiGenerating && (<div className="loading-overlay"></div>)}

            <div style={{ display: 'flex', gap: '16px' }}>
                <FormField>
                    <Label><span style={{ fontSize: '12px' }}>Category</span><span
                        className="info-icon"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <FontAwesomeIcon icon={faInfoCircle} />
                        {showTooltip && (
                            <div className="tooltip">
                                Category and Sub Category are AI-generated based on your input and can be edited as needed.
                            </div>
                        )}
                    </span></Label>
                    <Select
                        options={categoryOptions}
                        selected={productCategory}
                        onChange={(value) => handleCategoryChange(value)}
                        className="custom-select"
                    />
                </FormField>


                <FormField>
                    <Label><span style={{ fontSize: '12px' }}>Sub Category</span><span
                        className="info-icon"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <FontAwesomeIcon icon={faInfoCircle} />
                        {showTooltip && (
                            <div className="tooltip">
                                Category and Sub Category are AI-generated based on your input and can be edited as needed.
                            </div>
                        )}
                    </span></Label>
                    <Select
                        options={subcategoryOptions}
                        selected={productSubCategory}
                        onChange={(value) => setProductSubCategory(value)}
                        className="custom-select"
                    />
                </FormField>

            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
                <FormField>
                    <Label><span style={{ fontSize: '12px' }}>Supplier Name</span></Label>
                    <Input
                        type="text"
                        value={supplierName}
                        onChange={(value) => setSupplierName(value)}
                        placeholder="Enter supplier name"
                    />
                </FormField>

                <FormField>
                    <Label><span style={{ fontSize: '12px' }}>Total Weight (Kg)</span></Label>
                    <Input
                        type="number"
                        value={totalWeight}
                        onChange={(value) => handleTotalWeightChange(value)}
                        placeholder="Enter total weight"
                    />
                    {errorTotalWeight && <div className="error-text">{errorTotalWeight}</div>}
                </FormField>

            </div>


            <FormField>
                <Label><span style={{ fontSize: '12px' }}>Country of Manufacture</span></Label>
                <Select
                    options={[

                        { label: 'China', value: 'CN' },
                        { label: 'Vietnam', value: 'VN' },
                        { label: 'Global', value: 'RoW' },
                        { label: 'Czech Republic', value: 'CZ' },
                        { label: 'France', value: 'FR' },
                        { label: 'Netherlands', value: 'NL' },
                        { label: 'Poland', value: 'PL' },
                        { label: 'Spain', value: 'ES' },
                        { label: 'Taiwan', value: 'TW' },
                        { label: 'United States', value: 'US' },
                        { label: 'United Kingdom', value: 'UK' },
                        { label: 'Rest of the World', value: 'RoW' },
                        // Add more countries as needed
                    ]}
                    selected={country}
                    onChange={(value) => setCountry(value)}
                />
            </FormField>



            <Button className="button-container" title="Next" onClick={handleNext} />
        </div>
    );
};

export default ProductCategorization;
