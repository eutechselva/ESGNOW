
import * as React from "react";
import './products.scss';
import { ProductWizard } from "./product-wizard";
import { IContextProvider } from "@uxp";

interface IWidgetProps {
    uxpContext?: IContextProvider;
    instanceId?: string;
}

const LCAWidget: React.FunctionComponent<IWidgetProps> = (props) => {
    const [showModal, setShowModal] = React.useState(false);

    // Handler to process product information when modal is submitted
    const handleProductInfoChange = (productData: { code: string; name: string; description: string; images: File[]; document: File | null }) => {
        console.log("Product Data:", productData); // Handle the product data here (e.g., send to an API)
    };

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>

            <div className="title-container">

                <h1 className="heading">Products</h1>
                <p className="subheading">Monitor your Products' Carbon Footprint across their Lifecycle</p>


                {/* <p className="heading">Products</p>
                <p className="subheading">Monitor your Products' Environmental Footprint across their Lifecycle</p> */}
            </div>

            {/* Centered Content */}
            <div className="centered-content">
                <div className="icon-placeholder">
                    <img src="https://icons.veryicon.com/png/o/miscellaneous/fu-jia-intranet/product-29.png"

                        alt="Product Icon"
                        className="placeholder-image"
                    />
                </div>
                <h2 className="create-your-first-product"> Create your first product</h2>
                <p className="description-text">Start by creating a product to begin tracking its environmental impact and lifecycle analysis.</p>
                <button className="create-product-button" onClick={() => setShowModal(true)}>
                    + Create Product
                </button>
            </div>


            <ProductWizard
                show={showModal}
                onClose={() => setShowModal(false)}

            />
        </div>
    );
};

export default LCAWidget;
