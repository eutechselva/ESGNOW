// File: ProductSelectionStep.tsx
import * as React from "react";
import { Label, FormField } from "uxp/components";
import './product-selection-step.scss';

interface ProductSelectionStepProps {
    selectedProduct: any;
}

const ProductSelectionStep: React.FC<ProductSelectionStepProps> = ({ selectedProduct }) => {
    return (
        <div className="product-selection-step">
            <div className="product-info-row">
                <div className="label-value-pair">
                    <Label><span className="label-text">Product Code:</span></Label>
                    <span className="product-value">{selectedProduct?.code}</span>
                </div>
            </div>

            <div className="product-info-row">
                <div className="label-value-pair">
                    <Label><span className="label-text">Product Name:</span></Label>
                    <span className="product-value">{selectedProduct?.name}</span>
                </div>
            </div>

            <FormField className="product-info-field">
                <Label><span className="label-text">Product Description:</span></Label>
                <textarea
                    value={selectedProduct?.description}
                    className="product-info-textarea"
                    readOnly
                />
            </FormField>
        </div>
    );
};

export default ProductSelectionStep;