import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, CRUDComponent, Modal, TitleBar, WidgetWrapper } from 'uxp/components';
import './projects.scss';
import { IContextProvider } from "@uxp";
import { getAllProjects, getProjectImpacts } from "../../esgnow-service";
import EmissionSummary from "./emission-summary";
import { ProductInfoSummary } from "../types/product-info-summary.type";
import ProjectEmissionSummary from "./project-emissions";
import { TransportLeg } from "../types/transport-leg.type";

interface IProjectProps {
    uxpContext?: IContextProvider;
}

interface ProjectImpact {
    _id: string;
    projectCode: string;
    projectName: string;
    totalProjectImpact: number;
    totalMaterialsImpact: number;
    totalManufacturingImpact: number;
    totalTransportationImpact: number;
    products: Array<{
        _id: string;
        productID: string;
        productName: string;
        productCode: string;
        productImage: string;
        packagingWeight: number;
        palletWeight: number;
        transportationLegs: TransportLeg[];
        totalTransportationEmission: number;
        impacts: {
            totalImpact: number;
            impactByMaterials: number;
            impactByManufacturing: number;
            impactByTransportation: number;
        };
    }>;
}


// Create product info from API data for EmissionSummary
const createProductFromAPI = (product: any, project?: any): ProductInfoSummary => {
    if (!product) {
        // Return empty data with proper project code if available
        return {
            _id: project?._id || 'unknown_id',
            name: 'Unknown Product',
            code: project?.projectCode || 'Unknown Code',
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
            materials: [],
            productManufacturingProcess: []
        };
    }

    // Log exact field values to check what's available
    console.log('[DEBUG] Available product fields:', Object.keys(product).join(', '));

    // Get the product code from various possible sources
    console.log('[DEBUG] Looking for product code:', product.code, product.productCode);

    // Try various ways to get the code
    let code = 'Unknown Code';
    if (product.code && product.code !== '') {
        code = product.code;
    } else if (product.productCode && product.productCode !== '') {
        code = product.productCode;
    } else if (project?.projectCode && project.projectCode !== '') {
        code = project.projectCode;
    }

    // Create a ProductInfoSummary object with all required fields
    return {
        _id: product._id || product.productID || 'unknown_id',
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
};

const Projects: React.FC<IProjectProps> = (props) => {
    const [projects, setProjects] = useState<ProjectImpact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [plan, setPlan] = useState<string | null>(null);
    const [useMultiProductView, setUseMultiProductView] = useState(true);

    const memorizedSearch = useMemo(() => ({ enabled: true }), []);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
    

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

                return await impactResponse.data;
            })
        );
        if (!!error) return { items: [] };

        return { items: projectsWithImpacts };
    }, [])

    const columns = [
        { id: "projectCode", label: "Project Code" },
        { id: "projectName", label: "Project Name" },
        {
            id: "totalProjectImpact",
            label: "Carbon Footprint (KgCO₂e)",
            render: (row: ProjectImpact) => `${row.totalProjectImpact.toFixed(3)} KgCO₂e`
        },
        {
            id: "totalMaterialsImpact",
            label: "Materials (KgCO₂e)",
            render: (row: ProjectImpact) => `${row.totalMaterialsImpact.toFixed(3)} KgCO₂e`
        },
        {
            id: "totalManufacturingImpact",
            label: "Manufacturing (KgCO₂e)",
            render: (row: ProjectImpact) => `${row.totalManufacturingImpact.toFixed(3)} KgCO₂e`
        },
        {
            id: "totalTransportationImpact",
            label: "Transportation (KgCO₂e)",
            render: (row: ProjectImpact) => `${row.totalTransportationImpact.toFixed(3)} KgCO₂e`
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

    function confirmDeleteProject(): void {
        throw new Error("Function not implemented.");
    }

    const handleDeleteProject = (projectId: string) => {
        setProjectToDelete(projectId);
        setShowDeleteConfirm(true);
    };

    return (
        <>
            <Modal
                title="Project Emission Summary"
                show={showModal}
                onClose={() => setShowModal(false)}
                className="esgnow-project-modal"
            >
                <div className="esgnow-delete-header">
                 <Button
                    title="Delete"
                    onClick={() => handleDeleteProject(selectedProject._id)}
                    className="esgnow-delete-button"
                />
               
               </div>
                {useMultiProductView && selectedProject && selectedProject.products && selectedProject.products.length > 0 ? (
                    <ProjectEmissionSummary
                        project={selectedProject}
                        uxpContext={props.uxpContext}
                        onBack={() => setShowModal(false)}
                        hideHeader={true}
                        plan={plan || 'basic'}
                    />
                ) : (
                    selectedProject && selectedProject.products && selectedProject.products.length > 0 && (
                        <EmissionSummary
                            plan={plan || 'basic'}
                            product={createProductFromAPI(selectedProject.products[0], selectedProject)}
                            transportationEmission={
                                selectedProject?.products[0]?.totalTransportationEmission?.toString() ||
                                selectedProject?.products[0]?.impacts?.impactByTransportation?.toString() ||
                                selectedProject?.totalTransportationImpact?.toString() ||
                                "0"
                            }
                            onBack={() => setShowModal(false)}
                            transportLegs={selectedProject?.products[0]?.transportationLegs || [{
                                id: 1,
                                transportMode: "Unknown",
                                originCountry: "Unknown",
                                originGateway: "Unknown",
                                destinationCountry: "Unknown",
                                destinationGateway: "Unknown",
                                transportEmission: selectedProject?.totalTransportationImpact || 0
                            }]}
                            uxpContext={props.uxpContext}
                            packageWeight={selectedProject?.products[0]?.packagingWeight || 0}
                            palletWeight={selectedProject?.products[0]?.palletWeight || 0}
                            hideHeader={true}
                        />

                    )

                )}

            </Modal>

            {showDeleteConfirm && (
                <Modal
                    show={showDeleteConfirm}
                    title="Confirm Deletion"
                    onClose={() => setShowDeleteConfirm(false)}
                    className="esgnow-delete-modal"
                >
                    <div className="esgnow-delete-confirmation">
                        <div className="esgnow-warning-icon">⚠️</div>
                        <p>Are you sure you want to delete this project?</p>
                        <p className="esgnow-delete-warning">This action cannot be undone.</p>
                        <div className="esgnow-modal-actions">
                            <Button 
                                title="Cancel" 
                                onClick={() => setShowDeleteConfirm(false)} 
                                className="esgnow-cancel-button"
                            >
                                Cancel
                            </Button>
                            <Button 
                                title="Delete" 
                                onClick={confirmDeleteProject} 
                                className="esgnow-confirm-button"
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
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

                        // Check if this project has multiple products
                        const hasMultipleProducts = item.products && item.products.length > 1;
                        console.log(`[DEBUG] Project has ${item.products?.length || 0} products. Using multi-product view: ${hasMultipleProducts}`);

                        // Use the multi-product view for projects with multiple products
                        setUseMultiProductView(hasMultipleProducts);
                        setSelectedProject(item);
                        setShowModal(true);
                    }
                }}
            />
        </>
    );
};

export default Projects;