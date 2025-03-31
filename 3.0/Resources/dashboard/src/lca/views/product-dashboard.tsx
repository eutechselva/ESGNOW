import * as React from "react";
import { Button, SearchBox, DataGrid, FilterPanel, FormField, Label, Select, useAlert, Tab } from "uxp/components";
import './product-dashboard.scss';
import ProductInfoSummary from './product-info-summary';
import { IContextProvider } from "@uxp";
import { ProductWizard } from "./product-wizard";
import { getAllProducts } from "../../esgnow-service";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faSearch } from "@fortawesome/free-solid-svg-icons";

interface IWidgetProps {
    uxpContext: IContextProvider
    plan: string;
}

const ProductDashboardWidget: React.FC<IWidgetProps> = ({ uxpContext }) => {
    const [products, setProducts] = React.useState([]);
    const [selectedProduct, setSelectedProduct] = React.useState<any | null>(null);
    const [showFilterPanel, setShowFilterPanel] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");
    const [filteredData, setFilteredData] = React.useState([]);
    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
    const [selectedSubCategory, setSelectedSubCategory] = React.useState<string | null>(null);
    const [maxCO2, setMaxCO2] = React.useState<number | null>(null);
    const [minCO2, setMinCO2] = React.useState<number | null>(null);
    const [sortBy, setSortBy] = React.useState<string>("newest");
    const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
    const [showModal, setShowModal] = React.useState(false);
    const [plan, setPlan] = React.useState<string>(null);
    const [showCloseWarning, setShowCloseWarning] = React.useState(true);
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedCountry, setSelectedCountry] = React.useState<string | null>(null);

    const alerts = useAlert();

    // Pagination state
    const [currentPage, setCurrentPage] = React.useState(1);
    const [itemsPerPage, setItemsPerPage] = React.useState(6);

    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // Get unique categories and subcategories
    const categories = React.useMemo(() => {
        return [...new Set(products.map((item: any) => item.category))].sort();
    }, [products]);

    const subCategories = React.useMemo(() => {
        return [...new Set(products.map((item: any) => item.subCategory))].filter(Boolean).sort();
    }, [products]);

    const countries = React.useMemo(() => {
        return [...new Set(products.map((item: any) => {
            if (item.countryOfOrigin === "CN") return "China";
            if (item.countryOfOrigin === "VN") return "Vietnam";
            return item.countryOfOrigin;
        }))].filter(Boolean).sort();
    }, [products]);

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
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="pagination-button"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} className="pagination-arrow" />
                    </button>

                    <span className="pagination-info">
                        Page {currentPage} of {totalPages || 1}
                    </span>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="pagination-button"
                    >
                        <FontAwesomeIcon icon={faChevronRight} className="pagination-arrow" />
                    </button>
                </div>
            </div>
        </div>
    );

    // Reset to first page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchValue, selectedCategory, selectedSubCategory, maxCO2, minCO2, selectedCountry, sortBy]);

    // Initialize filteredData with products when products change
    React.useEffect(() => {
        setFilteredData(sortProducts(products, sortBy));
        setIsLoading(false);
    }, [products]);

    // Fetch products
    React.useEffect(() => {
        const fetchProductData = async () => {
            setIsLoading(true);
            try {
                const response = await getAllProducts(uxpContext);
                let data = response.data;
                setProducts(data.products);
                setPlan(data.plan.plan);
            } catch (error) {
                console.error('There was a problem with the fetch operation:', error);
                alerts.show({
                    title: "Error",
                    content: "Failed to load products. Please try again later."
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchProductData();
    }, []);

    const sortProducts = (products: any[], option: string) => {
        const sortedProducts = [...products];

        switch (option) {
            case "nameAZ":
                return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            case "nameZA":
                return sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
            case "co2High":
                return sortedProducts.sort((a, b) => parseFloat(b.co2Emission) - parseFloat(a.co2Emission));
            case "co2Low":
                return sortedProducts.sort((a, b) => parseFloat(a.co2Emission) - parseFloat(b.co2Emission));
            case "newest":
                return sortedProducts.sort((a, b) => {
                    const dateA = a.modifiedDate ? new Date(a.modifiedDate).getTime() : 0;
                    const dateB = b.modifiedDate ? new Date(b.modifiedDate).getTime() : 0;
                    return dateB - dateA; // newest first
                });
            case "oldest":
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

    const handleSearchChange = (newValue: string) => {
        setSearchValue(newValue);
        // Directly filter products when search changes for immediate feedback
        const filtered = products.filter(item => {
            const matchesSearch = newValue ?
                (item.name.toLowerCase().includes(newValue.toLowerCase()) ||
                    item.code.toLowerCase().includes(newValue.toLowerCase()) ||
                    item.category.toLowerCase().includes(newValue.toLowerCase())) : true;
            const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
            const matchesSubCategory = selectedSubCategory ? item.subCategory === selectedSubCategory : true;
            const matchesCountry = selectedCountry ?
                (item.countryOfOrigin === "CN" ? "China" :
                    item.countryOfOrigin === "VN" ? "Vietnam" :
                        item.countryOfOrigin) === selectedCountry : true;
            const matchesMaxCO2 = maxCO2 ? parseFloat(item.co2Emission) <= maxCO2 : true;
            const matchesMinCO2 = minCO2 ? parseFloat(item.co2Emission) >= minCO2 : true;

            return matchesSearch && matchesCategory && matchesSubCategory && matchesCountry && matchesMaxCO2 && matchesMinCO2;
        });

        setFilteredData(sortProducts(filtered, sortBy));
    };

    const applyFilters = (
        searchText: string,
        category: string | null,
        subCategory: string | null,
        co2Max: number | null,
        co2Min: number | null,
        country: string | null,
        sort: string
    ) => {
        let filtered = products.filter(item => {
            const matchesSearch = searchText ?
                (item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.code.toLowerCase().includes(searchText.toLowerCase()) ||
                    item.category.toLowerCase().includes(searchText.toLowerCase())) : true;
            const matchesCategory = category ? item.category === category : true;
            const matchesSubCategory = subCategory ? item.subCategory === subCategory : true;
            const matchesCountry = country ?
                (item.countryOfOrigin === "CN" ? "China" :
                    item.countryOfOrigin === "VN" ? "Vietnam" :
                        item.countryOfOrigin) === country : true;
            const matchesMaxCO2 = co2Max ? parseFloat(item.co2Emission) <= co2Max : true;
            const matchesMinCO2 = co2Min ? parseFloat(item.co2Emission) >= co2Min : true;

            return matchesSearch && matchesCategory && matchesSubCategory && matchesCountry && matchesMaxCO2 && matchesMinCO2;
        });

        setFilteredData(sortProducts(filtered, sort));
    };

    const handleClearFilters = () => {
        setSelectedCategory(null);
        setSelectedSubCategory(null);
        setSelectedCountry(null);
        setMaxCO2(null);
        setMinCO2(null);
        setSortBy("newest");
        setSearchValue("");
        setFilteredData(sortProducts([...products], "newest"));
    };

    const refreshProducts = async () => {
        setIsLoading(true);
        try {
            const response = await getAllProducts(uxpContext);
            setProducts(response.data.products);
        } catch (error) {
            console.error('Error refreshing products:', error);
            alerts.show({
                title: "Error",
                content: "Failed to refresh products. Please try again later."
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="product-dashboard-container">
            {selectedProduct ? null : (
                <>
                    <div className="dashboard-header">
                        <div className="header-left">
                            <h1 className="dashboard-title">Products</h1>
                        </div>

                        <div className="header-right">
                            <Button
                                className="refresh-button"
                                onClick={refreshProducts}
                                disabled={isLoading}
                                title="Refresh"
                            >
                                <span className="refresh-icon">↻</span>
                                {isLoading ? "Loading..." : "Refresh"}
                            </Button>

                            <button
                                className="add-product-button"
                                onClick={() => setShowModal(true)}
                            >
                                + Add Product
                            </button>
                        </div>
                    </div>

                    <div className="search-filter-section">
                        <div className="uxp-search-box-container">
                            <div className="search-field">
                                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                                <div className="search-input-filter-container">
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
                                    enableClear={!!(selectedCategory || selectedSubCategory || selectedCountry || maxCO2 || minCO2)}
                                    onClear={handleClearFilters}
                                    onOpen={() => setShowFilterPanel(true)}
                                    onClose={() => setShowFilterPanel(false)}
                                    className="filter-panel"
                                >
                                    <FormField className="no-padding mb-only">
                                        <Label>Product Category</Label>
                                        <Select
                                            selected={selectedCategory}
                                            options={categories.map(cat => ({ label: cat, value: cat }))}
                                            onChange={(value: string) => {
                                                setSelectedCategory(value);
                                                applyFilters(searchValue, value, selectedSubCategory, maxCO2, minCO2, selectedCountry, sortBy);
                                            }}
                                            placeholder="-- Select a category --"
                                        />
                                    </FormField>

                                    <FormField className="no-padding mb-only">
                                        <Label>Sub Category</Label>
                                        <Select
                                            selected={selectedSubCategory}
                                            options={subCategories.map(subCat => ({ label: subCat, value: subCat }))}
                                            onChange={(value: string) => {
                                                setSelectedSubCategory(value);
                                                applyFilters(searchValue, selectedCategory, value, maxCO2, minCO2, selectedCountry, sortBy);
                                            }}
                                            placeholder="-- Select a sub category --"
                                        />
                                    </FormField>

                                    <FormField className="no-padding mb-only">
                                        <Label>Country of Manufacture</Label>
                                        <Select
                                            selected={selectedCountry}
                                            options={countries.map(country => ({ label: country, value: country }))}
                                            onChange={(value: string) => {
                                                setSelectedCountry(value);
                                                applyFilters(searchValue, selectedCategory, selectedSubCategory, maxCO2, minCO2, value, sortBy);
                                            }}
                                            placeholder="-- Select a country --"
                                        />
                                    </FormField>

                                    <FormField className="no-padding mb-only">
                                        <Label>Min CO₂ Emission (Kg CO₂e)</Label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={minCO2 || ""}
                                            onChange={(e) => {
                                                const value = e.target.value ? parseFloat(e.target.value) : null;
                                                setMinCO2(value);
                                                applyFilters(searchValue, selectedCategory, selectedSubCategory, maxCO2, value, selectedCountry, sortBy);
                                            }}
                                            placeholder="Minimum CO₂"
                                            className="number-input"
                                        />
                                    </FormField>

                                    <FormField className="no-padding mb-only">
                                        <Label>Max CO₂ Emission (Kg CO₂e)</Label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={maxCO2 || ""}
                                            onChange={(e) => {
                                                const value = e.target.value ? parseFloat(e.target.value) : null;
                                                setMaxCO2(value);
                                                applyFilters(searchValue, selectedCategory, selectedSubCategory, value, minCO2, selectedCountry, sortBy);
                                            }}
                                            placeholder="Maximum CO₂"
                                            className="number-input"
                                        />
                                    </FormField>
                                </FilterPanel>
                            </div>

                            <div className="sort-control">
                                <Label>Sort by</Label>
                                <Select
                                    selected={sortBy}
                                    options={[
                                        { label: "Date (Newest First)", value: "newest" },
                                        { label: "Date (Oldest First)", value: "oldest" },
                                        { label: "CO₂ (High to Low)", value: "co2High" },
                                        { label: "CO₂ (Low to High)", value: "co2Low" },
                                        { label: "Name (A-Z)", value: "nameAZ" },
                                        { label: "Name (Z-A)", value: "nameZA" }
                                    ]}
                                    onChange={(value: string) => {
                                        setSortBy(value);
                                        applyFilters(searchValue, selectedCategory, selectedSubCategory, maxCO2, minCO2, selectedCountry, value);
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

                    {/* Results Summary Section */}
                    <div className="results-summary">
                        <span>Showing {currentItems.length} of {filteredData.length} products (page {currentPage} of {totalPages})</span>
                        {(searchValue || selectedCategory || selectedSubCategory || maxCO2 || minCO2 || selectedCountry) && (
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
                    ) : filteredData.length === 0 ? (
                        <div className="no-results">
                            <div className="no-results-icon">🔍</div>
                            <h3>No products found</h3>
                            <p>Try adjusting your search criteria or filters</p>
                            <button
                                onClick={handleClearFilters}
                                className="clear-filters-button"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <>
                            <div className="product-grid">
                                {currentItems.map((item, index) => (
                                    <div
                                        className="product-card"
                                        key={item._id || index}
                                        onClick={() => setSelectedProduct(item)}
                                    >
                                        <div className="product-card-header">
                                            <div className="product-code">{item.code}</div>
                                            <div className="co2-emission">
                                                <span className="co2-value">{parseFloat(item.co2Emission).toFixed(2)}</span>
                                                <span className="co2-unit">Kg CO₂e</span>
                                            </div>
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
                                                    <span>No Image</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="product-card-content">
                                            <h3 className="product-name">{item.name}</h3>
                                            <div className="product-meta">
                                                <span className="product-category">{item.category}</span>
                                                {item.subCategory && (
                                                    <span className="product-subcategory">{item.subCategory}</span>
                                                )}
                                            </div>

                                            <div className="product-details-preview">
                                                <div className="product-weight">
                                                    <span className="detail-label">Weight:</span>
                                                    <span className="detail-value">{item.weight} Kg</span>
                                                </div>

                                                <div className="product-origin">
                                                    <span className="detail-label">Origin:</span>
                                                    <span className="detail-value">
                                                        {item.countryOfOrigin === "CN" ? "China" :
                                                            item.countryOfOrigin === "VN" ? "Vietnam" :
                                                                item.countryOfOrigin}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="product-card-footer">
                                            <div className="product-date">
                                                Modified: {new Date(item.modifiedDate).toLocaleDateString()}
                                            </div>
                                            <button className="view-details-button">
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="pagination-wrapper">
                                    <Pagination />
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="product-list">
                                <div className="list-header">
                                    <div className="list-col-name">Product Name</div>
                                    <div className="list-col-category">Category</div>
                                    <div className="list-col-weight">Weight</div>
                                    <div className="list-col-origin">Origin</div>
                                    <div className="list-col-co2">CO₂ Emission</div>
                                    <div className="list-col-date">Modified Date</div>
                                    <div className="list-col-actions">Actions</div>
                                </div>

                                {currentItems.map((item, index) => (
                                    <div className="list-item" key={item._id || index}>
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
                                            <div>{item.category}</div>
                                            {item.subCategory && <div className="subcategory">{item.subCategory}</div>}
                                        </div>
                                        <div className="list-col-weight">{item.weight} Kg</div>
                                        <div className="list-col-origin">
                                            {item.countryOfOrigin === "CN" ? "China" :
                                                item.countryOfOrigin === "VN" ? "Vietnam" :
                                                    item.countryOfOrigin}
                                        </div>
                                        <div className="list-col-co2">
                                            <div className="co2-badge">
                                                {parseFloat(item.co2Emission).toFixed(2)} Kg CO₂e
                                            </div>
                                        </div>
                                        <div className="list-col-date">
                                            {new Date(item.modifiedDate).toLocaleDateString()}
                                        </div>
                                        <div className="list-col-actions">
                                            <button
                                                className="view-details-button"
                                                onClick={() => setSelectedProduct(item)}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="pagination-wrapper">
                                    <Pagination />
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Product Wizard Modal */}
            <ProductWizard
                show={showModal}
                setShowCloseWarning={setShowCloseWarning}
                onClose={async () => {
                    if (showModal) {
                        if (showCloseWarning) {
                            const confirmed = await alerts.confirm({
                                title: 'Are you sure?',
                                content: 'You are about to leave the process of creating product. Do you wish to continue?'
                            });
                            if (confirmed) setShowModal(false);
                        } else {
                            setShowModal(false);
                        }
                    } else {
                        setShowModal(false);
                    }
                }}
                uxpContext={uxpContext}
                onProductCreated={() => {
                    refreshProducts();
                    setShowModal(false);
                }}
            />

            {/* Product summary screen */}
            {selectedProduct && (
                <ProductInfoSummary
                    plan={plan}
                    uxpContext={uxpContext}
                    product={selectedProduct}
                    hideHeader={false}
                    onClose={() => {
                        setSelectedProduct(null);
                        refreshProducts();
                    }}
                    onDelete={function (): void {
                        setSelectedProduct(null);
                        refreshProducts();
                    }}
                />
            )}
        </div>
    );
};

export default ProductDashboardWidget;