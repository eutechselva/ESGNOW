import React, { useEffect, useState } from "react";
import "./assessment.scss";
import { Button } from "uxp/components";


interface AssessmentProps {
  newlyCreatedProduct: {
    code: string;
    name: string;
    co2EmissionRawMaterials:  number;
    co2EmissionFromProcesses: number;
    co2Emission: number;
    images: string[];

  },
  onClose: () => void;
  setShowCloseWarning: React.Dispatch<React.SetStateAction<boolean>>;
}

const Assessment: React.FC<AssessmentProps> = ({ newlyCreatedProduct, onClose  ,setShowCloseWarning}) => {

  const [pendingClose, setPendingClose] = useState(false);

  useEffect(() => {
    if (pendingClose) {
      onClose(); // Only call onClose after state update
      setPendingClose(false); // Reset the flag
    }
  }, [pendingClose]); // Triggered when `pendingClose` is updated

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
            <span>{newlyCreatedProduct.co2EmissionRawMaterials.toFixed(2)} KgCO₂e</span>
          </p>
          <p className="carbon-item">
            <span>Manufacturing</span>
            <span>{ newlyCreatedProduct.co2EmissionFromProcesses.toFixed(2)} KgCO₂e</span>
          </p>
          <div className="divider"></div>
          <p className="carbon-total">
            <span>Total Carbon Footprint</span>
            <span>{ newlyCreatedProduct.co2Emission.toFixed(2) } KgCO₂e</span>
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
        {/* <Button
          title="Continue"
          onClick={() => {
            alert("Continue clicked");
          }}
          className="continue-button"
        /> */}
        <Button
          title="Save"
          onClick={() => {
            setShowCloseWarning(false);
            setPendingClose(true);
          }}
          className="esgnow-save-close-button"
          // icon="https://static.iviva.com/images/floppy-disk.png"
        />
      </div>
    </div>
  );
};

export default Assessment;