import { Button, SearchBox, FilterPanel, FormField, Label, Select, DataGrid, Modal, Input, } from "uxp/components";
import * as React from "react";
import './ProductDashboardWidget.scss';
import Stepper from './stepper-LCA';
import { useState } from "react";
import EmissionSummary from './emission-summary';
import API_BASE_URL from "../config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { executeComponent } from "@utils";
import { Icon } from "@fortawesome/fontawesome-svg-core";
import { IContextProvider } from "@uxp";
import { getAllProducts } from "../../esgnow-service";

interface TransportLeg {
    id: number;
    originCountry: string;
    destinationCountry: string;
    originGateway: string;
    destinationGateway: string;
    transportMode: string;
    transportDistance: number;
    transportEmission: number; // Added new field
    originGateways: any[];
    destinationGateways: any[];
}

interface DistanceResponse {
    origin : string;
    destination: string;
    distance_in_km: number;
}

interface ILCADashboardWidgetProps {
   context: IContextProvider;
}


const LCADashboardWidget: React.FC<ILCADashboardWidgetProps> = ({context}) => {
    const [products, setProducts] = React.useState([]);
    const [transportDatabase, setTransportDatabase] = React.useState<{ [key: string]: any }>({});

    const [countries, setCountries] = React.useState([]);
    const [showModal, setShowModal] = React.useState(false);
    const [selectedProduct, setSelectedProduct] = React.useState<any>(null);
    const [activeStep, setActiveStep] = React.useState(0);
    const [searchValue, setSearchValue] = React.useState("");
    const [showFilterPanel, setShowFilterPanel] = React.useState(false);
    const [filteredData, setFilteredData] = React.useState(products);
    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
    const [maxCO2, setMaxCO2] = React.useState<number | null>(null);
    const [packagingWeight, setPackagingWeight] = useState<number>(0);
    const [isPackagingManual, setIsPackagingManual] = useState<boolean>(false);
    const [includePallet, setIncludePallet] = useState<boolean>(false);
    const [palletWeight, setPalletWeight] = useState<number>(20);
    const [isPalletManual, setIsPalletManual] = useState<boolean>(false);
    const [isProductWeightEditable, setIsProductWeightEditable] = useState<boolean>(false);
    const [isEmissionSummaryVisible, setisEmissionSummaryvisible] = useState<boolean>(false);
    const [transportationEmission, setTransportationEmission] = useState<string>("");
    const [totalTransportWeight, setTotalTransportWeight] = useState<number>(0);
    const [showTooltip, setShowTooltip] = useState<boolean>(false);

    const handleConfirmCalculate = async () => {
        
        setisEmissionSummaryvisible(true);
        setShowModal(false);
    };

    const calculateTransportationEmission = async () => {
        const emission = await Promise.all(
            transportLegs.map(async (leg) => {
                const emission = await calculateSingleLegEmission(leg);
                return { ...leg, transportEmission: emission };
            })
        );
        setTransportLegs(emission);
        const totalEmission = emission.reduce((sum, leg) => sum + leg.transportEmission, 0);
        setTransportationEmission(totalEmission.toString());
        
    }


    React.useEffect(() => {
        const fetchProductData = async () => {

            const data =  await getAllProducts(context);
            setProducts(data.data);

            };

        fetchProductData();
    }, []);

    React.useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/transportDB`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setTransportDatabase(data);
                const formattedOptions = Object.keys(data).map((country: string) => ({
                    label: country, // Replace `name` with the appropriate field
                    value: country // Replace `code` with the appropriate field
                }));
                setCountries(formattedOptions);
                console.log("Countries:", countries);


            } catch (error) {
                console.error('There was a problem with the fetch operation:', error);
            }
        };

        fetchCountries();
    }, []);

    const calculateTransportDistance = async (origin: string, destination: string): Promise<number> => {
        try {
            const url = `${API_BASE_URL}/api/distance?origin=${origin}&destination=${destination}`;
            const response = await fetch(url, {
                method: 'GET',
            });
            const data: DistanceResponse = await response.json();
            return data.distance_in_km;
        } catch (error) {
            console.error('Error calculating transport distance:', error);
            return 0;
        }
    };



    React.useEffect(() => {

        if (includePallet) {
            setTotalTransportWeight(parseFloat((selectedProduct?.weight || 0)) + packagingWeight + palletWeight);
        }
        else {
            setTotalTransportWeight(parseFloat((selectedProduct?.weight || 0)) + packagingWeight);
        }
    }, [packagingWeight, palletWeight, includePallet, selectedProduct?.weight]);



    const handleSearchChange = (newValue: string) => {
        setSearchValue(newValue);
        applyFilters(newValue, selectedCategory);
    };

    const applyFilters = (searchText: string, category: string | null) => {
        const filtered = products.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchText.toLowerCase()) ||
                item.subTitle.toLowerCase().includes(searchText.toLowerCase());

            const matchesCategory = category ? item.subTitle.toLowerCase().includes(category.toLowerCase()) : true;

            return matchesSearch && matchesCategory;
        });
        setFilteredData(filtered);
    };

    const calculateSingleLegEmission = async (leg: TransportLeg): Promise<number> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/calculate-transport-emission`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    weightKg: totalTransportWeight,
                    transportMode: leg.transportMode,
                    transportKm: leg.transportDistance,
                })
            });
            const data = await response.json();
            return parseFloat(data.transportEmissions);
        } catch (error) {
            console.error('Error calculating transport emission:', error);
            return 0;
        }
    };

    const handleClearFilters = () => {
        setSelectedCategory(null);
        setMaxCO2(null);
        setFilteredData(products);
    };

    const selectProduct = (product: any) => {
        setSelectedProduct(product);

        setShowModal(true);
        setActiveStep(0);
    };

    React.useEffect(() => {
        setPackagingWeight((((selectedProduct?.weight || 0)) / 100) * 10);
    }, [selectProduct]);


    const [transportLegs, setTransportLegs] = useState<TransportLeg[]>([{
        id: 1,
        originCountry: "",
        destinationCountry: "",
        originGateway: "",
        destinationGateway: "",
        transportMode: "",
        transportDistance: 0,
        transportEmission: 0, // Added new field initialization
        originGateways: [],
        destinationGateways: []
    }]);

    const addTransportLeg = () => {
        setTransportLegs([...transportLegs, {
            id: transportLegs.length + 1,
            originCountry: "",
            destinationCountry: "",
            originGateway: "",
            destinationGateway: "",
            transportMode: "",
            transportDistance: 0,
            transportEmission: 0, 
            originGateways: [],
            destinationGateways: []
        }]);
    };

    const updateTransportLeg = async (legId: number, field: keyof TransportLeg, value: any) => {
        setTransportLegs(prevLegs => {
            const updatedLegs = prevLegs.map(leg => {
                if (leg.id === legId) {
                    let updatedLeg = { ...leg };
    
                    if (field === 'originCountry') {
                        updatedLeg = {
                            ...updatedLeg,
                            originCountry: value,
                            originGateways: transportDatabase[value]?.map((gateway: any) => ({ 
                                label: gateway, 
                                value: gateway 
                            })) || [],
                            originGateway: '',
                            transportEmission: 0 // Reset emission when changing route
                        };
                    }
                    else if (field === 'destinationCountry') {
                        updatedLeg = {
                            ...updatedLeg,
                            destinationCountry: value,
                            destinationGateways: transportDatabase[value]?.map((gateway: any) => ({ 
                                label: gateway, 
                                value: gateway 
                            })) || [],
                            destinationGateway: '',
                            transportEmission: 0 // Reset emission when changing route
                        };
                    }
                    else {
                        updatedLeg = {
                            ...updatedLeg,
                            [field]: value,
                            ...(field === 'transportMode' && { transportEmission: 0 }) // Reset emission when changing mode
                        };
                    }
    
                    if (field === 'transportMode' && 
                        updatedLeg.originGateway && 
                        updatedLeg.destinationGateway) {
                        setTimeout(() => {
                            calculateTransportDistance(
                                updatedLeg.originGateway,
                                updatedLeg.destinationGateway
                            ).then((distance: number) => {
                                setTransportLegs(currentLegs => 
                                    currentLegs.map(currentLeg => 
                                        currentLeg.id === legId 
                                            ? { ...currentLeg, transportDistance: distance, transportEmission: 0 }
                                            : currentLeg
                                    )
                                );
                            }).catch((error: Error) => {
                                console.error('Failed to calculate transport distance:', error);
                            });
                        }, 0);
                    }
    
                    return updatedLeg;
                }
                return leg;
            });
    
            return updatedLegs;
        });
    };

    const removeTransportLeg = (legId: number) => {
        if (transportLegs.length > 1) {
            setTransportLegs(transportLegs.filter(leg => leg.id !== legId));
        }
    };

    const steps = [
        {
            id: "step-1",
            title: "PRODUCT SELECTION",
            content: (
                <div>

                    <div className="product-selection-step">

                        <div className="selected-product-container">
                            <Label><span style={{ fontSize: '12px', marginRight: '10px' }}>Selected Product:</span></Label>
                            <div className="selected-product">
                                <span className="product-code">{selectedProduct?.code}</span>
                                <span className="product-name">{selectedProduct?.name}</span>
                            </div>
                        </div>

                        <FormField className="product-info-field">
                            <Label><span style={{ fontSize: '12px' }}>Product Information</span></Label>

                            <textarea

                                value={selectedProduct?.description}
                                
                                className="product-info-textarea"
                            />
                        </FormField>

                        {/* <FormField className="product-inventory-field">
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
                    </FormField> */}
                    </div>
                </div>
            ),
        },

        {
            id: "step-2",
            title: "TRANSPORT SELECTION",
            content: (
                <div>
                    {transportLegs.map((leg, index) => (
                        <div key={leg.id} className="transport-selection-form">
                            <div className="transport-leg-header">
                                <h3>Transport Leg {index + 1}</h3>

                            </div>
                            <div>
                                {transportLegs.length > 1 && (
                                    <Button
                                        title="Remove"
                                        className="remove-leg-button"
                                        onClick={() => removeTransportLeg(leg.id)}
                                    />
                                )}
                            </div>


                            <FormField>
                                <Label><span style={{ fontSize: '12px' }}>Origin Country</span></Label>
                                <Select
                                    className="highlighted-select"
                                    options={countries}
                                    placeholder="Select Origin Country"
                                    selected={leg.originCountry}
                                    onChange={(value) => {
                                        updateTransportLeg(leg.id, 'originCountry', value);

                                    }}
                                />
                            </FormField>

                            <FormField>
                                <Label><span style={{ fontSize: '12px' }}>Destination Country</span></Label>
                                <Select
                                    className="highlighted-select"
                                    options={countries}
                                    placeholder="Select Destination Country"
                                    selected={leg.destinationCountry}
                                    onChange={(value) => {
                                        updateTransportLeg(leg.id, 'destinationCountry', value);

                                    }}
                                />
                            </FormField>

                            <FormField>
                                <Label><span style={{ fontSize: '12px' }}>Origin Gateway</span></Label>
                                <Select
                                    className="highlighted-select"
                                    options={leg.originGateways}
                                    placeholder="Select Origin Gateway"
                                    selected={leg.originGateway}
                                    onChange={(value) => updateTransportLeg(leg.id, 'originGateway', value)}
                                />
                            </FormField>

                            <FormField>
                                <Label><span style={{ fontSize: '12px' }}>Destination Gateway</span></Label>
                                <Select
                                    className="highlighted-select"
                                    options={leg.destinationGateways}
                                    placeholder="Select Destination Gateway"
                                    selected={leg.destinationGateway}
                                    onChange={(value) => updateTransportLeg(leg.id, 'destinationGateway', value)}
                                />
                            </FormField>

                            <FormField>
                                <Label><span style={{ fontSize: '12px' }}>Transport Mode</span></Label>
                                <Select
                                    className="highlighted-select"
                                    options={[
                                        { label: "SeaFreight", value: "SeaFreight" },
                                        { label: "RoadFreight", value: "RoadFreight" },
                                        { label: "RailFreight", value: "RailFreight" },
                                        { label: "AirFreight", value: "AirFreight" },
                                    ]}
                                    placeholder="Select Transport Mode"
                                    selected={leg.transportMode}
                                    onChange={(value) => updateTransportLeg(leg.id, 'transportMode', value)}
                                />
                            </FormField>
                        </div>
                    ))}

                    <div className="add-transport-leg-container">
                        <Button
                            title="Add Transport Leg"
                            className="add-transport-leg-button"
                            onClick={addTransportLeg}
                        />
                    </div>
                </div>
            ),
        },
        {
            id: "step-3",
            title: "TRANSPORT WEIGHT DETAILS",
            content: (
                <div>

                    <div className="transport-weight-details">

                        <div className="product-weight-section">
                            <div className="input-group-top">
                                <Label><span style={{ fontSize: '12px' }}>Product Weight:</span></Label>

                                {isProductWeightEditable ? (
                                    <>
                                        {/* <Input
                    type="number"
                    value={productWeight.toString()}
                    onChange={(value) => setProductWeight(parseFloat(value))}
                /> */}
                                        {/* <Button className="save-weight-button" title="Save" onClick={handleSaveProductWeight} /> */}
                                    </>
                                ) : (
                                    <>
                                        <span className="weight-display">{parseFloat(selectedProduct?.weight).toFixed(2)} Kg</span>
                                        {/* <Button className="edit-weight-button" title="Edit" onClick={handleEditProductWeight} /> */}
                                    </>
                                )}
                            </div>
                        </div>

<div className="weight-section">
<Label><span style={{ fontSize: '12px' }}>Packaging Weight</span>
<span
                        className="info-icon"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <FontAwesomeIcon icon={faInfoCircle} />
                        {showTooltip && (
                            <div className="tooltip">
                                Select Assistance to estimate packaging weight (10% of product weight), or enter the weight manually if known
                            </div>
                        )}
                    </span></Label>

 
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
</div>

                        <div className="weight-toggle">
                            <Label><span style={{ fontSize: '12px' }}>Include Pallet Weight?</span></Label>


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
<Label><span style={{ fontSize: '12px' }}>Pallet Weight</span>
<span
                        className="info-icon"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <FontAwesomeIcon icon={faInfoCircle} />
                        {showTooltip && (
                            <div className="tooltip">
                                Select Assistance to apply an industry-standard pallet weight (typically 13.6 kg to 21.8 kg), or enter the weight manually if known
                            </div>
                        )}
                    </span></Label>

                          
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
                        </div>
                    )}

                        <div className="total-weight">
                            <Label><span style={{ fontSize: '12px' }}>Total Transport Weight</span></Label>
                            <div className="weight-display">{totalTransportWeight} Kg</div>
                        </div>
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
                                <span>{selectedProduct?.code}</span>
                            </div>
                            <div className="summary-row">
                                <span>Product Name</span>
                                <span>{selectedProduct?.name}</span>
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
                        {transportLegs.map((leg, index) => (
                            <div key={leg.id} className="summary-box">
                                <h4>Transport Leg {index + 1}</h4>
                                <div className="summary-row">
                                    <span>Origin Country</span>
                                    <span>{leg.originCountry}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Destination Country</span>
                                    <span>{leg.destinationCountry}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Origin Gateway</span>
                                    <span>{leg.originGateway}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Destination Gateway</span>
                                    <span>{leg.destinationGateway}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Transport Mode</span>
                                    <span>{leg.transportMode}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Distance</span>
                                    <span>{leg.transportDistance} Km</span>
                                </div>
                                <div className="summary-row">
                                    <span>Estimated Emissions</span>
                                    <span>{leg.transportEmission.toFixed(2)} Kg CO2e</span>
                                </div>
                            </div>
                        ))}

                    </div>

                    {/* Weight Details */}
                    <div className="summary-section">
                        <h3>WEIGHT DETAILS</h3>
                        <div className="summary-box">
                            <div className="summary-row">
                                <span>Product Weight</span>
                                <span>{selectedProduct?.weight}</span>
                            </div>
                            <div className="summary-row">
                                <span>Packaging Weight</span>
                                <span>{packagingWeight}</span>
                            </div>
                            <div className="summary-row">
                                <span>Pallet Weight</span>
                                <span>{ includePallet ?  palletWeight : 0}</span>
                            </div>
                            <div className="summary-row">
                                <span>Total Weight</span>
                                <span>{parseFloat(selectedProduct?.weight) + packagingWeight + (includePallet ?  palletWeight : 0)}</span>
                            </div>
                        </div>
                    </div>
                    <Button title="Confirm & Calculate" className="confirm-button" onClick={() => handleConfirmCalculate()} />

                </div>
            ),
        },
    ];

    const handleNext = () => {
        if (activeStep < steps.length - 1) {
            setActiveStep(activeStep + 1);
        }
        if(activeStep === 1){
           
            calculateTransportationEmission();
        }
    };

    const handlePrevious = () => {
        if (activeStep > 0) {
            setActiveStep(activeStep - 1);
        }
    };
    if (isEmissionSummaryVisible) { return <EmissionSummary transportLegs={transportLegs} transportationEmission={transportationEmission} product={selectedProduct} onBack={() => setisEmissionSummaryvisible(false)}></EmissionSummary> }
    return (
        <div className="content">
            <h1 className="dashboard-title">Impact Analysis</h1>
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
                data={products}
                renderItem={(item) => (
                    <div className="product-card">
                        <img src={item.images[0]} alt="Product" className="product-image" />
                        <div className="product-details">
                            <p>{item.code}</p>
                            <h4>{item.name}</h4>
                        </div>
                        <Button title="Calculate Impact" className="calculate-impact-button" onClick={() => selectProduct(item)} />
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
    className="lgs-calculate-impact-modal"
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