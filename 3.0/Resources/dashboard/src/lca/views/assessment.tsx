import React from "react";
import "./assessment.scss";
import { Button } from "uxp/components";


interface AssessmentProps {
  newlyCreatedProduct: {
    code: string ;
    name: string;
    co2EmissionRawMaterials :string;
    co2EmissionFromProcesses :string;
    co2Emission :string;

  },
  onClose: () => void;
}

const Assessment: React.FC<AssessmentProps> = ({ newlyCreatedProduct ,onClose }) => {

return (
    <div className="assessment-container">
      <h1 className="assessment-title">Your PCF has been Successfully Calculated!</h1>

      <div className="product-info">
        <p className="product-name">
       {newlyCreatedProduct.name} 
        </p>
        <p className="product-code">{newlyCreatedProduct.code} </p>

        <div className="image-container">
          <div className="image-placeholder"></div>
          <div className="image-placeholder"></div>
          <div className="image-placeholder"></div>
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
            <span>{newlyCreatedProduct.co2EmissionFromProcesses} KgCO₂e</span>
          </p>
          <div className="divider"></div>
          <p className="carbon-total">
            <span>Total Carbon Footprint</span>
            <span>{newlyCreatedProduct.co2Emission} KgCO₂e</span>
          </p>
        </div>
      </div>

      {/* <p className="calculation-message">
        Your PCF has been successfully calculated!
      </p> */}
      <p className="calculation-subtext">
      Complete the analysis by calculating transportation emissions, or save your progress and do it later?
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