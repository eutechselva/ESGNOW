import * as React from "react";
import './product-list-view.scss';

interface ProductListViewProps {
    currentItems: any[];
    selectProduct: (product: any) => void;
}

const ProductListView: React.FC<ProductListViewProps> = ({ currentItems, selectProduct }) => {
    return (
        <div className="product-list">
            <div className="list-header">
                <div className="list-col-image"></div>
                <div className="list-col-name">Product Name</div>
                <div className="list-col-category">Category</div>
                <div className="list-col-subcategory">SubCategory</div>
                <div className="list-col-weight">Weight</div>
                <div className="list-col-actions">Actions</div>
            </div>
            
            {currentItems.map((item, index) => (
                <div className="list-item" key={item.code || index}>
                    <div className="list-col-image">
                        <div 
                            className="list-item-thumbnail"
                            style={{
                                backgroundImage: item.images && item.images.length > 0 ? 
                                    `url(${item.images[0]})` : 'none'
                            }}
                        >
                            {(!item.images || item.images.length === 0) && "No Image"}
                        </div>
                    </div>
                    <div className="list-col-name">
                        <div className="product-name-code">
                            <span className="product-name">{item.name}</span>
                            <span className="product-code">{item.code}</span>
                        </div>
                    </div>
                    <div className="list-col-category">
                        <div>{item.category || "Uncategorized"}</div>
                    </div>
                    <div className="list-col-subcategory">
                        <div>{item.subCategory || "—"}</div>
                    </div>
                    <div className="list-col-weight">{item.weight} Kg</div>
                    <div className="list-col-actions">
                        <button 
                            type="button"
                            className="view-details-button" 
                            onClick={() => selectProduct(item)}
                        >
                            Calculate
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProductListView;