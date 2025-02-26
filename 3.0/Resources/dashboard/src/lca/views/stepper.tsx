import * as React from "react";
import "./stepper.scss";
import { useState } from "react";

interface StepperProps {
    activeStep: number;
    onStepChange: (step: number) => void;
}

const steps = ["Information", "Categorization", "Materials", "Manufacturing","Assessment"];


const Stepper: React.FC<StepperProps> = ({ activeStep, onStepChange }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="stepper">
            {steps.map((label, index) => (
                <div
                    key={index}
                    className={`step ${index === activeStep ? "active" : ""} ${index < activeStep ? "completed" : ""} ${index > activeStep ? "disabled" : ""}`}
                    onClick={() => {
                        if (index <= activeStep) {
                            onStepChange(index);
                        }
                    }}
                >
                    <div className="step-number">{index + 1}</div>
                    <div className="step-label">{label}</div>
                </div>
            ))}
        </div>
    );
};

export default Stepper;
