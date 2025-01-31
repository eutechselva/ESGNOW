import { Button, SearchBox, FilterPanel, FormField, Label, Select, DataGrid, Modal, Input} from "uxp/components";
import * as React from "react";
import './ProductDashboardWidget.scss';
import Stepper from './stepper-LCA';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";


const productData = [
    {
        icon: "https://static.viking-direct.co.uk/is/image/odeu13/1222167?wid=400&hei=400&fmt=jpg&qlt=75&resMode=sharp2&op_usm=1.2,0.3,10,0",
        title: "ECO-WB-001", subTitle: "Black Executive Office Chair - Leather/Fabric - Arm & Headrest - Domino"
    },
    // { title: "ECO-TB-002", subTitle: "Bamboo Dining Table" },
    // { title: "ECO-LP-003", subTitle: "LED Light Panel" },
    // { title: "ECO-DS-004", subTitle: "Dual Solar Panel" },
    // { title: "ECO-BM-005", subTitle: "Bamboo Mattress" },
    // { title: "ECO-CP-006", subTitle: "Compostable Plates" },
    // { title: "ECO-BL-007", subTitle: "Biodegradable Lunch Box" },
    // { title: "ECO-ST-008", subTitle: "Steel Water Bottle" },
    // { title: "ECO-RT-009", subTitle: "Recycled Tire Mat" },
    // { title: "ECO-SB-010", subTitle: "Solar Powered Backpack" }
];

const LCADashboardWidget: React.FunctionComponent = () => {
    const [showModal, setShowModal] = React.useState(false);
    const [selectedProduct, setSelectedProduct] = React.useState<any>(null);
    const [quantity, setQuantity] = React.useState("");
    const [weight, setWeight] = React.useState("");
    const [productInfo, setProductInfo] = React.useState("");
    const [activeStep, setActiveStep] = React.useState(0);
    const [searchValue, setSearchValue] = React.useState("");
    const [showFilterPanel, setShowFilterPanel] = React.useState(false);

    const [filteredData, setFilteredData] = React.useState(productData);
    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
    const [maxCO2, setMaxCO2] = React.useState<number | null>(null);
    const [showTooltip, setShowTooltip] = React.useState(false);
    const [productWeight, setProductWeight] = useState<number>(25.00);
    const [packagingWeight, setPackagingWeight] = useState<number>(0);
    const [isPackagingManual, setIsPackagingManual] = useState<boolean>(false);
    const [includePallet, setIncludePallet] = useState<boolean>(false);
    const [palletWeight, setPalletWeight] = useState<number>(0);
    const [isPalletManual, setIsPalletManual] = useState<boolean>(false);
    const [isProductWeightEditable, setIsProductWeightEditable] = useState<boolean>(false);

const handleEditProductWeight = () => {
    setIsProductWeightEditable(true);
};

const handleSaveProductWeight = () => {
    setIsProductWeightEditable(false);
};
    

    const totalTransportWeight = productWeight +
        (isPackagingManual ? packagingWeight : 0) +
        (includePallet && isPalletManual ? palletWeight : 0);

    const handleSearchChange = (newValue: string) => {
        setSearchValue(newValue);
        applyFilters(newValue, selectedCategory);
    };

    const applyFilters = (searchText: string, category: string | null) => {
        const filtered = productData.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchText.toLowerCase()) ||
                item.subTitle.toLowerCase().includes(searchText.toLowerCase());

            const matchesCategory = category ? item.subTitle.toLowerCase().includes(category.toLowerCase()) : true;

            return matchesSearch && matchesCategory;
        });
        setFilteredData(filtered);
    };



    const handleClearFilters = () => {
        setSelectedCategory(null);
        setMaxCO2(null);
        setFilteredData(productData);
    };

    const handleCalculateImpact = (product: any) => {
        setSelectedProduct(product);
        setShowModal(true);
        setActiveStep(0);
    };

    const steps = [
        {
            id: "step-1",
            title: "PRODUCT SELECTION",
            content: (
                <div className="product-selection-step">
                    <h3>Product Selection</h3>
                    <div className="selected-product-container">
                        <Label><span style={{ fontSize: '12px', marginRight: '10px' }}>Selected Product:</span></Label>
                        <div className="selected-product">
                            <span className="product-code">{selectedProduct?.title}</span>
                            <span className="product-name">{selectedProduct?.subTitle}</span>
                        </div>
                    </div>

                    <FormField className="product-info-field">
                        <Label><span style={{ fontSize: '12px' }}>Product Information</span></Label>

                        <textarea

                            value={productInfo}
                            onChange={(e) => setProductInfo(e.target.value)}
                            className="product-info-textarea"
                        />
                    </FormField>

                    <FormField className="product-inventory-field">
                        <Label><span style={{ fontSize: '12px', }}> Total Weight Based on Units</span></Label>


                        <div className="product-inventory">
                            <Input
                                placeholder="Enter Quantity"
                                value={quantity}
                                onChange={(value: string) => setQuantity(value)}
                                className="inventory-input"
                            />
                            <span className="inventory-unit">Units</span>
                            <Input
                                placeholder="Enter Weight"
                                value={weight}
                                onChange={(value: string) => setWeight(value)}
                                className="inventory-input"
                            />
                            <span className="inventory-unit">Kg</span>
                        </div>
                    </FormField>
                </div>
            ),
        },

        {
            id: "step-2",
            title: "TRANSPORT SELECTION",
            content: (
                <div>
                    <h3>Transport Selection</h3>
                    <div className="transport-selection-form">
                        {/* Other Form Fields */}
                        <FormField>
                            <Label><span style={{ fontSize: '12px' }}>Origin Country</span></Label>
                            <Select
                                className="highlighted-select"
                                options={[
                                    { label: "Country 1", value: "country1" },
                                    { label: "Country 2", value: "country2" },
                                ]}
                                placeholder="Select Origin Country"
                                selected={""}
                                onChange={(value, option) => { /* Handle change */ }}
                            />
                        </FormField>

                        <FormField>
                            <Label><span style={{ fontSize: '12px' }}>Destination Country</span></Label>
                            <Select
                                className="highlighted-select"
                                options={[
                                    { label: "Country 1", value: "country1" },
                                    { label: "Country 2", value: "country2" },
                                ]}
                                placeholder="Select Destination Country"
                                selected={""}
                                onChange={(value, option) => { /* Handle change */ }}
                            />
                        </FormField>

                        <FormField>
                            <Label><span style={{ fontSize: '12px' }}>Origin Gateway</span></Label>
                            <Select
                                className="highlighted-select"
                                options={[
                                    { label: "Gateway 1", value: "gateway1" },
                                    { label: "Gateway 2", value: "gateway2" },
                                ]}
                                placeholder="Select Origin Gateway"
                                selected={""}
                                onChange={(value, option) => { /* Handle change */ }}
                            />
                        </FormField>

                        <FormField>
                            <Label><span style={{ fontSize: '12px' }}>Destination Gateway</span></Label>
                            <Select
                                className="highlighted-select"
                                options={[
                                    { label: "Gateway 1", value: "gateway1" },
                                    { label: "Gateway 2", value: "gateway2" },
                                ]}
                                placeholder="Select Destination Gateway"
                                selected={""}
                                onChange={(value, option) => { /* Handle change */ }}
                            />
                        </FormField>

                        <FormField>
                            <Label><span style={{ fontSize: '12px' }}>Transport Mode</span></Label>
                            <Select
                                className="highlighted-select"
                                options={[
                                    { label: "Air", value: "air" },
                                    { label: "Sea", value: "sea" },
                                    { label: "Land", value: "land" },
                                ]}
                                placeholder="Select Transport Mode"
                                selected={""}
                                onChange={(value, option) => { /* Handle change */ }}
                            />
                        </FormField>


                        <div className="save-button-container">
                            <Button title="Save" className="save-button" onClick={() => { /* Handle save action */ }} />
                        </div>
                    </div>

                    <div className="add-transport-leg-container">
                        <Button title="Add Transport Leg" className="add-transport-leg-button" onClick={() => { /* Handle add transport leg action */ }} />
                    </div>
                </div>


            ),
        },
        {
            id: "step-3",
            title: "TRANSPORT WEIGHT DETAILS",
            content: (

                <div className="transport-weight-details">
                    <h3 className="title">Transport Weight</h3>
                    <div className="product-weight-section">
                        <div className="weight-input">
                            <label className="label">Product Weight</label>
                            <div className="input-group">
                {isProductWeightEditable ? (
                    <>
                        <Input
                            type="number"
                            value={productWeight.toString()}
                            onChange={(value) => setProductWeight(parseFloat(value))}
                        />
                        <Button 
                            className="save-weight-button"
                            title="Save" 
                            onClick={handleSaveProductWeight}
                        />
                    </>
                ) : (
                    <>
                        <span className="weight-display">{productWeight.toFixed(2)} Kg</span>
                        <Button 
                            className="edit-weight-button"
                            title="Edit" 
                            onClick={handleEditProductWeight}
                        />
                    </>
                )}
            </div>
        </div>
    </div>
                    <div className="weight-section">
                        <label className="label">PACKAGING WEIGHT (CHOOSE BETWEEN ASSISTED OR MANUAL ENTRY)</label>
                        <div className="toggle-group">
                            <label className="toggle-option">
                                <input
                                    type="radio"
                                    checked={!isPackagingManual}
                                    onChange={() => setIsPackagingManual(false)}
                                />
                                Assisted
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
                                    value={packagingWeight.toString()}
                                    onChange={(value) => setPackagingWeight(parseFloat(value))}
                                />
                            ) : (
                                <Input
                                    type="number"
                                    value={packagingWeight.toString()}
                                    onChange={() => { }}
                                    className="disabled-input"
                                />
                            )}
                            <span className="unit">Kg</span>
                        </div>
                    </div>

                    <div className="weight-toggle">
                        <label className="label">Include Pallet Weight?</label>
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
                            <label className="label">PALLET WEIGHT (CHOOSE BETWEEN ASSISTED OR MANUAL ENTRY)</label>
                            <div className="toggle-group">
                                <label className="toggle-option">
                                    <input
                                        type="radio"
                                        checked={!isPalletManual}
                                        onChange={() => setIsPalletManual(false)}
                                    />
                                    Assisted
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
                                        value={palletWeight.toString()}
                                        onChange={(value) => setPalletWeight(parseFloat(value))}
                                    />
                                ) : (
                                    <Input
                                        type="number"
                                        value={palletWeight.toString()}
                                        onChange={() => { }}
                                        className="disabled-input"
                                    />
                                )}
                                <span className="unit">Kg</span>
                            </div>
                        </div>
                    )}

                    <div className="total-weight">
                        <label className="label">Total Transport Weight</label>
                        <div className="weight-display">{totalTransportWeight.toFixed(2)} Kg</div>
                    </div>
                </div>



            ),
        },
        {
            id: "step-4",
            title: "SUMMARY",
            content: (
                <div>
                    <h2>SUMMARY</h2>

                    {/* Product Details */}
                    <div className="summary-section">
                        <h3>PRODUCT DETAILS</h3>
                        <div className="summary-box">
                            <div className="summary-row">
                                <span>Product Code</span>
                                <span>ECO-WB-001</span>
                            </div>
                            <div className="summary-row">
                                <span>Product Name</span>
                                <span>Aluminum Window</span>
                            </div>
                            <div className="summary-row">
                                <span>Inventory</span>
                                <span>150 pcs</span>
                            </div>
                        </div>
                    </div>

                    {/* Transport Details */}
                    <div className="summary-section">
                        <h3>TRANSPORT DETAILS</h3>
                        <div className="summary-box">
                            <div className="summary-row">
                                <span>Origin</span>
                                <span>China - Shanghai Port</span>
                            </div>
                            <div className="summary-row">
                                <span>Destination</span>
                                <span>United States - Los Angeles Port</span>
                            </div>
                            <div className="summary-row">
                                <span>Transport Mode</span>
                                <span>Sea Freight</span>
                            </div>
                            <div className="summary-row">
                                <span>Distance</span>
                                <span>10,000 Km</span>
                            </div>
                        </div>
                    </div>

                    {/* Weight Details */}
                    <div className="summary-section">
                        <h3>WEIGHT DETAILS</h3>
                        <div className="summary-box">
                            <div className="summary-row">
                                <span>Product Weight</span>
                                <span>25.00 Kg</span>
                            </div>
                            <div className="summary-row">
                                <span>Packaging Weight</span>
                                <span>0.55 Kg</span>
                            </div>
                            <div className="summary-row">
                                <span>Pallet Weight</span>
                                <span>2.00 Kg</span>
                            </div>
                            <div className="summary-row">
                                <span>Total Weight</span>
                                <span>27.55 Kg</span>
                            </div>
                        </div>
                    </div>
                    <Button title="Confirm & Calculate" className="confirm-button" onClick={() => setShowModal(false)} />

                </div>
            ),
        },
    ];

    const handleNext = () => {
        if (activeStep < steps.length - 1) {
            setActiveStep(activeStep + 1);
        }
    };

    const handlePrevious = () => {
        if (activeStep > 0) {
            setActiveStep(activeStep - 1);
        }
    };

    return (
        <div className="content">
            <h1 className="dashboard-title">Emission Impact</h1>
            <p className="subheading">Available Products</p>

            <div className="search-filter-section">
                <div className="uxp-search-box-container">
                    <SearchBox
                        placeholder="Search Placeholder"
                        value={searchValue}
                        onChange={handleSearchChange}
                    />
                    <FilterPanel
                        enableClear={!!(selectedCategory || maxCO2)}
                        onClear={handleClearFilters}
                        onOpen={() => setShowFilterPanel(true)}
                        onClose={() => setShowFilterPanel(false)}
                        className="filter-panel"
                    >
                        <FormField className="no-padding mb-only">
                            <Label>Category</Label>
                            <Select
                                selected={selectedCategory}
                                options={[
                                    { label: "Furniture | Windows", value: "Furniture | Windows" },
                                    { label: "Furniture | Dining", value: "Furniture | Dining" },
                                    { label: "Electronics | Lighting", value: "Electronics | Lighting" },
                                    { label: "Energy | Solar", value: "Energy | Solar" },
                                    { label: "Kitchenware | Disposable", value: "Kitchenware | Disposable" },
                                    { label: "Accessories | Drinkware", value: "Accessories | Drinkware" },
                                ]}
                                onChange={(value: string) => {
                                    setSelectedCategory(value);
                                    applyFilters(searchValue, value);
                                }}
                                placeholder=" -- select --"
                            />
                        </FormField>
                        <FormField className="no-padding mb-only">
                            <Label>Max CO2 Emission (Kg CO2e)</Label>
                            <input
                                type="number"
                                min="0"
                                max="5"
                                step="0.1"
                                value={maxCO2 || ""}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                    const value = parseFloat(event.target.value);
                                    setMaxCO2(value);
                                    applyFilters(searchValue, selectedCategory);
                                }}
                                placeholder="Set maximum CO2"
                            />
                        </FormField>
                    </FilterPanel>
                </div>
            </div>

            <DataGrid
                data={productData}
                renderItem={(item) => (
                    <div className="product-card">
                        <img src={item.icon} alt="Product" className="product-image" />
                        <div className="product-details">
                            <p>{item.title}</p>
                            <h4>{item.subTitle}</h4>
                        </div>
                        <Button title="Calculate Impact" className="calculate-impact-button" onClick={() => handleCalculateImpact(item)} />
                    </div>
                )}
                columns={3}
                className="product-data-grid"
            />

            {/* Modal Implementation */}
            <Modal
                show={showModal}
                onClose={() => setShowModal(false)}
                title="Calculate Impact"
                className="custom-modal"
                showCloseButton={true}
            >
                <div className="modal-content">
                    {/* Stepper component */}
                    <div className="modal-stepper-container">
                        <Stepper activeStep={activeStep} onStepChange={setActiveStep} />
                    </div>

                    {steps[activeStep].content}

                    {activeStep < steps.length - 1 && (
                        <div className="modal-footer">
                            <Button
                                className="button-container"
                                title="Next"
                                onClick={handleNext}
                            />
                        </div>
                    )}
                </div>
            </Modal>



        </div>
    );
};

export default LCADashboardWidget;