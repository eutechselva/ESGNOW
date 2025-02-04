import { TitleBar, Button, SearchBox, DataGrid, FilterPanel, FormField, Label, Select } from "uxp/components";
import * as React from "react";
import './ProductDashboardWidget.scss';
import ProductInfoSummary from './product-info-summary';
// import chairImage from './assets/images/chair.jpg';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import API_BASE_URL from "../config";
import { IContextProvider } from "@uxp";


interface IWidgetProps {
    uxpContext?: IContextProvider;
    instanceId?: string;
}



const ProductDashboardWidget: React.FunctionComponent<IWidgetProps> = (props) => {
    const [productData, setProductData] = React.useState([]);
    const [selectedProduct, setSelectedProduct] = React.useState<any | null>(null);
    const [showFilterPanel, setShowFilterPanel] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");
    const [filteredData, setFilteredData] = React.useState(productData);
    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
    const [maxCO2, setMaxCO2] = React.useState<number | null>(null);
    const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid'); // Default to 'grid' view

    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 6; // Show 6 items per page (2 rows x 3 columns)

    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = productData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(productData.length / itemsPerPage);

    const Pagination = () => (
        <div className="flex justify-center items-center gap-2 mt-4">
            <Button
                title="Previous"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
            />
            <span className="mx-2">
                Page {currentPage} of {totalPages}
            </span>
            <Button
                title="Next"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
            />
        </div>
    );

    React.useEffect(() => {
        const fetchProductData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/products`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setProductData(data);
            } catch (error) {
                console.error('There was a problem with the fetch operation:', error);
            }
        };

        fetchProductData();
    }, []);
    const [activeView, setActiveView] = React.useState<'product-info' | 'carbon-impact'>('product-info');

    const handleSearchChange = (newValue: string) => {
        setSearchValue(newValue);
        applyFilters(newValue, selectedCategory, maxCO2);
    };

    const applyFilters = (searchText: string, category: string | null, co2Limit: number | null) => {
        const filtered = productData.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchText.toLowerCase()) ||
                item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                item.category.toLowerCase().includes(searchText.toLowerCase());
            const matchesCategory = category ? item.category.includes(category) : true;
            const matchesCO2 = co2Limit ? parseFloat(item.co2Emission) <= co2Limit : true;
            return matchesSearch && matchesCategory && matchesCO2;
        });
        setFilteredData(filtered);
    };

    const handleClearFilters = () => {
        setSelectedCategory(null);
        setMaxCO2(null);
        setFilteredData(productData);
    };

    const toggleViewMode = (mode: 'grid' | 'list') => {
        setViewMode(mode);
    };

    return (
        <div className="content">
            {/* <div className="toggle-buttons">
                <Button
                    title="Product Info"
                    className={`product-info-btn ${activeView === 'product-info' ? 'active' : ''}`}
                    onClick={() => setActiveView('product-info')}
                />
                <Button
                    title="Carbon Impact"
                    className={`carbon-impact-btn ${activeView === 'carbon-impact' ? 'active' : ''}`}
                    onClick={() => setActiveView('carbon-impact')}
                />
            </div> */}
            {/* Only show dashboard title if no product is selected */}
            {selectedProduct ? null : (
                <>
                    <h1 className="dashboard-title">Products</h1>

                    <div className="product-library">
                        {/* <h2>Product Library</h2> */}
                        <div className="search-filter-section">
                            <div className="uxp-search-box-container">
                                <SearchBox
                                    placeholder="Search products..."
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
                                                applyFilters(searchValue, value, maxCO2);
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
                                                applyFilters(searchValue, selectedCategory, value);
                                            }}
                                            placeholder="Set maximum CO2"
                                        />
                                    </FormField>
                                </FilterPanel>
                            </div>
                            {/* <div className="view-toggle-section">
                                <Button 
                                    title="Grid View" 
                                    icon="faInfoCircle" 
                                    onClick={() => toggleViewMode('grid')} 
                                    className={viewMode === 'grid' ? 'active' : ''}
                                />
                                <Button 
                                    title="List View" 
                                    icon="list" 
                                    onClick={() => toggleViewMode('list')} 
                                    className={viewMode === 'list' ? 'active' : ''}
                                />
                            </div> */}
                        </div>

                        {viewMode === 'grid' ? (
                            <>
                            <DataGrid
                                data={productData}
                                renderItem={(item) => (
                                    <div className="product-card" onClick={() => setSelectedProduct(item)}>
                                        <img src={item.images[0]} alt="Product" className="product-image" />
                                        <div className="co2-emission">{parseInt(item.co2Emission).toFixed(2) + ' Kg CO2e'}</div>
                                        <div className="product-details">
                                            <p>{item.title}</p>
                                            <h4>{item.name}</h4>
                                            <p>{item.category}</p>
                                            <p>Modified: {new Date(item.modifiedDate).toLocaleString()}</p>
                                            <p>Created: {new Date(item.createdDate).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}
                                columns={3}
                                className="product-data-grid"
                            />
                            <Pagination />
                            </>
                        ) : (
                            <div className="list-view">
                                {productData.map((item, index) => (
                                    <div key={index} className="product-list-item" onClick={() => setSelectedProduct(item)}>
                                        <img src={item.icon} alt="Product" className="product-image" />
                                        <div className="product-details">
                                            <p>{item.title}</p>
                                            <h4>{item.name}</h4>
                                            <p>{item.category}</p>
                                            <p>Modified: {item.modifiedDate}</p>
                                            <p>Created: {item.createdDate}</p>
                                            <p>CO2 Emission: {item.co2Emission + ' Kg CO2e'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button
                        title="+ Add Product"
                        onClick={() => console.log("Open Add Product form")}
                        className="add-product-button"
                    />
                </>
            )}

            {/* Product summary screen */}
            {selectedProduct && (
                <ProductInfoSummary
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                />
            )}
        </div>
    );
};

export default ProductDashboardWidget;
