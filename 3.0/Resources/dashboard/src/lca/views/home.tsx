import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { CRUDComponent, Modal, Button, LoadingSpinner, DefaultLoader, useAlert } from 'uxp/components';
import './home.scss';
import { getAllProducts, home } from '../../esgnow-service';
import { IContextProvider } from '@uxp';
import ProductInfoSummary from './product-info-summary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import ProductWizard from './product-wizard';
// Import react-tooltip
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css'; // Import the CSS for styling
import { canRunCalculator } from '@utils';

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

    const alerts = useAlert();

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
                // Fetch products and stats in parallel
                const [productsResponse, statsResponse] = await Promise.all([
                    getAllProducts(uxpContext),
                    home(uxpContext)
                ]);

                // Handle products data
                const productsData = productsResponse.data;
                setProducts(productsData.products || []);
                setPlan(productsData.plan?.plan || 'Free');

                // Handle dashboard stats
                const statsData = statsResponse.data;
                setDashboardStats({
                    totalProducts: statsData.totalProducts || 0,
                    totalImpact: statsData.totalImpact || 0,
                    totalProjects: statsData.totalProjects || 0,
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


            {/* Main Dashboard */}
            <div className="dashboard-container">
                {/* Header */}
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Welcome to ESG NOW!</h1>
                        <p className="dashboard-subtitle">Your sustainability dashboard</p>
                    </div>
                    {/* 
                    {canRunCalculator(uxpContext) ? console.log('canRunCalculator true') : console.log('canRunCalculator false')}
                    { canRunCalculator(uxpContext) ? */}
                    <div className="action-buttons">
                        <button className="esgnow-add-product-button" onClick={() => setShowCreateProductModal(true)}>
                            + Add Product
                        </button>
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
                            href="/Resources/ESGNOW/pdf/Esgfaq.pdf"
                            className="esgnow-faq-link"
                            target="_blank"
                            rel="noopener noreferrer"
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