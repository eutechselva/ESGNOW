import * as React from "react";
import { Modal, FormField, Label, Input } from "uxp/components";
import "./stepper.scss"; 

interface StepperProps {
    activeStep: number;
    onStepChange: (step: number) => void;
}

const steps = ["Product Selection", "Transport Selection", "Transport Weight"];

const Stepper: React.FC<StepperProps> = ({ activeStep, onStepChange }) => {
    return (
        <div className="stepper">
            {steps.map((label, index) => (
                <div
                    key={index}
                    className={`step ${index === activeStep ? "active" : ""} ${index < activeStep ? "completed" : ""}`}
                    onClick={() => onStepChange(index)}
                >
                    <div className="step-number">{index + 1}</div>
                    <div className="step-label">{label}</div>
                </div>
            ))}
        </div>
    );
};

export default Stepper;
