import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { CRUDComponent, Modal, Button, LoadingSpinner, DefaultLoader, useAlert } from 'uxp/components';
import './home.scss';
import { getAllProducts, home, getAllProjects } from '../../esgnow-service'; // Import getAllProjects
import { IContextProvider } from '@uxp';
import ProductInfoSummary from './product-info-summary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import ProductWizard from './product-wizard';
// Import react-tooltip
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css'; // Import the CSS for styling
import { canRunCalculator } from '@utils';
import ESGNowFAQ from './faq';

interface IHomeDashboardWidgetProps {
    uxpContext: IContextProvider;
}

interface DashboardStats {
    totalProducts: number;
    totalImpact: number;
    totalProjects: number;
    totalCredits: number;
}

const HomeDashboard: React.FC<IHomeDashboardWidgetProps> = ({ uxpContext }) => {
    // State management
    const [searchValue, setSearchValue] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
        totalProducts: 0,
        totalImpact: 0,
        totalProjects: 0,
        totalCredits: 0
    });

    const [products, setProducts] = useState<ProductInfoSummary[]>([]);
    const [plan, setPlan] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const [showCreateProductModal, setShowCreateProductModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductInfoSummary | null>(null);
    const [showTour, setShowTour] = useState(false);
    const [showCloseWarning, setShowCloseWarning] = React.useState(true);
    const [showFAQModal, setShowFAQModal] = useState(false);

    const alerts = useAlert();

        const [showDropdown, setShowDropdown] = useState(false);

        const handleAddProduct = () => {
            setShowDropdown(false);
            setShowCreateProductModal(true); // This is your existing modal opener
        };

        const handleBulkImport = () => {
            setShowDropdown(false);
            alert("Bulk import not implemented yet.");
        };
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                const target = event.target as HTMLElement;
                if (
                    !target.closest('.addproduct-wrapper') &&
                    !target.closest('.dropdown-menu')
                ) {
                    setShowDropdown(false);
                }
            };
        
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, []);
        
    // Search config
    const searchConfig = useMemo(() => ({
        enabled: true,
        placeholder: 'Search products...'
    }), []);

    // Fetch dashboard data (combined API calls)
    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // Fetch products, projects and stats in parallel
                const [productsResponse, statsResponse, projectsResponse] = await Promise.all([
                    getAllProducts(uxpContext),
                    home(uxpContext),
                    getAllProjects(uxpContext,{})
                ]);

                // Handle products data
                const productsData = productsResponse.data;
                setProducts(productsData.products || []);
                setPlan(productsData.plan?.plan || 'Free');

                // Handle dashboard stats
                const statsData = statsResponse.data;
                
                // Get the actual project count from getAllProjects response
                const projectsCount = Array.isArray(projectsResponse.data) 
                    ? projectsResponse.data.length 
                    : (projectsResponse.data.projects?.length || 0);
                
                setDashboardStats({
                    totalProducts: statsData.totalProducts || 0,
                    totalImpact: statsData.totalImpact || 0,
                    totalProjects: projectsCount, // Use the actual project count
                    totalCredits: statsData.totalCredits || 0
                });

                setHasError(false);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
                setHasError(true);
                setErrorMessage('Failed to load dashboard data. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [uxpContext]);

    // Handle search input change
    const handleSearchChange = (value: string) => {
        setSearchValue(value);
    };

    // Get products for CRUD component
    const getProducts = useCallback(async (
        page?: number,
        pageSize?: number,
        query?: string,
        filters?: any
    ): Promise<{ items: ProductInfoSummary[] }> => {
        try {
            const { data, error } = await getAllProducts(uxpContext);

            if (error) {
                console.error('Error fetching products:', error);
                return { items: [] };
            }

            // Format the data
            const formattedData = data.products.map((product: any) => ({
                ...product,
                modifiedDate: product.modifiedDate
                    ? new Date(product.modifiedDate).toLocaleDateString()
                    : 'N/A',
            }));

            return { items: formattedData };
        } catch (error) {
            console.error('Failed to fetch products:', error);
            return { items: [] };
        }
    }, [uxpContext]);

    // Handle product selection
    const handleProductSelect = (product: ProductInfoSummary) => {
        setSelectedProduct(product);
        setShowModal(true);
    };

    if (isLoading) {
        return (
            <div className="loading-container">
                <DefaultLoader></DefaultLoader>
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="error-container">
                {/* Error state UI */}
            </div>
        );
    }

    return (
        <>
            {/* Product Details Modal */}
            <Modal
                title={`Product: ${selectedProduct?.name || 'N/A'}`}
                show={showModal}
                onClose={() => setShowModal(false)}
            >
                {selectedProduct && (
                    <ProductInfoSummary
                        plan={plan}
                        product={selectedProduct}
                        onClose={() => setShowModal(false)}
                        onDelete={() => console.log('Delete not implemented')}
                        hideHeader={true}
                        hideDelete={true}
                        uxpContext={uxpContext}
                    />
                )}
            </Modal>
            <ProductWizard
                show={showCreateProductModal}
                setShowCloseWarning={setShowCloseWarning}
                onClose={async () => {
                    if (showCreateProductModal) {
                        if (showCloseWarning) {
                            const confirmed = await alerts.confirm({
                                title: 'Are you sure?',
                                content: 'Are you sure you want to exit?'
                            })
                            confirmed ? setShowCreateProductModal(false) : null
                        }
                        else {
                            setShowCreateProductModal(false)
                        }
                    }
                    else {
                        setShowCreateProductModal(false)
                    }
                }}
                uxpContext={uxpContext}
                onProductCreated={() => {
                    // Refresh the product list after a new product is created
                    getAllProducts(uxpContext).then(response => {
                        setProducts(response.data.products);
                    });
                }}
            />
            {/* FAQ Modal */}
            <Modal
                title="Frequently Asked Questions"
                show={showFAQModal}
                onClose={() => setShowFAQModal(false)}
                // size="large"
            >
                <ESGNowFAQ />
            </Modal>

            {/* Main Dashboard */}
            <div className="dashboard-container">
                {/* Header */}
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Welcome to ESG NOW!</h1>
                        <p className="dashboard-subtitle">Helping businesses decarbonise procurement</p>
                    </div>
                    {/* 
                    {canRunCalculator(uxpContext) ? console.log('canRunCalculator true') : console.log('canRunCalculator false')}
                    { canRunCalculator(uxpContext) ? */}                    
                    <div className="action-buttons">
                    <div className="addproduct-wrapper">
                        <Button
                        title="New"
                        className="addproduct"
                        onClick={() => setShowDropdown((prev) => !prev)}
                        />
                        <span className="addproduct-plus">＋</span>
                        <span className="addproduct-down">▾</span>
                    </div>

                    {showDropdown && (
                        <div className="dropdown-menu">
                        <div className="dropdown-item" onClick={handleAddProduct}>
                            <span className="svg-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
                                <path d="M8 3.33333V12.6667M3.33333 8H12.6667" stroke="#0156D2" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            </span>
                            Add New Product
                        </div>

                        <div className="dropdown-item" onClick={handleBulkImport}>
                            <span className="svg-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="16" fill="none" viewBox="0 0 19 16">
                                <path d="M13.4935 6.00737C13.4988 6.00735 13.5042 6.00734 13.5096 6.00734C15.2902 6.00734 16.7337 7.35293 16.7337 9.01287C16.7337 10.5599 15.4799 11.8339 13.8678 12M13.4935 6.00737C13.5041 5.89737 13.5096 5.78597 13.5096 5.67339C13.5096 3.64463 11.7453 2 9.56896 2C7.50783 2 5.8163 3.47511 5.64297 5.35461M13.4935 6.00737C13.4202 6.76507 13.1002 7.4564 12.6088 8.011M5.64297 5.35461C3.82568 5.51582 2.40421 6.9426 2.40421 8.67887C2.40421 10.2945 3.63494 11.6421 5.27011 11.9515M5.64297 5.35461C5.75606 5.34458 5.87068 5.33945 5.98658 5.33945C6.7932 5.33945 7.53756 5.58796 8.13636 6.00734" stroke="#0156D2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M9.56896 8.66667V14M9.56896 8.66667C9.06728 8.66667 8.12994 9.99621 7.77777 10.3333M9.56896 8.66667C10.0706 8.66667 11.008 9.99621 11.3601 10.3333" stroke="#0156D2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            </span>
                            Bulk Import Products
                        </div>
                        </div>
                    )}
                    </div>
                </div>

                {/* Stats Cards with Tooltips */}
                <div className="stats-container">
                    <div className="stats-cards">
                        <div className="stat-card products">
                            <div className="stat-icon">
                                <FontAwesomeIcon
                                    icon={faInfoCircle}
                                    data-tooltip-id="products-tooltip"
                                    data-tooltip-content="Displays the total number of products successfully added to the platform."
                                />
                            </div>
                            <h2>No. of Products Created</h2>
                            <p className="stat-number">{dashboardStats.totalProducts}</p>
                            <span className="stat-label">Products</span>
                        </div>

                        <div className="stat-card projects">
                            <div className="stat-icon">
                                <FontAwesomeIcon
                                    icon={faInfoCircle}
                                    data-tooltip-id="projects-tooltip"
                                    data-tooltip-content="Displays the total number of projects create on the platform."
                                />
                            </div>
                            <h2>No. of Projects Created</h2>
                            <p className="stat-number">{dashboardStats.totalProjects}</p>
                            <span className="stat-label">Projects</span>
                        </div>

                        <div className="stat-card credits">
                            <div className="stat-icon">
                                <FontAwesomeIcon
                                    icon={faInfoCircle}
                                    data-tooltip-id="credits-tooltip"
                                    data-tooltip-content="Tracks the number of AI credits used for generating the inputs for carbon footprint calculations."
                                />
                            </div>
                            <h2>No. of AI Credits Consumed</h2>
                            <p className="stat-number">{dashboardStats.totalCredits}</p>
                            <span className="stat-label">Credits</span>
                        </div>
                    </div>

                    {/* frequently asked question section */}
                    <div className="faq-section">
                        <h2>Getting Started</h2>
                        <p>Get answers to common questions about ESG NOW</p>
                        <a
                            onClick={() => setShowFAQModal(true)}
                            className="esgnow-faq-link"
                        >
                            Frequently Asked Questions
                        </a>
                    </div>

                </div>

                {/* Recent Products Table */}
                <div className="recent-products-container">
                    <CRUDComponent
                        list={{
                            title: 'Recent Products',
                            columns: [
                                { id: 'code', label: 'Product Code' },
                                { id: 'name', label: 'Product Name' },
                                {
                                    id: 'co2Emission',
                                    label: 'Carbon Footprint (KgCO2e)',
                                },
                                { id: 'category', label: 'Main Category' },
                                { id: 'subCategory', label: 'Sub Category' },
                                { id: 'modifiedDate', label: 'Date Created/Modified' }
                            ],
                            defaultPageSize: 10,
                            data: {
                                getData: getProducts
                            },
                            search: searchConfig,
                            onClickRow: (e, item: ProductInfoSummary) => handleProductSelect(item),
                            noItemsMessage: "No Products Found"
                        }}
                    />
                </div>

                {/* Dashboard Footer */}
                <div className="dashboard-footer">
                    <p>Your current plan: <strong>{plan || 'Free Plan'}</strong></p>                    
                    {/* <Button
                        title="Take a Tour"
                        onClick={() => setShowTour(true)}
                    /> */}

                </div>
            </div>

            {/* React-Tooltip components */}
            <Tooltip id="products-tooltip" place="top" />
            <Tooltip id="projects-tooltip" place="top" />
            <Tooltip id="credits-tooltip" place="top" />
        </>
    );
};

export default HomeDashboard;