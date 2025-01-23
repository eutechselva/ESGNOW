import { FormField, Label, Input } from "uxp/components";
import * as React from "react";
import './product-information.scss';
import { Button } from 'uxp/components';
import { ProductInfo } from "../types/product-info.type";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons/faInfoCircle";



interface ProductInformationProps {
    productData: ProductInfo;
    onNext: (productData: ProductInfo) => void;
}

const ProductInformation: React.FC<ProductInformationProps> = ({ productData, onNext }) => {
    const [productCode, setProductCode] = React.useState(productData.code);
    const [productName, setProductName] = React.useState(productData.name);
    const [productDescription, setProductDescription] = React.useState(productData.description);
    const [productImages, setProductImages] = React.useState<File[]>(productData.images);
    const [imagePreviews, setImagePreviews] = React.useState<string[]>(
        productData.images.map((file) => URL.createObjectURL(file))
    );
    const [document, setDocument] = React.useState<File | null>(productData.document);
    const [showTooltip, setShowTooltip] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);

    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    // Handler for image upload
    const handleImageUpload = (files: FileList) => {
        const fileArray = Array.from(files);
        if (fileArray.length + productImages.length <= 3) {
            const newImagePreviews = fileArray.map((file) => URL.createObjectURL(file));
            setProductImages([...productImages, ...fileArray]);
            setImagePreviews([...imagePreviews, ...newImagePreviews]);
        } else {
            alert("You can upload a maximum of 3 images.");
        }
    };

    // Handlers for drag and drop events
    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        if (event.dataTransfer.files) {
            handleImageUpload(event.dataTransfer.files);
        }
    };

    // Handler for clicking the drop zone
    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            handleImageUpload(event.target.files);
        }
    };


    const handleRemoveImage = (index: number) => {
        const updatedImages = productImages.filter((_, i) => i !== index);
        const updatedPreviews = imagePreviews.filter((_, i) => i !== index);

        setProductImages(updatedImages);
        setImagePreviews(updatedPreviews);
    };

    // Handler for document upload
    const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        setDocument(file);
    };

    // Handler to remove the uploaded document
    const handleRemoveDocument = () => {
        setDocument(null);
    };


    const handleNext = () => {
        const productData = {
            code: productCode,
            name: productName,
            description: productDescription,
            images: productImages,
            document,
        };
        onNext(productData);
    };

    return (
        <div className="modal-content">
             <h3>Fill in the fields below to assist with the analysis. Providing as much detail as possible helps the AI deliver better support for your assessment.</h3> 

            <div style={{ display: 'flex', gap: '16px' }}>
                <FormField>
                    <Label><span style={{ fontSize: '12px' }}>Product Code</span></Label>
                    <Input
                        type="text"
                        value={productCode}
                        onChange={(value) => setProductCode(value)}
                        placeholder="Enter product code"
                    />
                </FormField>

                <FormField>
                    <Label><span style={{ fontSize: '12px' }}>Product Name</span></Label>
                    <Input
                        type="text"
                        value={productName}
                        onChange={(value) => setProductName(value)}
                        placeholder="Enter product name"
                    />
                </FormField>
            </div>

            <FormField>
                <Label><span style={{ fontSize: '12px' }}>Product Description</span></Label>
                <textarea
                    value={productDescription}
                    onChange={(event) => setProductDescription(event.target.value)}
                    placeholder="Enter product description"
                    style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '8px',
                        fontSize: '12px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        fontFamily:'comfortaa'
                    }}
                />
            </FormField>


            {/* Drag and Drop Area for Images */}
            <FormField>
                <Label><span style={{ fontSize: '12px' }}>Product Images</span>
                <span
                                className="info-icon"
                                onMouseEnter={() => setShowTooltip(true)}
                                onMouseLeave={() => setShowTooltip(false)}
                            >
                                {/* <FontAwesomeIcon icon={faInfoCircle} /> */}
                                {showTooltip && (
                                    <div className="tooltip">
                                       Upload up to 3 images in JPG, PNG, or compatible formats to provide visual details.
                                    </div>
                                )}
                            </span>
                </Label>
                <div
                    className={`drop-zone ${isDragging ? 'drag-over' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleClick}
                >
                    <p>Drag & drop your images here, or click to select</p>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageFileChange}
                        ref={fileInputRef}
                        className="file-input"
                    />

                    <div className="uploaded-images">
                        {imagePreviews.map((preview, index) => (
                            <div key={index} className="image-preview">
                                <img src={preview} alt={`Preview ${index + 1}`} />
                                <button onClick={() => handleRemoveImage(index)} className="remove-image-button">
                                    ✕
                                </button>
                                <p>{productImages[index]?.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </FormField>

            <FormField>
                <Label><span style={{ fontSize: '12px' }}>Evidence Document</span>
                <span
                                className="info-icon"
                                onMouseEnter={() => setShowTooltip(true)}
                                onMouseLeave={() => setShowTooltip(false)}
                            >
                                {/* <FontAwesomeIcon icon={faInfoCircle} /> */}
                                {showTooltip && (
                                    <div className="tooltip">
                                       Add any files that substantiate product data, like certification documents or audit reports, in accepted formats: PDF, DOC, JPG, PNG.
                                    </div>
                                )}
                            </span>
                </Label>
                <div className="dotted-container">
                    <input
                        type="file"
                        accept=".pdf, .doc, .docx"
                        onChange={handleDocumentUpload}
                        className="document-upload-input"
                    />
                    <p>{document ? document.name : "Drag & drop or click to upload your document"}</p>
                    {document && (
                        <button onClick={handleRemoveDocument} className="remove-document-button">
                            Remove Document
                        </button>
                    )}
                </div>
            </FormField>

            {/* Next Button */}
            <Button
                className="button-container"
                title="Next"
                onClick={handleNext}
            />
        </div>
    );
};

export default ProductInformation;
