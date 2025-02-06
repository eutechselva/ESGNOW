
import * as React from "react";

import './products.scss';
import { ProductWizard } from "./product-wizard";
import { IContextProvider } from "@uxp";
import HomeDashboard from "./home";

interface IWidgetProps {
    uxpContext?: IContextProvider;
    instanceId?: string;
}

const LCAWidget: React.FunctionComponent<IWidgetProps> = (props) => {
    const [showModal, setShowModal] = React.useState(false);
    const [hasProducts, setHasProducts] = React.useState(true); // Track if products exist


    // Handler to process product information when modal is submitted
    const handleProductInfoChange = (productData: { code: string; name: string; description: string; images: File[]; document: File | null }) => {
        console.log("Product Data:", productData); // Handle the product data here (e.g., send to an API)
    };

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            {hasProducts ? (
                <HomeDashboard /> // Display the HomeDashboard if products exist
            ) : (
                <div>
                    <div className="title-container">
                        <h1 className="heading">Products</h1>
                    </div>

                    <div className="centered-content">
                        <div className="icon-placeholder">
                            <img src="https://icons.veryicon.com/png/o/miscellaneous/fu-jia-intranet/product-29.png"
                                alt="Product Icon"
                                className="placeholder-image"
                            />
                        </div>
                        <h2 className="create-your-first-product">Create your first product</h2>
                        <p className="description-text">
                            Start by creating a product to begin tracking its environmental impact and lifecycle analysis.
                        </p>
                        <button className="create-product-button" onClick={() => setShowModal(true)}>
                            + Create Product
                        </button>
                    </div>

                    <ProductWizard 
                        show={showModal} 
                        onClose={() => setShowModal(false)} 
                        uxpContext={props.uxpContext} 
                    />
                </div>
            )}
        </div>
    );
};

export default LCAWidget;
