import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { CRUDComponent, Modal, Button, LoadingSpinner, DefaultLoader, useAlert } from 'uxp/components';
import './home.scss';
import { getAllProducts, home } from '../../esgnow-service';
import { IContextProvider } from '@uxp';
import ProductInfoSummary from './product-info-summary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import ProductWizard from './product-wizard';

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

    // Get color based on CO2 emission value
    const getCO2Color = (emission: number): string => {
        if (emission < 300) return 'text-green-500';
        if (emission < 600) return 'text-yellow-500';
        return 'text-red-500';
    };

    // Handle product selection
    const handleProductSelect = (product: ProductInfoSummary) => {
        setSelectedProduct(product);
        setShowModal(true);
    };

    // Handle add new product
    const handleAddNewProduct = () => {
        // Implementation for adding new product
        console.log('Add new product clicked');
    };

    // Render loading state
    if (isLoading) {
        return (
            <div className="loading-container">

                <DefaultLoader></DefaultLoader>
            </div>
        );
    }

    // Render error state
    if (hasError) {
        return (
            <div className="error-container">
                {/* <EmptyState
                    icon="error"
                    title="Failed to load dashboard"
                    message={errorMessage}
                    action={{
                        label: "Try Again",
                        onClick: () => window.location.reload()
                    }}
                /> */}
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
                                content: 'you are about to leave from the process of creating product. Do you wish to continue?'
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
                    <div className="action-buttons">
                        <button className="add-product-button" onClick={() => setShowCreateProductModal(true)}>
                            + Add Product
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="stats-container">
                    <div className="stats-cards">
                        <div className="stat-card products">
                            <div className="stat-icon">

                                <FontAwesomeIcon icon={faInfoCircle} />
                            </div>
                            <h2>No. of Products Created</h2>
                            <p className="stat-number">{dashboardStats.totalProducts}</p>
                            <span className="stat-label">Products</span>
                        </div>

                        <div className="stat-card projects">
                            <div className="stat-icon">
                                <FontAwesomeIcon icon={faInfoCircle} />
                            </div>
                            <h2>No. of Projects Created</h2>
                            <p className="stat-number">{dashboardStats.totalProjects}</p>
                            <span className="stat-label">Projects</span>
                        </div>

                        <div className="stat-card credits">
                            <div className="stat-icon">
                                <FontAwesomeIcon icon={faInfoCircle} />
                            </div>
                            <h2>No. of AI Credits Consumed</h2>
                            <p className="stat-number">{dashboardStats.totalCredits}</p>
                            <span className="stat-label">Credits</span>
                        </div>
                    </div>

                    {/* Getting Started Video */}
                    <div className="getting-started">
                        <h2>Getting Started with ESG NOW</h2>
                        <p>Watch this quick tutorial to learn the basics of ESG NOW</p>
                        <iframe
                            width="100%"
                            height="200"
                            src="https://www.youtube.com/embed/ESGTutorialVideo"
                            title="Getting Started with ESG NOW"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
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
                    <Button
                        title="Take a Tour"

                        onClick={() => setShowTour(true)}
                    />
                </div>
            </div>
        </>
    );
};

export default HomeDashboard;