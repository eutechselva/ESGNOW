import * as React from "react";
import { Modal, FormField, Label, Input } from "uxp/components";
import "./stepper.scss";
import { useState } from "react";

interface StepperProps {
    activeStep: number;
    onStepChange: (step: number) => void;
}

const steps = ["Product Information", "Product Categorization", "Bill of Materials", "Product Manufacturing","Assessment"];
//const steps = ["Product Information", "Product Categorization", "Bill of Materials"];
// const steps = ["Product Selection", "Transport Selection", "Transport Weight"];

const Stepper: React.FC<StepperProps> = ({ activeStep, onStepChange }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="stepper">
            {steps.map((label, index) => (
                <div
                    key={index}
                    className={`step ${index === activeStep ? "active" : ""} ${index < activeStep ? "completed" : ""}`}
                    onClick={() => onStepChange(index)}
                >
                    <div className="step-number">{index + 1}</div>
                    <div className="step-label">{label}  
                        {/* {stepsToolTip[index] && ( // Only render icon if tooltip is not empty
                            // <span
                            //     className="info-icon"
                            //     onMouseEnter={() => setShowTooltip(true)}
                            //     onMouseLeave={() => setShowTooltip(false)}
                            // >
                            //     <FontAwesomeIcon icon={faInfoCircle} />
                            //     {showTooltip && (
                            //         <div className="tooltip">
                            //             {stepsToolTip[index]}
                            //         </div>
                            //     )}
                            // </span>
                        )} */}
                         </div>
                </div>
            ))}
        </div>
    );
};

export default Stepper;
