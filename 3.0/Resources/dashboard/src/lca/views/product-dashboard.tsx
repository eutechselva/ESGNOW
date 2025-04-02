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
        <div className="esgnow-pagination-container">
            <div className="esgnow-pagination-controls">
                <select
                    className="esgnow-items-per-page"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                >
                    <option value={6}>6 per page</option>
                    <option value={12}>12 per page</option>
                    <option value={24}>24 per page</option>
                </select>

                <div className="esgnow-pagination-buttons">
                    <button
                        title="Previous"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="esgnow-pagination-button"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} className="esgnow-pagination-arrow" />
                    </button>

                    <span className="esgnow-pagination-info">
                        Page {currentPage} of {totalPages || 1}
                    </span>

                    <button
                        title="Next"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="esgnow-pagination-button"
                    >
                        <FontAwesomeIcon icon={faChevronRight} className="esgnow-pagination-arrow" />
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
        setFilteredData(products);
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

    const handleSearchChange = (newValue: string) => {
        setSearchValue(newValue);
        applyFilters(newValue, selectedCategory, selectedSubCategory, maxCO2, minCO2, selectedCountry, sortBy);
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
        // Filter the products
        let filtered = products.filter(item => {
            // Search text matching
            const matchesSearch = searchText ? (
                (item.title && item.title.toLowerCase().includes(searchText.toLowerCase())) ||
                (item.name && item.name.toLowerCase().includes(searchText.toLowerCase())) ||
                (item.category && item.category.toLowerCase().includes(searchText.toLowerCase())) ||
                (item.description && item.description.toLowerCase().includes(searchText.toLowerCase())) ||
                (item.code && item.code.toLowerCase().includes(searchText.toLowerCase()))
            ) : true;

            // Category matching
            const matchesCategory = category ? item.category === category : true;

            // Sub-category matching
            const matchesSubCategory = subCategory ? item.subCategory === subCategory : true;

            // CO2 max limit
            const matchesMaxCO2 = co2Max ? parseFloat(item.co2Emission) <= co2Max : true;

            // CO2 min limit
            const matchesMinCO2 = co2Min ? parseFloat(item.co2Emission) >= co2Min : true;

            // Country matching
            const itemCountry = item.countryOfOrigin === "CN" ? "China" :
                item.countryOfOrigin === "VN" ? "Vietnam" :
                    item.countryOfOrigin;
            const matchesCountry = country ? itemCountry === country : true;

            return matchesSearch && matchesCategory && matchesSubCategory && matchesMaxCO2 && matchesMinCO2 && matchesCountry;
        });

        // Sort the filtered products
        if (sort === "newest") {
            filtered = filtered.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
        } else if (sort === "oldest") {
            filtered = filtered.sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime());
        } else if (sort === "co2High") {
            filtered = filtered.sort((a, b) => parseFloat(b.co2Emission) - parseFloat(a.co2Emission));
        } else if (sort === "co2Low") {
            filtered = filtered.sort((a, b) => parseFloat(a.co2Emission) - parseFloat(b.co2Emission));
        } else if (sort === "nameAZ") {
            filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort === "nameZA") {
            filtered = filtered.sort((a, b) => b.name.localeCompare(a.name));
        }

        setFilteredData(filtered);
    };

    const handleClearFilters = () => {
        setSelectedCategory(null);
        setSelectedSubCategory(null);
        setMaxCO2(null);
        setMinCO2(null);
        setSelectedCountry(null);
        setSortBy("newest");
        setSearchValue("");
        setFilteredData(products);
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
        <div className="esgnow-product-dashboard-container">
            {selectedProduct ? null : (
                <>
                    <div className="esgnow-dashboard-header">
                        <div className="esgnow-header-left">
                            <h1 className="esgnow-dashboard-title">Products</h1>
                        </div>

                        <div className="esgnow-header-right">
                            <Button
                                className="esgnow-refresh-button"
                                onClick={refreshProducts}
                                disabled={isLoading}
                                title="Refresh"
                            >
                                <span className="esgnow-refresh-icon">↻</span>
                                {isLoading ? "Loading..." : "Refresh"}
                            </Button>

                            <button
                                className="esgnow-add-product-button"
                                onClick={() => setShowModal(true)}
                            >
                                + Add Product
                            </button>
                        </div>
                    </div>

                    <div className="esgnow-search-filter-container">
                        <div className="esgnow-search-section">
                            <div className="esgnow-search-box-wrapper">
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
                                        enableClear={!!(selectedCategory || selectedSubCategory || maxCO2 || minCO2 || selectedCountry)}
                                        onClear={handleClearFilters}
                                        onOpen={() => setShowFilterPanel(true)}
                                        onClose={() => setShowFilterPanel(false)}
                                        className="esgnow-filter-panel"
                                    >
                                        <div className="esgnow-filter-grid">
                                            <FormField className="esgnow-filter-field">
                                                <Label>Category</Label>
                                                <Select
                                                    selected={selectedCategory}
                                                    options={categories.map(cat => ({ label: cat, value: cat }))}
                                                    onChange={(value: string) => {
                                                        setSelectedCategory(value);
                                                        applyFilters(searchValue, value, selectedSubCategory, maxCO2, minCO2, selectedCountry, sortBy);
                                                    }}
                                                    placeholder="-- All Categories --"
                                                />
                                            </FormField>

                                            <FormField className="esgnow-filter-field">
                                                <Label>Sub Category</Label>
                                                <Select
                                                    selected={selectedSubCategory}
                                                    options={subCategories.map(subCat => ({ label: subCat, value: subCat }))}
                                                    onChange={(value: string) => {
                                                        setSelectedSubCategory(value);
                                                        applyFilters(searchValue, selectedCategory, value, maxCO2, minCO2, selectedCountry, sortBy);
                                                    }}
                                                    placeholder="-- All Sub Categories --"
                                                />
                                            </FormField>

                                            <FormField className="esgnow-filter-field">
                                                <Label>Country of Manufacture</Label>
                                                <Select
                                                    selected={selectedCountry}
                                                    options={countries.map(country => ({ label: country, value: country }))}
                                                    onChange={(value: string) => {
                                                        setSelectedCountry(value);
                                                        applyFilters(searchValue, selectedCategory, selectedSubCategory, maxCO2, minCO2, value, sortBy);
                                                    }}
                                                    placeholder="-- All Countries --"
                                                />
                                            </FormField>

                                            <FormField className="esgnow-filter-field">
                                                <Label>Min CO₂ Emission (Kg CO₂e)</Label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.1"
                                                    value={minCO2 || ""}
                                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                                        const value = event.target.value ? parseFloat(event.target.value) : null;
                                                        setMinCO2(value);
                                                        applyFilters(searchValue, selectedCategory, selectedSubCategory, maxCO2, value, selectedCountry, sortBy);
                                                    }}
                                                    placeholder="Minimum CO₂"
                                                    className="esgnow-number-input"
                                                />
                                            </FormField>

                                            <FormField className="esgnow-filter-field">
                                                <Label>Max CO₂ Emission (Kg CO₂e)</Label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.1"
                                                    value={maxCO2 || ""}
                                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                                        const value = event.target.value ? parseFloat(event.target.value) : null;
                                                        setMaxCO2(value);
                                                        applyFilters(searchValue, selectedCategory, selectedSubCategory, value, minCO2, selectedCountry, sortBy);
                                                    }}
                                                    placeholder="Maximum CO₂"
                                                    className="esgnow-number-input"
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
                                        selected={sortBy}
                                        options={[
                                            { label: "Newest First", value: "newest" },
                                            { label: "Oldest First", value: "oldest" },
                                            { label: "CO₂ (High to Low)", value: "co2High" },
                                            { label: "CO₂ (Low to High)", value: "co2Low" },
                                            { label: "Name (A-Z)", value: "nameAZ" },
                                            { label: "Name (Z-A)", value: "nameZA" },
                                        ]}
                                        onChange={(value: string) => {
                                            setSortBy(value);
                                            applyFilters(searchValue, selectedCategory, selectedSubCategory, maxCO2, minCO2, selectedCountry, value);
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

                    {/* Results Summary Section */}
                    <div className="esgnow-results-summary">
                        <span>Showing {currentItems.length} of {filteredData.length} products (page {currentPage} of {totalPages})</span>
                        {(searchValue || selectedCategory || selectedSubCategory || maxCO2 || minCO2 || selectedCountry) && (
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
                    ) : filteredData.length === 0 ? (
                        <div className="esgnow-no-results">
                            <div className="esgnow-no-results-icon">🔍</div>
                            <h3>No products found</h3>
                            <p>Try adjusting your search criteria or filters</p>
                            <button
                                onClick={handleClearFilters}
                                className="esgnow-clear-filters-button"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <>
                            <div className="esgnow-product-grid">
                                {currentItems.map((item, index) => (
                                    <div
                                        className="esgnow-product-card"
                                        key={item._id || index}
                                        onClick={() => setSelectedProduct(item)}
                                    >
                                        <div className="esgnow-product-card-header">
                                            <div className="esgnow-product-code">{item.code}</div>
                                            <div className="esgnow-co2-emission">
                                                <span className="esgnow-co2-value">{parseFloat(item.co2Emission).toFixed(2)}</span>
                                                <span className="esgnow-co2-unit">Kg CO₂e</span>
                                            </div>
                                        </div>

                                        <div
                                            className="esgnow-product-image-container"
                                            style={{
                                                backgroundImage: item.images && item.images.length > 0 ?
                                                    `url(${item.images[0]})` : 'none'
                                            }}
                                        >
                                            {(!item.images || item.images.length === 0) && (
                                                <div className="esgnow-no-image">
                                                    <span>No Image</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="esgnow-product-card-content">
                                            <h3 className="esgnow-product-name">{item.name}</h3>
                                            <div className="esgnow-product-meta">
                                                <span className="esgnow-product-category">{item.category}</span>
                                                {item.subCategory && (
                                                    <span className="esgnow-product-subcategory">{item.subCategory}</span>
                                                )}
                                            </div>

                                            <div className="esgnow-product-details-preview">
                                                <div className="esgnow-product-weight">
                                                    <span className="esgnow-detail-label">Weight:</span>
                                                    <span className="esgnow-detail-value">{item.weight} Kg</span>
                                                </div>

                                                <div className="esgnow-product-origin">
                                                    <span className="esgnow-detail-label">Origin:</span>
                                                    <span className="esgnow-detail-value">
                                                        {item.countryOfOrigin === "CN" ? "China" :
                                                            item.countryOfOrigin === "VN" ? "Vietnam" :
                                                                item.countryOfOrigin}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="esgnow-product-card-footer">
                                            <div className="esgnow-product-date">
                                                Modified: {new Date(item.modifiedDate).toLocaleDateString()}
                                            </div>
                                            <button className="esgnow-view-details-button">
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="esgnow-pagination-wrapper">
                                    <Pagination />
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="esgnow-product-list">
                                <div className="esgnow-list-header">
                                    <div className="esgnow-list-col-name">Product Name</div>
                                    <div className="esgnow-list-col-category">Category</div>
                                    <div className="esgnow-list-col-weight">Weight</div>
                                    <div className="esgnow-list-col-origin">Origin</div>
                                    <div className="esgnow-list-col-co2">CO₂ Emission</div>
                                    <div className="esgnow-list-col-date">Modified Date</div>
                                    <div className="esgnow-list-col-actions">Actions</div>
                                </div>

                                {currentItems.map((item, index) => (
                                    <div className="esgnow-list-item" key={item._id || index}>
                                        <div className="esgnow-list-col-name">
                                            <div className="esgnow-item-with-image">
                                                <div
                                                    className="esgnow-list-item-thumbnail"
                                                    style={{
                                                        backgroundImage: item.images && item.images.length > 0 ?
                                                            `url(${item.images[0]})` : 'none'
                                                    }}
                                                >
                                                    {(!item.images || item.images.length === 0) && "No Image"}
                                                </div>
                                                <div className="esgnow-product-name-code">
                                                    <span className="esgnow-product-name">{item.name}</span>
                                                    <span className="esgnow-product-code">{item.code}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="esgnow-list-col-category">
                                            <div>{item.category}</div>
                                            {item.subCategory && <div className="esgnow-subcategory">{item.subCategory}</div>}
                                        </div>
                                        <div className="esgnow-list-col-weight">{item.weight} Kg</div>
                                        <div className="esgnow-list-col-origin">
                                            {item.countryOfOrigin === "CN" ? "China" :
                                                item.countryOfOrigin === "VN" ? "Vietnam" :
                                                    item.countryOfOrigin}
                                        </div>
                                        <div className="esgnow-list-col-co2">
                                            <div className="esgnow-co2-badge">
                                                {parseFloat(item.co2Emission).toFixed(2)} Kg CO₂e
                                            </div>
                                        </div>
                                        <div className="esgnow-list-col-date">
                                            {new Date(item.modifiedDate).toLocaleDateString()}
                                        </div>
                                        <div className="esgnow-list-col-actions">
                                            <button
                                                className="esgnow-view-details-button"
                                                onClick={() => setSelectedProduct(item)}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="esgnow-pagination-wrapper">
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