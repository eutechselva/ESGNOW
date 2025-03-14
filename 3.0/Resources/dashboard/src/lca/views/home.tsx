import React, { useCallback, useMemo, useState } from 'react';
import {  CRUDComponent, Modal } from 'uxp/components';
import './home.scss';
import { getAllProducts, home } from '../../esgnow-service';
import { IContextProvider } from '@uxp';
import ProductInfoSummary from './product-info-summary';

interface IHomeDashboardWidgetProps {
    uxpContext: IContextProvider;
}

const HomeDashboard: React.FC<IHomeDashboardWidgetProps> = ({ uxpContext }) => {

    const [searchValue, setSearchValue] = useState('');
    const [inputValue, setInputValue] = useState('');
   
    const [totalProducts, setTotalProducts] = useState<any[]>([]);
    const [totalImpact, setTotalImpact] = useState<any[]>([]);
    const [totalProjects, setTotalProjects] = useState<any[]>([]);
    const [totalCredits, setTotalCredits] = useState<any[]>([]);
    const [products, setProducts] = React.useState([]);
    const [plan, setPlan] = useState<string>(null);
    const [showModal, setShowModal] = useState(false);
    const [item, setItem] = useState<any>();

    const memorizedSearch = useMemo(() => ({ enabled: true }), [])

    const handleSearchChange = (value: string) => {
        setSearchValue(value);
    };
     React.useEffect(() => {
            const fetchProductData = async () => {
                try {
                    const response = await getAllProducts(uxpContext);
    
                    let data = response.data.products;
                    setPlan(response.data.plan);
    
                    setProducts(data);
                } catch (error) {
                    console.error('There was a problem with the fetch operation:', error);
                }
            };
    
            fetchProductData();
        }, []);

    React.useEffect(() => {
        const fetchProductData = async () => {

            const data = await home(uxpContext);
            setTotalProducts(data.data.totalProducts);
            setTotalImpact(data.data.totalImpact);
            setTotalProjects(data.data.totalProjects);
            setTotalCredits(data.data.totalCredits);

        };

        fetchProductData();
    }, []);

    const getProducts = useCallback(async (page?: number, pageSize?: number, query?: string, filters?: any): Promise<{ items: any[] }> => {
        let { data, error } = await getAllProducts(uxpContext);

        data = data.products.map((d: any) => ({
            ...d,
            modifiedDate: d.modifiedDate ? new Date(d.modifiedDate).toLocaleDateString() : 'N/A',

        }));

        if (!!error) return { items: [] };
        return { items: data };
    }, [])

    return (
        <>
            <Modal title={`Product : ${item?.name || 'N/A'}`} show={showModal} onClose={() => setShowModal(false)}>
                <ProductInfoSummary
                    plan={plan}
                    product={item}
                    onClose={() => setShowModal(false)}
                    onDelete={function (): void {
                        throw new Error('Function not implemented.');
                    }}
                    hideHeader={true}
                    hideDelete={true}
                    uxpContext={uxpContext}
                />
            </Modal>
            <div style={{ width: "100%", height: "100%", position: "relative" }}>
                <div className="title-container">
                    <h1 className="heading">Welcome to ESG NOW!</h1>
                </div>

                <div className="summary-card-container">
                    <section className="summary">
                        <div className="card">
                            <h2>No. of Products Created</h2>
                            <p className="number">{totalProducts}</p>
                            <span>Products</span>
                        </div>
                        {/* <div className="card">
                        <h2>No. of Impacts Calculated</h2>
                        <p className="number">{totalImpact}</p>
                        <span>Emission Impact</span>
                    </div> */}
                        <div className="card">
                            <h2>No. of Projects Created</h2>
                            <p className="number">{totalProjects}</p>
                            <span>Projects</span>
                        </div>
                        <div className="card">
                            <h2>No. of AI Credits Consumed</h2>
                            <p className="number">{totalCredits}</p>
                            <span>Credits</span>
                        </div>
                    </section>

                    <section className="getting-started">
                        <iframe
                            width="100%"
                            height="200"
                            src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                            title="Getting Started Video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </section>
                </div>

                <div className="recent-projects-container">
                    <div className="recent-projects">


                        <CRUDComponent
                            list={{
                                title: 'Recent Products',
                                columns: [

                                    { id: 'code', label: 'Product Code' },
                                    { id: 'name', label: 'Product Name' },
                                    { id: 'co2Emission', label: 'Carbon Footprint (KgCO2e)' },
                                    { id: 'category', label: 'Main Category' },
                                    { id: 'subCategory', label: 'Sub Category' },
                                    { id: 'modifiedDate', label: 'Date Created/Modified' }
                                ],
                                defaultPageSize: 10,
                                data: {
                                    getData: getProducts
                                },
                                search: memorizedSearch,
                                onClickRow: (e, item: any) => { setItem(item); setShowModal(true) }
                            }
                            }
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default HomeDashboard