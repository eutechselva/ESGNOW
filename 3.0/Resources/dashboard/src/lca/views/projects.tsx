import React from "react";
import {TableComponent, TitleBar, WidgetWrapper} from 'uxp/components';
import './projects.scss';
import { IContextProvider } from "@uxp";


interface IProjectProps {
    uxpContext?: IContextProvider;
}

const Projects: React.FC <IProjectProps> = (props) => {
  const data = [
    {
      id: 1,
      productImage: "image-url",
      projectCode: "1",
      projectName: "Project Alpha",
      totalImpact: "60 KgCO2e",
      impactMaterials: "20 KgCO2e",
      impactManufacturing: "20 KgCO2e",
      impactTransportation: "20 KgCO2e",
    },
    {
      id: 2,
      productImage: "image-url",
      projectCode: "2",
      projectName: "Project Beta",
      totalImpact: "60 KgCO2e",
      impactMaterials: "20 KgCO2e",
      impactManufacturing: "20 KgCO2e",
      impactTransportation: "20 KgCO2e",
    },
    {
        id: 3,
        productImage: "image-url",
        projectCode: "3",
        projectName: "Project Gama",
        totalImpact: "60 KgCO2e",
      impactMaterials: "20 KgCO2e",
      impactManufacturing: "20 KgCO2e",
      impactTransportation: "20 KgCO2e",
      },
      {
        id: 4,
        productImage: "image-url",
        projectCode: "4",
        projectName: "Project Gama",
        totalImpact: "60 KgCO2e",
      impactMaterials: "20 KgCO2e",
      impactManufacturing: "20 KgCO2e",
      impactTransportation: "20 KgCO2e",
      },
   
  ];

  const columns = [
    { id: "productImage", label: "Product Image", render: (row: any) => <img src={row.productImage} alt="Product" style={{ width: 50, height: 50, borderRadius: 4 }} /> },
    { id: "projectCode", label: "Project Code" },
    { id: "projectName", label: "Project Name" },
    { id: "totalImpact", label: "Total Impact" },
    { id: "impactMaterials", label: "Impact by Materials" },
    { id: "impactManufacturing", label: "Impact by Manufacturing" },
    { id: "impactTransportation", label: "Impact by Transportation" },
  ];

  return (
    <WidgetWrapper>
        <TitleBar title='My Projects' />
    <div>
      <TableComponent data={data} columns={columns} pageSize={10} total={data.length} />
    </div>
    </WidgetWrapper>
  );
};

export default Projects;
