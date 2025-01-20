import React from "react";
import "./assessment.scss";
import { Button } from "uxp/components";


const Assessment: React.FC = () => {

return (
    <div className="assessment-container">
      <h1 className="assessment-title">Your PCF has been Successfully Calculated!</h1>

      <div className="product-info">
        <p className="product-name">
          Black Executive Office Chair - Leather/Fabric - Arm & Headrest -Domino
        </p>
        <p className="product-code">ECO-WB-001</p>

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
            <span>10 KgCO₂e</span>
          </p>
          <p className="carbon-item">
            <span>Manufacturing</span>
            <span>10 KgCO₂e</span>
          </p>
          <div className="divider"></div>
          <p className="carbon-total">
            <span>Total Carbon Footprint</span>
            <span>20 KgCO₂e</span>
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
            alert("Save & Close clicked");
          }}
          className="save-close-button"
        />
      </div>
    </div>
  );
};

export default Assessment;