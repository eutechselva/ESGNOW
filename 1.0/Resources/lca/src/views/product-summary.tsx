import React from "react";
import { Button } from "uxp/components";
import "./product-summary.scss";
import { ProductManufacturingProcess } from "../types/product-manufacturing-process.type";


interface Material {
    materialClass: string;
    specificMaterial: string;
    weight: string;
    unit: string;
    processes: ProductManufacturingProcess[];
}

interface ProductSummaryProps {
    productCode: string;
    productName: string;
    materials: Material[];
    onBack: () => void;
    onDone: () => void;
}

const ProductSummary: React.FC<ProductSummaryProps> = ({ productCode, productName, materials, onBack, onDone }) => {
    return (
        <div className="product-summary">
            <h2>Product Manufacturing Summary</h2>
            
            <div className="product-details">
                <p><strong>Product Code:</strong> {productCode}</p>
                <p><strong>Product Name:</strong> {productName}</p>
            </div>

            <div className="materials-processes">
                <h3>Materials & Processes</h3>
                <table className="summary-table">
                    <thead>
                        <tr>
                            <th>Material Class</th>
                            <th>Specific Material</th>
                            <th>Weight</th>
                            <th>Processes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {materials.map((material, index) => (
                            <tr key={index}>
                                <td>{material.materialClass}</td>
                                <td>{material.specificMaterial}</td>
                                <td>{material.weight} {material.unit}</td>
                                <td>
                                    {material.processes.map((process, pIndex) => (
                                        <div key={pIndex} className="process-item">
                                            <strong>{process.category}</strong>
                                            <ul>
                                                {process.processes.map((subProcess, spIndex) => (
                                                    <li key={spIndex}>{subProcess}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Button title="Back" className="back-button" onClick={onBack} />
          
        </div>
        
    );
};

export default ProductSummary;
