// File: WeightDetailsStep.tsx
import * as React from "react";
import { Label, Input } from "uxp/components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import './weight-details-step.scss';

interface WeightDetailsStepProps {
    selectedProduct: any;
    packagingWeight: number;
    setPackagingWeight: React.Dispatch<React.SetStateAction<number>>;
    isPackagingManual: boolean;
    setIsPackagingManual: React.Dispatch<React.SetStateAction<boolean>>;
    includePallet: boolean;
    setIncludePallet: React.Dispatch<React.SetStateAction<boolean>>;
    palletWeight: number;
    setPalletWeight: React.Dispatch<React.SetStateAction<number>>;
    isPalletManual: boolean;
    setIsPalletManual: React.Dispatch<React.SetStateAction<boolean>>;
    totalTransportWeight: number;
}

const WeightDetailsStep: React.FC<WeightDetailsStepProps> = ({
    selectedProduct,
    packagingWeight,
    setPackagingWeight,
    isPackagingManual,
    setIsPackagingManual,
    includePallet,
    setIncludePallet,
    palletWeight,
    setPalletWeight,
    isPalletManual,
    setIsPalletManual,
    totalTransportWeight
}) => {
    const [showTooltip, setShowTooltip] = React.useState<boolean>(false);

    return (
        <div className="transport-weight-details">
            <div className="product-weight-section">
                <div className="input-group-top">
                    <Label><span className="label-text">Product Weight:</span></Label>
                    <span className="weight-display">
                        {parseFloat(selectedProduct?.weight).toFixed(2)} Kg
                    </span>
                </div>
            </div>

            <div className="weight-section">
                <Label>
                    <span className="label-text">Packaging Weight</span>
                    <span
                        className="info-icon"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <FontAwesomeIcon icon={faInfoCircle} />
                        {showTooltip && (
                            <div className="tooltip">
                                Select Assistance to estimate packaging weight (10% of product weight), 
                                or enter the weight manually if known
                            </div>
                        )}
                    </span>
                </Label>

                <div className="weight-input-row">
                    <div className="toggle-group">
                        <label className="toggle-option">
                            <input
                                type="radio"
                                checked={!isPackagingManual}
                                onChange={() => setIsPackagingManual(false)}
                            />
                            AI Assistance
                        </label>
                        <label className="toggle-option">
                            <input
                                type="radio"
                                checked={isPackagingManual}
                                onChange={() => setIsPackagingManual(true)}
                            />
                            Manual Entry
                        </label>
                    </div>
                    <div className="input-group">
                        {isPackagingManual ? (
                            <Input
                                type="number"
                                value={packagingWeight.toFixed(2)}
                                onChange={(value) => setPackagingWeight(parseFloat(value))}
                                inputAttr={{ step: "0.01" }}
                            />
                        ) : (
                            <Input
                                type="number"
                                value={packagingWeight.toFixed(2)}
                                onChange={() => { }}
                                inputAttr={{ step: "0.01" }}
                                className="disabled-input"
                            />
                        )}
                        <span className="unit">Kg</span>
                    </div>
                </div>
            </div>

            <div className="weight-toggle">
                <Label><span className="label-text">Include Pallet Weight?</span></Label>
                <label className="switch">
                    <input
                        type="checkbox"
                        checked={includePallet}
                        onChange={(e) => setIncludePallet(e.target.checked)}
                    />
                    <span className="slider"></span>
                </label>
            </div>

            {includePallet && (
                <div className="weight-section">
                    <Label>
                        <span className="label-text">Pallet Weight</span>
                        <span
                            className="info-icon"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                        >
                            <FontAwesomeIcon icon={faInfoCircle} />
                            {showTooltip && (
                                <div className="tooltip">
                                    Select Assistance to apply an industry-standard pallet weight 
                                    (typically 13.6 kg to 21.8 kg), or enter the weight manually if known
                                </div>
                            )}
                        </span>
                    </Label>

                    <div className="weight-input-row">
                        <div className="toggle-group">
                            <label className="toggle-option">
                                <input
                                    type="radio"
                                    checked={!isPalletManual}
                                    onChange={() => setIsPalletManual(false)}
                                />
                                AI Assistance
                            </label>
                            <label className="toggle-option">
                                <input
                                    type="radio"
                                    checked={isPalletManual}
                                    onChange={() => setIsPalletManual(true)}
                                />
                                Manual Entry
                            </label>
                        </div>
                        <div className="input-group">
                            {isPalletManual ? (
                                <Input
                                    type="number"
                                    value={palletWeight.toFixed(2)}
                                    onChange={(value) => setPalletWeight(parseFloat(value))}
                                    inputAttr={{ step: "0.01" }}
                                />
                            ) : (
                                <Input
                                    type="number"
                                    value={palletWeight.toFixed(2)}
                                    onChange={() => { }}
                                    inputAttr={{ step: "0.01" }}
                                    className="disabled-input"
                                />
                            )}
                            <span className="unit">Kg</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="total-weight">
                <Label><span className="label-text">Total Transport Weight</span></Label>
                <div className="weight-display">{totalTransportWeight.toFixed(2)} Kg</div>
            </div>
        </div>
    );
};

export default WeightDetailsStep;