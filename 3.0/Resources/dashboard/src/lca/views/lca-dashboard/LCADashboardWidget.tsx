import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Button, SearchBox, FilterPanel, FormField, Label, Select, DataGrid, Modal, IconButton } from "uxp/components";
import { IContextProvider } from "@uxp";
import { getAllProducts, transportDB } from "../../../esgnow-service";
import ProductSelectionStep from "./ProductSelectionStep";
import TransportSelectionStep from "./TransportSelectionStep";
import EmissionSummary from '../emission-summary';
import Stepper from '../stepper-LCA';
import './lca-dashboard-widget.scss';
import WeightDetailsStep from "./WeightDetailsStep";
import SummaryStep from "./SummaryStep";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThLarge, faList, faSort, faSearch } from "@fortawesome/free-solid-svg-icons";

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
    const [maxCO2, setMaxCO2] = useState<number | null>(null);
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
    const [sortOption, setSortOption] = useState<string>("name_asc");
    const [categories, setCategories] = useState<{label: string, value: string}[]>([]);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [transportLegs, setTransportLegs] = useState<TransportLeg[]>([{
        id: 1,
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

    // Pagination state from product-dashboard
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
                setProducts(data.data.products);
                setFilteredProducts(data.data.products);
                setPlan(data.data.plan.plan);
                
                // Extract unique categories for filter dropdown
                const uniqueCategories = [...new Set(data.data.products.map((product: any) => product.subTitle))];
                setCategories(uniqueCategories.map((category : any) => ({
                    label: category,
                    value: category
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
    }, [searchValue, selectedCategory, maxCO2, sortOption]);

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

    // Filter products based on search, category, and CO2 max
    const applyFilters = useCallback(() => {
        if (!products.length) return;
        
        let filtered = [...products];
        
        // Apply text search
        if (searchValue) {
            const searchLower = searchValue.toLowerCase();
            filtered = filtered.filter(item => 
                item.name.toLowerCase().includes(searchLower) ||
                item.code.toLowerCase().includes(searchLower) ||
                item.subTitle.toLowerCase().includes(searchLower)
            );
        }
        
        // Apply category filter
        if (selectedCategory) {
            filtered = filtered.filter(item => 
                item.subTitle === selectedCategory
            );
        }
        
        // Apply CO2 max filter
        if (maxCO2 !== null) {
            filtered = filtered.filter(item => 
                (item.emission || 0) <= maxCO2
            );
        }
        
        // Apply sorting
        if (sortOption) {
            filtered = sortProducts(filtered, sortOption);
        }
        
        setFilteredProducts(filtered);
    }, [products, searchValue, selectedCategory, maxCO2, sortOption]);

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
                                 item.subTitle.toLowerCase().includes(newValue.toLowerCase());
            const matchesCategory = selectedCategory ? item.subTitle === selectedCategory : true;
            const matchesCO2 = maxCO2 !== null ? (item.emission || 0) <= maxCO2 : true;
            
            return matchesSearch && matchesCategory && matchesCO2;
        });
        
        setFilteredProducts(sortProducts(filtered, sortOption));
    };

    const handleClearFilters = () => {
        setSelectedCategory(null);
        setMaxCO2(null);
        setSearchValue("");
    };

    const sortProducts = (products: any[], option: string) => {
        const sortedProducts = [...products];
        
        switch(option) {
            case "name_asc":
                return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            case "name_desc":
                return sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
            case "emission_asc":
                return sortedProducts.sort((a, b) => (a.emission || 0) - (b.emission || 0));
            case "emission_desc":
                return sortedProducts.sort((a, b) => (b.emission || 0) - (a.emission || 0));
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

    const calculateTransportationEmission = async () => {
        // Mock implementation (original had actual API call)
        const updatedLegs = transportLegs.map(leg => ({
            ...leg,
            transportEmission: leg.transportDistance * 0.1 // Simplified calculation
        }));
        setTransportLegs(updatedLegs);
        
        const totalEmission = updatedLegs.reduce((sum, leg) => sum + leg.transportEmission, 0);
        setTransportationEmission(totalEmission.toString());
    };

    const handleNext = () => {
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

    // Pagination controls component inspired by product-dashboard
    const Pagination = () => (
        <div className="pagination-container">
            <div className="pagination-controls">
                <select 
                    className="items-per-page" 
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                >
                    <option value={6}>6 per page</option>
                    <option value={12}>12 per page</option>
                    <option value={24}>24 per page</option>
                </select>
                
                <div className="pagination-buttons">
                    <Button
                        title="Previous"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="pagination-button"
                    >
                        <span className="pagination-arrow">←</span>
                    </Button>
                    
                    <span className="pagination-info">
                        Page {currentPage} of {totalPages || 1}
                    </span>
                    
                    <Button
                        title="Next"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="pagination-button"
                    >
                        <span className="pagination-arrow">→</span>
                    </Button>
                </div>
            </div>
        </div>
    );

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
                onBack={() => setIsEmissionSummaryVisible(false)} 
                uxContext={uxpContext} 
                plan={plan} 
            />
        );
    }

    return (
        <div className="lca-content">
            <h1 className="dashboard-title">Transportation</h1>
            
            <div className="search-filter-section">
                <div className="uxp-search-box-container">
                    <div className="search-field">
                        <FontAwesomeIcon icon={faSearch} className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search Products"
                            value={searchValue}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                        {searchValue && (
                            <Button 
                                title="Clear" 
                                className="clear-search-btn" 
                                onClick={() => handleSearchChange("")}
                            />
                        )}
                    </div>
                    
                    <FilterPanel
                        enableClear={!!(selectedCategory || maxCO2)}
                        onClear={handleClearFilters}
                        onOpen={() => setShowFilterPanel(true)}
                        onClose={() => setShowFilterPanel(false)}
                        className="filter-panel"
                    >
                        <FormField className="no-padding mb-only">
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
                                            item.subTitle.toLowerCase().includes(searchValue.toLowerCase())) : true;
                                        const matchesCategory = value ? item.subTitle === value : true;
                                        const matchesCO2 = maxCO2 !== null ? (item.emission || 0) <= maxCO2 : true;
                                        
                                        return matchesSearch && matchesCategory && matchesCO2;
                                    });
                                    setFilteredProducts(sortProducts(filtered, sortOption));
                                }}
                                placeholder="-- Select a category --"
                            />
                        </FormField>
                        <FormField className="no-padding mb-only">
                            <Label>Max CO2 Emission (Kg CO2e)</Label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={maxCO2 || ""}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                    const value = parseFloat(event.target.value);
                                    const newMaxCO2 = isNaN(value) ? null : value;
                                    setMaxCO2(newMaxCO2);
                                    
                                    // Apply filter immediately when CO2 limit changes
                                    const filtered = products.filter(item => {
                                        const matchesSearch = searchValue ? 
                                            (item.name.toLowerCase().includes(searchValue.toLowerCase()) || 
                                            item.code.toLowerCase().includes(searchValue.toLowerCase()) ||
                                            item.subTitle.toLowerCase().includes(searchValue.toLowerCase())) : true;
                                        const matchesCategory = selectedCategory ? item.subTitle === selectedCategory : true;
                                        const matchesCO2 = newMaxCO2 !== null ? (item.emission || 0) <= newMaxCO2 : true;
                                        
                                        return matchesSearch && matchesCategory && matchesCO2;
                                    });
                                    setFilteredProducts(sortProducts(filtered, sortOption));
                                }}
                                placeholder="Set maximum CO2"
                                className="filter-input"
                            />
                        </FormField>
                    </FilterPanel>
                    
                    <div className="sort-control">
                        <FontAwesomeIcon icon={faSort} className="sort-icon" />
                        <Select
                            selected={sortOption}
                            options={[
                                { label: "Date (Newest First)", value: "date_newest" },
                                { label: "Date (Oldest First)", value: "date_oldest" },
                                { label: "Name (A-Z)", value: "name_asc" },
                                { label: "Name (Z-A)", value: "name_desc" },
                                { label: "Emission (Low-High)", value: "emission_asc" },
                                { label: "Emission (High-Low)", value: "emission_desc" }
                            ]}
                            onChange={(value: string) => {
                                setSortOption(value);
                                setFilteredProducts(sortProducts([...filteredProducts], value));
                            }}
                            placeholder="Sort by"
                            className="sort-select"
                        />
                    </div>
                    
                    <div className="view-mode-toggle">
                        <button 
                            className={`view-mode-button ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title="Grid View"
                        >
                            <span className="grid-icon">▦</span>
                        </button>
                        <button 
                            className={`view-mode-button ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title="List View"
                        >
                            <span className="list-icon">≡</span>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Results summary */}
            <div className="results-summary">
                <span>Showing {currentItems.length} of {filteredProducts.length} products (page {currentPage} of {totalPages})</span>
                {(searchValue || selectedCategory || maxCO2) && (
                    <Button 
                        title="Clear All Filters" 
                        className="button-secondary clear-all-btn" 
                        onClick={handleClearFilters} 
                    />
                )}
            </div>

            {isLoading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading products...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="no-results">
                    <p>No products match your search criteria.</p>
                    <Button title="Clear Filters" className="button-secondary" onClick={handleClearFilters} />
                </div>
            ) : viewMode === "grid" ? (
                <>
                    {/* Enhanced Product Grid with cards from product-dashboard */}
                    <div className="product-grid">
                        {currentItems.map((item, index) => (
                            <div 
                                key={item.code || index}
                                className="product-card" 
                            >
                                <div className="product-card-header">
                                    <div className="product-code">{item.code}</div>
                                    {item.emission && (
                                        <div className="co2-emission">
                                            <span className="co2-value">{(item.emission || 0).toFixed(2)}</span>
                                            <span className="co2-unit">Kg CO₂e</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div 
                                    className="product-image-container"
                                    style={{
                                        backgroundImage: item.images && item.images.length > 0 ? 
                                            `url(${item.images[0]})` : 'none'
                                    }}
                                >
                                    {(!item.images || item.images.length === 0) && (
                                        <div className="no-image">
                                            <span>No Image Available</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="product-card-content">
                                    <h3 className="product-name">{item.name}</h3>
                                    <div className="product-meta">
                                        <span className="product-category">{item.subTitle || "Uncategorized"}</span>
                                    </div>
                                    
                                    <div className="product-details-preview">
                                        <div className="product-weight">
                                            <span className="detail-label">Weight:</span>
                                            <span className="detail-value">{item.weight} Kg</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="product-card-footer">
                                    <button 
                                        type="button"
                                        className="calculate-impact-button" 
                                        onClick={() => selectProduct(item)}
                                    >
                                        Calculate Impact
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Add pagination controls if there are multiple pages */}
                    {totalPages > 1 && (
                        <div className="pagination-wrapper">
                            <Pagination />
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* Enhanced List View similar to product-dashboard */}
                    <div className="product-list">
                        <div className="list-header">
                            <div className="list-col-name">Product Name</div>
                            <div className="list-col-category">Category</div>
                            <div className="list-col-weight">Weight</div>
                            <div className="list-col-co2">CO₂ Emission</div>
                            <div className="list-col-actions">Actions</div>
                        </div>
                        
                        {currentItems.map((item, index) => (
                            <div className="list-item" key={item.code || index}>
                                <div className="list-col-name">
                                    <div className="item-with-image">
                                        <div 
                                            className="list-item-thumbnail"
                                            style={{
                                                backgroundImage: item.images && item.images.length > 0 ? 
                                                    `url(${item.images[0]})` : 'none'
                                            }}
                                        >
                                            {(!item.images || item.images.length === 0) && "No Image"}
                                        </div>
                                        <div className="product-name-code">
                                            <span className="product-name">{item.name}</span>
                                            <span className="product-code">{item.code}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="list-col-category">
                                    <div>{item.subTitle || "Uncategorized"}</div>
                                </div>
                                <div className="list-col-weight">{item.weight} Kg</div>
                                <div className="list-col-co2">
                                    <div className="co2-badge">
                                        {(item.emission || 0).toFixed(2)} Kg CO₂e
                                    </div>
                                </div>
                                <div className="list-col-actions">
                                    <button 
                                        type="button"
                                        className="view-details-button" 
                                        onClick={() => selectProduct(item)}
                                    >
                                        Calculate
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Add pagination controls if there are multiple pages */}
                    {totalPages > 1 && (
                        <div className="pagination-wrapper">
                            <Pagination />
                        </div>
                    )}
                </>
            )}

            <Modal
                show={showModal}
                onClose={() => setShowModal(false)}
                title="Calculate Impact"
                className="lgs-calculate-impact-modal"
            >
                <div className="modal-content">
                    <div className="modal-stepper-container">
                        <Stepper activeStep={activeStep} onStepChange={setActiveStep} />
                    </div>

                    {steps[activeStep]?.content}

                    <div className="modal-footer">
                        {activeStep > 0 && (
                            <Button
                                className="button-secondary"
                                title="Previous"
                                onClick={handlePrevious}
                            />
                        )}
                        {activeStep < steps.length - 1 && (
                            <Button
                                className="button-primary"
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