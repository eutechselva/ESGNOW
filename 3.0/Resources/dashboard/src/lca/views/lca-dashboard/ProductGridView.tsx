import * as React from "react";
import { Button } from "uxp/components";
import './product-grid-view.scss';

interface ProductGridViewProps {
    currentItems: any[];
    selectProduct: (product: any) => void;
}

const ProductGridView: React.FC<ProductGridViewProps> = ({ currentItems, selectProduct }) => {
    return (
        <div className="product-grid">
            {currentItems.map((item, index) => (
                <div 
                    key={item.code || index}
                    className="product-card" 
                >
                    <div className="product-card-header">
                        <div className="product-code">{item.code}</div>
                        {item.emission && (
                            <div className="co2-emission">
                                <span className="co2-value">{(item.emission || 0).toFixed(2)}</span>
                                <span className="co2-unit">Kg CO₂e</span>
                            </div>
                        )}
                    </div>
                    
                    <div 
                        className="product-image-container"
                        style={{
                            backgroundImage: item.images && item.images.length > 0 ? 
                                `url(${item.images[0]})` : 'none'
                        }}
                    >
                        {(!item.images || item.images.length === 0) && (
                            <div className="no-image">
                                <span>No Image Available</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="product-card-content">
                        <h3 className="product-name">{item.name}</h3>
                        <div className="product-meta">
                            <span className="product-category">{item.category || "Uncategorized"}</span>
                        </div>
                        
                        <div className="product-details-preview">
                            <div className="product-weight">
                                <span className="detail-label">Weight:</span>
                                <span className="detail-value">{item.weight} Kg</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="product-card-footer">
                        <button 
                            type="button"
                            className="calculate-impact-button" 
                            onClick={() => selectProduct(item)}
                        >
                            Calculate Impact
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProductGridView;