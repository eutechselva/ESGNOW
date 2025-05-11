import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CRUDComponent, Modal, TableComponent, TitleBar, WidgetWrapper } from 'uxp/components';
import './projects.scss';
import { IContextProvider } from "@uxp";
import { getAllProjects, getProjectImpacts } from "../../esgnow-service";
import EmissionSummary from "./emission-summary";
import { ProductInfoSummary } from "../types/product-info-summary.type";

interface IProjectProps {
    uxpContext?: IContextProvider;
}

interface ProjectImpact {
    projectCode: string;
    projectName: string;
    totalProjectImpact: number;
    totalMaterialsImpact: number;
    totalManufacturingImpact: number;
    totalTransportationImpact: number;
    products: Array<{
        productName: string;
        productCode: string;
        productImage: string;
        impacts: {
            totalImpact: number;
            impactByMaterials: number;
            impactByManufacturing: number;
            impactByTransportation: number;
        };
    }>;
}

// Create product info from API data for EmissionSummary
const createProductFromAPI = (item: any): ProductInfoSummary => {
    if (!item || !item.products || item.products.length === 0) {
        // Return empty data with proper project code if available
        return {
            _id: item?._id || 'unknown_id',
            name: 'Unknown Product',
            code: item?.projectCode || 'Unknown Code',
            category: 'Unknown Category',
            subCategory: 'Unknown Subcategory',
            weight: 0,
            countryOfOrigin: 'Unknown',
            description: 'No description available',
            icon: '',
            images: [],
            co2Emission: 0,
            co2EmissionRawMaterials: 0,
            co2EmissionFromProcesses: 0,
            materials: [] ,
            productManufacturingProcess: [] 
        };
    }
    
    // Get the product data
    const product = item.products[0];
    console.log('[DEBUG] Creating product from API data:', JSON.stringify(product, null, 2));
    
    // Log exact field values to check what's available
    console.log('[DEBUG] Available top-level fields in item:', Object.keys(item).join(', '));
    console.log('[DEBUG] Project code from item:', item.projectCode);
    
    // Get the product code from various possible sources
    console.log('[DEBUG] Looking for product code in product:', product.code, product.productCode);
    console.log('[DEBUG] Looking for project code in item:', item.projectCode);
    
    // Try various ways to get the code
    let code = 'Unknown Code';
    if (product.code && product.code !== '') {
        code = product.code;
        console.log('[DEBUG] Using product.code:', code);
    } else if (product.productCode && product.productCode !== '') {
        code = product.productCode;
        console.log('[DEBUG] Using product.productCode:', code);
    } else if (item.projectCode && item.projectCode !== '') {
        code = item.projectCode;
        console.log('[DEBUG] Using item.projectCode as fallback:', code);
    }
    
    // Create a ProductInfoSummary object with all required fields
    return {
        _id: product._id || product.productId || item._id || 'unknown_id',
        name: product.name || product.productName || 'Unknown Product',
        code: code,
        category: product.category || product.productCategory || 'Unknown Category',
        subCategory: product.subCategory || product.productSubCategory || 'Unknown Subcategory',
        weight: typeof product.weight === 'number' ? product.weight : 
               typeof product.productWeight === 'number' ? product.productWeight : 0,
        countryOfOrigin: product.countryOfOrigin || 'Unknown',
        description: product.description || product.productDescription || 'No description available',
        icon: '',
        images: Array.isArray(product.images) && product.images.length > 0 ? product.images : 
                product.productImage ? [product.productImage] : [],
        co2Emission: Number(product.co2Emission || product.impacts?.totalImpact || 0),
        co2EmissionRawMaterials: Number(product.co2EmissionRawMaterials || product.impacts?.impactByMaterials || 0),
        co2EmissionFromProcesses: Number(product.co2EmissionFromProcesses || product.impacts?.impactByManufacturing || 0),
        materials: Array.isArray(product.materials) && product.materials.length > 0 ? 
            product.materials : 
            [{ 
                materialClass: "Primary Material", 
                specificMaterial: "Unknown", 
                emissionFactor: Number(product.impacts?.impactByMaterials || 0), 
                quantity: 1 
            }] as Array<{ materialClass: string; specificMaterial: string; emissionFactor: number; quantity: number }>,
        productManufacturingProcess: Array.isArray(product.productManufacturingProcess) && product.productManufacturingProcess.length > 0 ? 
            product.productManufacturingProcess : 
            [{
                materialClass: "Manufacturing",
                emissionFactor: Number(product.impacts?.impactByManufacturing || 0),
                manufacturingProcesses: [{
                    category: "Unknown Process",
                    process: "Unknown Process",
                    emissionFactor: Number(product.impacts?.impactByManufacturing || 0)
                }]
            }] as Array<{
                materialClass: string;
                emissionFactor: number;
                manufacturingProcesses: Array<{
                    category: string;
                    process?: string;
                    emissionFactor: number;
                }>
            }>
    };
}

const Projects: React.FC<IProjectProps> = (props) => {
    const [projects, setProjects] = useState<ProjectImpact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [item, setItem] = useState<any>();
    const [plan,setPlan] =  useState<string | null>(null);

    const memorizedSearch = useMemo(() => ({ enabled: true }), [])

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            // First get all projects
            const response = await getAllProjects(props.uxpContext, {});
            console.log('[DEBUG] getAllProjects raw response:', JSON.stringify(response.data, null, 2));

            const projectsData = await response.data.projects;
            setPlan(response.data.plan.plan);

            // Then fetch impact data for each project
            const projectsWithImpacts = await Promise.all(
                projectsData.map(async (project: { _id: string, code: string }) => {
                    const impactResponse = await getProjectImpacts(props.uxpContext, { projectId: project._id });
                    if (!impactResponse.data) {
                        throw new Error(`Failed to fetch impacts for project ${project.code}`);
                    }
                    console.log(`[DEBUG] Detailed project impact for ${project.code}:`, 
                        JSON.stringify(impactResponse.data, null, 2));
                    
                    // Log product structure details if available
                    if (impactResponse.data.products && impactResponse.data.products.length > 0) {
                        console.log(`[DEBUG] First product structure for ${project.code}:`, 
                            Object.keys(impactResponse.data.products[0]).join(', '));
                    }
                    
                    return await impactResponse.data;
                })
            );

            console.log('[DEBUG] All projects with impacts:', projectsWithImpacts);
            setProjects(projectsWithImpacts);
        } catch (err) {
            console.error('Error details:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const getProjects = useCallback(async (page?: number, pageSize?: number, query?: string, filters?: any): Promise<{ items: any[] }> => {
        const { data, error } = await getAllProjects(props.uxpContext, {});

        console.log('[DEBUG] getProjects - Initial projects data:', JSON.stringify(data, null, 2));

        // Then fetch impact data for each project
        const projectsWithImpacts = await Promise.all(
            data.projects.map(async (project: { _id: string, code: string }) => {
                const impactResponse = await getProjectImpacts(props.uxpContext, { projectId: project._id });
                if (!impactResponse.data) {
                    throw new Error(`Failed to fetch impacts for project ${project.code}`);
                }
                console.log(`[DEBUG] getProjects - Impact data for ${project.code}:`, JSON.stringify(impactResponse.data, null, 2));
                
                // Log field structure
                if (impactResponse.data.products && impactResponse.data.products.length > 0) {
                    console.log(`[DEBUG] Project ${project.code} product fields:`, 
                        Object.keys(impactResponse.data.products[0]).join(', '));
                    
                    // Check if code is present
                    console.log(`[DEBUG] Project ${project.code} has product with code:`, 
                        impactResponse.data.products[0].code || 
                        impactResponse.data.products[0].productCode || 
                        'NO_CODE_FOUND');
                }
                
                return await impactResponse.data;
            })
        );
        if (!!error) return { items: [] };
        
        console.log('[DEBUG] getProjects - All project codes:', 
            projectsWithImpacts.map(p => p.projectCode).join(', '));
        
        return { items: projectsWithImpacts };
    }, [])

    const columns = [

        { id: "projectCode", label: "Project Code" },
        { id: "projectName", label: "Project Name" },
        {
            id: "totalProjectImpact",
            label: "Carbon Footprint (KgCO2e)",
            render: (row: ProjectImpact) => `${row.totalProjectImpact.toFixed(2)} KgCO2e`
        },
        {
            id: "totalMaterialsImpact",
            label: "Materials (KgCO2e)",
            render: (row: ProjectImpact) => `${row.totalMaterialsImpact.toFixed(2)} KgCO2e`
        },
        {
            id: "totalManufacturingImpact",
            label: "Manufacturing (KgCO2e)",
            render: (row: ProjectImpact) => `${row.totalManufacturingImpact.toFixed(2)} KgCO2e`
        },
        {
            id: "totalTransportationImpact",
            label: "Transportation (KgCO2e)",
            render: (row: ProjectImpact) => `${row.totalTransportationImpact.toFixed(2)} KgCO2e`
        },
    ];

    if (isLoading) {
        return (
            <WidgetWrapper>
                <TitleBar title='My Projects' />
                <div>Loading...</div>
            </WidgetWrapper>
        );
    }

    if (error) {
        return (
            <WidgetWrapper>
                <TitleBar title='My Projects' />
                <div style={{ color: 'red' }}>{error}</div>
            </WidgetWrapper>
        );
    }

    console.log('[DEBUG] Rendering Projects component, showModal =', showModal);
    
    return (
        <>
            <Modal title="Emission Summary"  show={showModal} onClose={() => setShowModal(false)}>
                {console.log('[DEBUG] Modal is showing:', showModal)}
                {item && console.log('[DEBUG] Raw item data:', JSON.stringify(item, null, 2))}
                {item?.products?.length > 0 && console.log('[DEBUG] Raw product data:', JSON.stringify(item.products[0], null, 2))}
                {item?.products?.length > 0 && console.log('[DEBUG] Available product fields:', 
                    Object.keys(item.products[0]).join(', '))}
                <EmissionSummary
                    plan={plan || 'basic'}
                    product={createProductFromAPI(item)}
                    transportationEmission={
                        item?.products?.[0]?.impacts?.impactByTransportation?.toString() || 
                        item?.totalTransportationImpact?.toString() || 
                        "0"
                    }
                    onBack={() => setShowModal(false)}
                    transportLegs={item?.products?.[0]?.transportationLegs || [{
                        id: 1,
                        transportMode: "Unknown",
                        originGateway: "Unknown", 
                        destinationGateway: "Unknown",
                        transportEmission: item?.totalTransportationImpact || 0
                    }]}
                    uxpContext={props.uxpContext}
                    packageWeight={item?.products?.[0]?.packagingWeight || 0}
                    palletWeight={item?.products?.[0]?.palletWeight || 0}
                    hideHeader={true}
                />
            </Modal>
            <CRUDComponent
                list={{
                    title: 'My Projects',
                    columns: columns,
                    defaultPageSize: 10,
                    data: {
                        getData: getProjects
                    },
                    search: memorizedSearch,
                    onClickRow: (e, item: any) => { 
                        console.log('[DEBUG] Row clicked, raw item data:', JSON.stringify(item, null, 2));
                        
                        // Create a direct product info object for debugging
                        if (item.products && item.products.length > 0) {
                            console.log('[DEBUG] Product fields from API:', 
                                Object.keys(item.products[0]).map(key => `${key}: ${JSON.stringify(item.products[0][key])}`).join('\n'));
                        }
                        
                        // Create a very simple reference to just the original item
                        setItem(item);
                        setShowModal(true);
                    }
                }
                }
            />
        </>
    );
};

export default Projects;