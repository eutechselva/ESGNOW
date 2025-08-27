import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Button, SearchBox, FilterPanel, FormField, Label, Select, DataGrid, Modal, IconButton } from "uxp/components";
import { IContextProvider } from "@uxp";
import { getAllProducts, transportDB, calculateTransportEmission } from "../../../esgnow-service";
import ProductSelectionStep from "./ProductSelectionStep";
import TransportSelectionStep from "./TransportSelectionStep";
import EmissionSummary from '../emission-summary';
import Stepper from '../stepper-LCA';
import WeightDetailsStep from "./WeightDetailsStep";
import SummaryStep from "./SummaryStep";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThLarge, faList, faSort, faSearch, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import ProductGridView from "./ProductGridView";
import ProductListView from "./ProductListView";
import Pagination from "./Pagination";
import './lca-dashboard.scss';
// Add new interfaces for error state
interface ValidationError {
    originCountry?: boolean;
    destinationCountry?: boolean;
    originGateway?: boolean;
    destinationGateway?: boolean;
    // Removed transportMode since it's hardcoded
}

export interface TransportLeg {
    id: number;
    originCountry: string;
    destinationCountry: string;
    originGateway: string;
    destinationGateway: string;
    transportMode: string;
    transportDistance: number;
    transportEmission: number;
    originGateways: any[];
    destinationGateways: any[];
}

interface ILCADashboardWidgetProps {
    uxpContext: IContextProvider;
}

const LCADashboardWidget: React.FC<ILCADashboardWidgetProps> = ({ uxpContext }) => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [transportDatabase, setTransportDatabase] = useState<{ [key: string]: any }>({});
    const [countries, setCountries] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [activeStep, setActiveStep] = useState(0);
    const [searchValue, setSearchValue] = useState("");
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
    const [packagingWeight, setPackagingWeight] = useState<number>(0);
    const [isPackagingManual, setIsPackagingManual] = useState<boolean>(false);
    const [includePallet, setIncludePallet] = useState<boolean>(false);
    const [palletWeight, setPalletWeight] = useState<number>(20);
    const [isPalletManual, setIsPalletManual] = useState<boolean>(false);
    const [isEmissionSummaryVisible, setIsEmissionSummaryVisible] = useState<boolean>(false);
    const [transportationEmission, setTransportationEmission] = useState<string>("");
    const [totalTransportWeight, setTotalTransportWeight] = useState<number>(0);
    const [plan, setPlan] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [sortOption, setSortOption] = useState<string>("date_newest");
    const [categories, setCategories] = useState<{ label: string, value: string }[]>([]);
    const [subCategories, setSubCategories] = useState<{ label: string, value: string }[]>([]);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [transportErrors, setTransportErrors] = useState<ValidationError[]>([{}]);
    const [transportLegs, setTransportLegs] = useState<TransportLeg[]>([{
        id: 1,
        originCountry: "",
        destinationCountry: "",
        originGateway: "",
        destinationGateway: "",
        transportMode: "SeaFreight", // Set default to SeaFreight
        transportDistance: 0,
        transportEmission: 0,
        originGateways: [],
        destinationGateways: []
    }]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);

    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // Fetch product data on component mount
    useEffect(() => {
        const fetchProductData = async () => {
            setIsLoading(true);
            try {
                const data = await getAllProducts(uxpContext);
                const sortedProducts = sortProducts(data.data.products, "date_newest");
                setProducts(data.data.products);
                setFilteredProducts(sortedProducts);
                setPlan(data.data.plan.plan);

                // Extract unique categories for filter dropdown
                const uniqueCategories = [...new Set(data.data.products.map((product: any) => product.category))];
                setCategories(uniqueCategories.map((category: any) => ({
                    label: category,
                    value: category
                })));

                // Extract unique subCategories for filter dropdown
                const uniqueSubCategories = [...new Set(data.data.products.map((product: any) => product.subCategory))];
                setSubCategories(uniqueSubCategories.filter(Boolean).map((subCategory: any) => ({
                    label: subCategory,
                    value: subCategory
                })));
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProductData();
    }, []);

    // Fetch countries data for transport selection
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await transportDB(uxpContext);
                if (!response.data) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.data;
                if (data.plan.plan === 'basic') {
                    const formattedOptions = data.transportDatabase.map((country: string) => ({
                        label: country,
                        value: country
                    }));
                    setCountries(formattedOptions);
                } else {
                    setTransportDatabase(data.transportDatabase);
                    const formattedOptions = Object.keys(data.transportDatabase).map((country: string) => ({
                        label: country,
                        value: country
                    }));
                    setCountries(formattedOptions);
                }
            } catch (error) {
                console.error('There was a problem with the fetch operation:', error);
            }
        };
        fetchCountries();
    }, []);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchValue, selectedCategory, selectedSubCategory, sortOption]);

    // Update total transport weight whenever dependencies change
    useEffect(() => {
        if (includePallet) {
            setTotalTransportWeight(parseFloat((selectedProduct?.weight || 0)) + packagingWeight + palletWeight);
        } else {
            setTotalTransportWeight(parseFloat((selectedProduct?.weight || 0)) + packagingWeight);
        }
    }, [packagingWeight, palletWeight, includePallet, selectedProduct?.weight]);

    // Set default packaging weight as 10% of product weight
    useEffect(() => {
        setPackagingWeight((((selectedProduct?.weight || 0)) / 100) * 10);
    }, [selectedProduct]);

    // Filter products based on search, category, and subCategory
    const applyFilters = useCallback(() => {
        if (!products.length) return;

        let filtered = [...products];

        // Apply text search
        if (searchValue) {
            const searchLower = searchValue.toLowerCase();
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(searchLower) ||
                item.code.toLowerCase().includes(searchLower) ||
                item.category.toLowerCase().includes(searchLower)
            );
        }

        // Apply category filter
        if (selectedCategory) {
            filtered = filtered.filter(item =>
                item.category === selectedCategory
            );
        }

        // Apply subCategory filter
        if (selectedSubCategory) {
            filtered = filtered.filter(item =>
                item.subCategory === selectedSubCategory
            );
        }

        // Apply sorting
        if (sortOption) {
            filtered = sortProducts(filtered, sortOption);
        }

        setFilteredProducts(filtered);
    }, [products, searchValue, selectedCategory, selectedSubCategory, sortOption]);

    // Apply filters whenever filter criteria changes
    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    const handleSearchChange = (newValue: string) => {
        setSearchValue(newValue);
        // Directly filter products when search changes for immediate feedback
        const filtered = products.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(newValue.toLowerCase()) ||
                item.code.toLowerCase().includes(newValue.toLowerCase()) ||
                item.category.toLowerCase().includes(newValue.toLowerCase());
            const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
            const matchesSubCategory = selectedSubCategory ? item.subCategory === selectedSubCategory : true;

            return matchesSearch && matchesCategory && matchesSubCategory;
        });

        setFilteredProducts(sortProducts(filtered, sortOption));
    };

    const handleClearFilters = () => {
        setSelectedCategory(null);
        setSelectedSubCategory(null);
        setSearchValue("");
    };

    const sortProducts = (products: any[], option: string) => {
        const sortedProducts = [...products];

        switch (option) {
            case "name_asc":
                return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            case "name_desc":
                return sortedProducts.sort((a, b) => b.name.localeCompare(a.name));

            case "date_newest":
                return sortedProducts.sort((a, b) => {
                    const dateA = a.modifiedDate ? new Date(a.modifiedDate).getTime() : 0;
                    const dateB = b.modifiedDate ? new Date(b.modifiedDate).getTime() : 0;
                    return dateB - dateA; // newest first
                });
            case "date_oldest":
                return sortedProducts.sort((a, b) => {
                    const dateA = a.modifiedDate ? new Date(a.modifiedDate).getTime() : 0;
                    const dateB = b.modifiedDate ? new Date(b.modifiedDate).getTime() : 0;
                    return dateA - dateB; // oldest first
                });
            default:
                // Default to newest first
                return sortedProducts.sort((a, b) => {
                    const dateA = a.modifiedDate ? new Date(a.modifiedDate).getTime() : 0;
                    const dateB = b.modifiedDate ? new Date(b.modifiedDate).getTime() : 0;
                    return dateB - dateA; // newest first
                });
        }
    };

    const selectProduct = (product: any) => {
        setSelectedProduct(product);
        setShowModal(true);
        setActiveStep(0);
    };

    const handleConfirmCalculate = async () => {
        setIsEmissionSummaryVisible(true);
        setShowModal(false);
    };
    
    // Updated validation function - removed transportMode validation
    const validateTransportLegs = (): boolean => {
        const newErrors: ValidationError[] = transportLegs.map(leg => {
            const legErrors: ValidationError = {};

            // Check required fields for all plans
            if (!leg.originCountry) legErrors.originCountry = true;
            if (!leg.destinationCountry) legErrors.destinationCountry = true;
            // Removed transportMode validation since it's hardcoded

            // Check additional fields for professional plan
            if (plan === 'professional') {
                if (!leg.originGateway) legErrors.originGateway = true;
                if (!leg.destinationGateway) legErrors.destinationGateway = true;
            }

            return legErrors;
        });

        setTransportErrors(newErrors);

        // Return true if there are no errors (all fields are valid)
        return newErrors.every(error => Object.keys(error).length === 0);
    };
    
    const calculateTransportationEmission = async () => {
        try {
            const updatedLegs = [...transportLegs];
            let totalEmission = 0;

            // Call API for each transport leg
            for (let i = 0; i < updatedLegs.length; i++) {
                const leg = updatedLegs[i];
                const payload = {
                    weightKg: totalTransportWeight,
                    transportMode: "SeaFreight", // Hardcoded to SeaFreight
                    transportKm: leg.transportDistance
                };

                const response = await calculateTransportEmission(uxpContext, payload);
                if (response.data) {
                    updatedLegs[i] = {
                        ...leg,
                        transportEmission: response.data.transportEmissions
                    };
                    totalEmission += response.data.emission;
                } else if (response.error) {
                    console.error(`Error calculating emission for leg ${i + 1}:`, response.error);
                }
            }

            setTransportLegs(updatedLegs);
            setTransportationEmission(totalEmission.toString());
        } catch (error) {
            console.error("Error calculating transport emission:", error);
        }
    };

    // Update handleNext function to validate before proceeding
    const handleNext = () => {
        // If we're on the transport selection step (step 1)
        if (activeStep === 1) {
            const isValid = validateTransportLegs();
            if (!isValid) {
                // If validation fails, don't proceed
                return;
            }
        }
        
        if (activeStep < steps.length - 1) {
            setActiveStep(activeStep + 1);
        }
        if (activeStep === 2) {
            calculateTransportationEmission();
        }
    };
    
    const handlePrevious = () => {
        if (activeStep > 0) {
            setActiveStep(activeStep - 1);
        }
    };

    const steps = [
        {
            id: "step-1",
            title: "PRODUCT SELECTION",
            content: (
                <ProductSelectionStep selectedProduct={selectedProduct} />
            ),
        },
        {
            id: "step-2",
            title: "TRANSPORT SELECTION",
            content: (
                <TransportSelectionStep
                    transportLegs={transportLegs}
                    setTransportLegs={setTransportLegs}
                    countries={countries}
                    transportDatabase={transportDatabase}
                    plan={plan}
                    uxpContext={uxpContext}
                    errors={transportErrors}
                />
            ),
        },
        {
            id: "step-3",
            title: "TRANSPORT WEIGHT DETAILS",
            content: (
                <WeightDetailsStep
                    selectedProduct={selectedProduct}
                    packagingWeight={packagingWeight}
                    setPackagingWeight={setPackagingWeight}
                    isPackagingManual={isPackagingManual}
                    setIsPackagingManual={setIsPackagingManual}
                    includePallet={includePallet}
                    setIncludePallet={setIncludePallet}
                    palletWeight={palletWeight}
                    setPalletWeight={setPalletWeight}
                    isPalletManual={isPalletManual}
                    setIsPalletManual={setIsPalletManual}
                    totalTransportWeight={totalTransportWeight}
                />
            ),
        },
        {
            id: "step-4",
            title: "SUMMARY",
            content: (
                <SummaryStep
                    selectedProduct={selectedProduct}
                    transportLegs={transportLegs}
                    packagingWeight={packagingWeight}
                    palletWeight={palletWeight}
                    includePallet={includePallet}
                    plan={plan}
                    onConfirm={handleConfirmCalculate}
                    onCloseAll={() => {
                      setShowModal(false);
                      setIsEmissionSummaryVisible(false);
                    }}
                    uxpContext={uxpContext}
                    onPrevious={handlePrevious}
                />
            ),
        },
    ];

    if (isEmissionSummaryVisible) {
        return (
            <EmissionSummary
                packageWeight={packagingWeight}
                palletWeight={palletWeight}
                transportLegs={transportLegs}
                transportationEmission={transportationEmission}
                product={selectedProduct}
                onBack={() => {
                    setIsEmissionSummaryVisible(false);
                    // Reset all data when going back
                    setActiveStep(0);
                    setTransportLegs([{
                        id: 1,
                        originCountry: "",
                        destinationCountry: "",
                        originGateway: "",
                        destinationGateway: "",
                        transportMode: "SeaFreight", // Set default to SeaFreight
                        transportDistance: 0,
                        transportEmission: 0,
                        originGateways: [],
                        destinationGateways: []
                    }]);
                    setIsPackagingManual(false);
                    setIsPalletManual(false);
                    setIncludePallet(false);
                    setPalletWeight(20);
                    setTransportationEmission("");
                }}
                uxpContext={uxpContext}
                plan={plan}
            />
        );
    }

    return (
        <div className="lca-content">
            <h1 className="dashboard-title">Transportation</h1>

            <div className="esgnow-search-filter-container">
                <div className="esgnow-search-section">
                    <div className="esgnow-search-filter-panel-wrapper">
                        <div className="search-field">
                            <FontAwesomeIcon icon={faSearch} className="search-icon" />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search Products"
                                value={searchValue}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                        </div>
                        <div className="esgnow-filter-section">
                            <FilterPanel
                                enableClear={!!(selectedCategory || selectedSubCategory)}
                                onClear={handleClearFilters}
                                onOpen={() => setShowFilterPanel(true)}
                                onClose={() => setShowFilterPanel(false)}
                                className="esgnow-filter-panel"
                            >
                                <div className="esgnow-filter-grid">
                                    <FormField className="esgnow-filter-field">
                                        <Label>Product Category</Label>
                                        <Select
                                            selected={selectedCategory}
                                            options={categories}
                                            onChange={(value: string) => {
                                                setSelectedCategory(value);
                                                // Apply filter immediately when category changes
                                                const filtered = products.filter(item => {
                                                    const matchesSearch = searchValue ?
                                                        (item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                                                            item.code.toLowerCase().includes(searchValue.toLowerCase()) ||
                                                            item.category.toLowerCase().includes(searchValue.toLowerCase())) : true;
                                                    const matchesCategory = value ? item.category === value : true;
                                                    const matchesSubCategory = selectedSubCategory ? item.subCategory === selectedSubCategory : true;

                                                    return matchesSearch && matchesCategory && matchesSubCategory;
                                                });
                                                setFilteredProducts(sortProducts(filtered, sortOption));
                                            }}
                                            placeholder="-- Select a category --"
                                        />
                                    </FormField>
                                    <FormField className="esgnow-filter-field">
                                        <Label>Sub Category</Label>
                                        <Select
                                            selected={selectedSubCategory}
                                            options={subCategories}
                                            onChange={(value: string) => {
                                                setSelectedSubCategory(value);
                                                // Apply filter immediately when subCategory changes
                                                const filtered = products.filter(item => {
                                                    const matchesSearch = searchValue ?
                                                        (item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                                                            item.code.toLowerCase().includes(searchValue.toLowerCase()) ||
                                                            item.category.toLowerCase().includes(searchValue.toLowerCase())) : true;
                                                    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
                                                    const matchesSubCategory = value ? item.subCategory === value : true;

                                                    return matchesSearch && matchesCategory && matchesSubCategory;
                                                });
                                                setFilteredProducts(sortProducts(filtered, sortOption));
                                            }}
                                            placeholder="-- Select a sub category --"
                                        />
                                    </FormField>
                                </div>
                            </FilterPanel>
                        </div>
                    </div>

                    <div className="esgnow-view-options">
                        <div className="esgnow-sort-dropdown">
                            <Label>Sort by</Label>
                            <Select
                                selected={sortOption}
                                options={[
                                    { label: "Newest First", value: "date_newest" },
                                    { label: "Oldest First", value: "date_oldest" },
                                    { label: "Name (A-Z)", value: "name_asc" },
                                    { label: "Name (Z-A)", value: "name_desc" }
                                ]}
                                onChange={(value: string) => {
                                    setSortOption(value);
                                    setFilteredProducts(sortProducts([...filteredProducts], value));
                                }}
                            />
                        </div>

                        <div className="esgnow-view-mode-toggle">
                            <button
                                className={`esgnow-view-mode-button ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="Grid View"
                            >
                                <span className="esgnow-grid-icon">▦</span>
                            </button>
                            <button
                                className={`esgnow-view-mode-button ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                title="List View"
                            >
                                <span className="esgnow-list-icon">≡</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results summary */}
            <div className="esgnow-results-summary">
                <span>Showing {currentItems.length} of {filteredProducts.length} products (page {currentPage} of {totalPages})</span>
                {(searchValue || selectedCategory || selectedSubCategory) && (
                    <Button
                        title="Clear All Filters"
                        className="button-secondary esgnow-clear-all-btn"
                        onClick={handleClearFilters}
                    />
                )}
            </div>

            {isLoading ? (
                <div className="esgnow-loading-container">
                    <div className="esgnow-loading-spinner"></div>
                    <p>Loading products...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="esgnow-no-results">
                    <p>No products match your search criteria.</p>
                    <Button title="Clear Filters" className="button-secondary" onClick={handleClearFilters} />
                </div>
            ) : (
                <>
                    {/* Render either grid or list view based on viewMode */}
                    {viewMode === "grid" ? (
                        <ProductGridView
                            currentItems={currentItems}
                            selectProduct={selectProduct}
                        />
                    ) : (
                        <ProductListView
                            currentItems={currentItems}
                            selectProduct={selectProduct}
                        />
                    )}

                    {/* Pagination component */}
                    {totalPages > 1 && (
                        <div className="esgnow-pagination-wrapper">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                itemsPerPage={itemsPerPage}
                                setCurrentPage={setCurrentPage}
                                setItemsPerPage={setItemsPerPage}
                            />
                        </div>
                    )}
                </>
            )}

            <Modal
                show={showModal}
                onClose={() => {
                    // Reset all data before closing the modal
                    setShowModal(false);
                    setActiveStep(0);
                    setTransportLegs([{
                        id: 1,
                        originCountry: "",
                        destinationCountry: "",
                        originGateway: "",
                        destinationGateway: "",
                        transportMode: "SeaFreight", // Set default to SeaFreight
                        transportDistance: 0,
                        transportEmission: 0,
                        originGateways: [],
                        destinationGateways: []
                    }]);
                    setTransportErrors([]);
                    setIsPackagingManual(false);
                    setIsPalletManual(false);
                    setIncludePallet(false);
                    setPalletWeight(20);
                    setTransportationEmission("");
                }}
                title="Calculate Impact"
                className="lgs-calculate-impact-modal"
            >
                <div className="modal-content">
                    <div className="modal-stepper-container">
                        <Stepper activeStep={activeStep} onStepChange={() => { }} />
                    </div>

                    {steps[activeStep]?.content}

                    <div className="esgnow-modal-footer">
                        {activeStep > 0 && activeStep < steps.length - 1 && (
                            <Button
                                className="button-secondary"
                                title="Previous"
                                onClick={handlePrevious}
                            />
                        )}
                        {activeStep < steps.length - 1 && (
                            <Button
                                className="button-primary-next-button"
                                title="Next"
                                onClick={handleNext}
                            />
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default LCADashboardWidget;