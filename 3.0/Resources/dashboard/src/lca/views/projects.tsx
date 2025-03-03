import React, { useEffect, useState } from "react";
import { TableComponent, TitleBar, WidgetWrapper } from 'uxp/components';
import './projects.scss';
import { IContextProvider } from "@uxp";
import { getAllProjects, getProjectImpacts } from "../../esgnow-service";

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

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            // First get all projects
            const response = await getAllProjects(props.uxpContext);

            const projectsData = await response.data;

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
    const handleClick = (value: string) => {
        console.log(`Clicked value: ${value} KgCO2e`);
        // Perform any action you need here
    };

    const columns = [

        {
            id: "projectCode", label: "Project Code", render: (row: ProjectImpact) => {
                return (
                    <span onClick={() => handleClick(row.projectCode)} style={{ cursor: 'pointer', color: 'blue' }}>
                        {`${row.totalProjectImpact} KgCO2e`}
                    </span>
                );
            }
        },
        { id: "projectName", label: "Project Name" },
        {
            id: "totalProjectImpact",
            label: "Total Impact",
            render: (row: ProjectImpact) => `${row.totalProjectImpact.toFixed(2)} KgCO2e`
        },
        {
            id: "totalMaterialsImpact",
            label: "Impact by Materials",
            render: (row: ProjectImpact) => `${row.totalMaterialsImpact.toFixed(2)} KgCO2e`
        },
        {
            id: "totalManufacturingImpact",
            label: "Impact by Manufacturing",
            render: (row: ProjectImpact) => `${row.totalManufacturingImpact.toFixed(2)} KgCO2e`
        },
        {
            id: "totalTransportationImpact",
            label: "Impact by Transportation",
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
        <WidgetWrapper>
            <TitleBar title='My Projects' />
            <div>
                <TableComponent
                    data={projects}
                    columns={columns}
                    pageSize={10}
                    total={projects.length}
                />
            </div>
        </WidgetWrapper>
    );
};

export default Projects;
