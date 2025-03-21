import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CRUDComponent, Modal, TableComponent, TitleBar, WidgetWrapper } from 'uxp/components';
import './projects.scss';
import { IContextProvider } from "@uxp";
import { getAllProjects, getProjectImpacts } from "../../esgnow-service";
import EmissionSummary from "./emission-summary";

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

            const projectsData = await response.data.projects;
            setPlan(response.data.plan.plan);

            // Then fetch impact data for each project
            const projectsWithImpacts = await Promise.all(
                projectsData.map(async (project: { _id: string, code: string }) => {
                    const impactResponse = await getProjectImpacts(props.uxpContext, { projectId: project._id });
                    if (!impactResponse.data) {
                        throw new Error(`Failed to fetch impacts for project ${project.code}`);
                    }
                    return await impactResponse.data;
                })
            );

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


        // Then fetch impact data for each project
        const projectsWithImpacts = await Promise.all(
            data.projects.map(async (project: { _id: string, code: string }) => {
                const impactResponse = await getProjectImpacts(props.uxpContext, { projectId: project._id });
                if (!impactResponse.data) {
                    throw new Error(`Failed to fetch impacts for project ${project.code}`);
                }
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

    return (
        <>
            <Modal title="Emission Summary"  show={showModal} onClose={() => setShowModal(false)}>
                <EmissionSummary
                    plan={plan}
                    product={item?.products?.length > 0 ? item.products[0] : undefined}
                    transportationEmission={item?.products?.length > 0 ? item.products[0].transportationEmission : undefined}
                    onBack={() => {
                        throw new Error("Function not implemented.");
                    }}
                    transportLegs={item?.products?.length > 0 ? item.products[0].transportationLegs : undefined}
                    uxContext={props.uxpContext}
                    packageWeight={item?.products?.length > 0 ? item.products[0].packagingWeight : undefined}
                    palletWeight={item?.products?.length > 0 ? item.products[0].palletWeight : undefined}
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
                    onClickRow: (e, item: any) => { setItem(item); setShowModal(true) }
                }
                }
            />
        </>
    );
};

export default Projects;