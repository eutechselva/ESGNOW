import React from "react";
import "./assessment.scss";
import { Button } from "uxp/components";


interface AssessmentProps {
  newlyCreatedProduct: {
    code: string;
    name: string;
    co2EmissionRawMaterials: string;
    co2EmissionFromProcesses: string;
    co2Emission: string;
    images: string[];

  },
  onClose: () => void;
}

const Assessment: React.FC<AssessmentProps> = ({ newlyCreatedProduct, onClose }) => {

  return (
    <div className="assessment-container">
      <h1 className="assessment-title">Your PCF has been Successfully Calculated!</h1>

      <div className="product-info">
        <p className="product-name">
          {newlyCreatedProduct.name}
        </p>
        <p className="product-code">{newlyCreatedProduct.code} </p>

        <div className="image-container">
          {newlyCreatedProduct?.images?.length > 0 ? (
            newlyCreatedProduct.images.map((image, index) => (
              <div className="image-placeholder" key={index}>
                <img src={image} alt={`Product Image ${index + 1}`} />
              </div>
            ))
          ) : (
            <div className="no-images">No images available</div>
          )}
        </div>
      </div>

      <div className="carbon-footprint">
        <h2 className="carbon-footprint-title">Product Carbon Footprint</h2>
        <div className="carbon-details">
          <p className="carbon-item">
            <span>Raw Materials</span>
            <span>{newlyCreatedProduct.co2EmissionRawMaterials} KgCO₂e</span>
          </p>
          <p className="carbon-item">
            <span>Manufacturing</span>
            <span>{ parseInt(newlyCreatedProduct.co2EmissionFromProcesses).toFixed(2)} KgCO₂e</span>
          </p>
          <div className="divider"></div>
          <p className="carbon-total">
            <span>Total Carbon Footprint</span>
            <span>{ parseInt(newlyCreatedProduct.co2Emission).toFixed(2) } KgCO₂e</span>
          </p>
        </div>
      </div>

      {/* <p className="calculation-message">
        Your PCF has been successfully calculated!
      </p> */}
      <p className="calculation-subtext">
        Continue the steps to assess your impact or save and return later.
      </p>

      <div className="button-group">
        <Button
          title="Continue"
          onClick={() => {
            alert("Continue clicked");
          }}
          className="continue-button"
        />
        <Button
          title="Save & Close"
          onClick={() => {
            //alert("Save & Close clicked");
            onClose();
          }}
          className="save-close-button"
        />
      </div>
    </div>
  );
};

export default Assessment;