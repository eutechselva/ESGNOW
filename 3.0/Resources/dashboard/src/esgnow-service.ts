import {
  AdditionalConfigurations,
  IContextProvider,
  RequestMethod,
} from "@uxp";
import qs from "qs";

const ServiceName = "ESGNOW";
const BaseEndPoint = "/api";

// common function to execute micro service and handle errors
async function executeRequest(
  uxpContext: IContextProvider,
  route: string,
  method: RequestMethod,
  params: any,
  body?: any,
  headers?: { [key: string]: string }
): Promise<{ data: any; error?: string }> {
  try {
    if (!uxpContext) {
      alert("context ");
      return { data: null, error: "UXP Context is undefined" };
    }

    const additionalHeaders = {
      ...headers,
      "X-IVIVA-TIMEZONE": Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    const additionConfigurations: AdditionalConfigurations = {
      paramsSerializer: (params) =>
        qs.stringify(params, { arrayFormat: "repeat" }),
    };

    const response = await uxpContext?.executeComponent(
      ServiceName,
      route,
      method,
      params,
      body,
      additionalHeaders,
      additionConfigurations
    );
    return response;
  } catch (e) {
    console.error("Request failed. Error: ", e);
    return e;
  }
}

export async function getAllProducts(uxpContext: IContextProvider) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/products`,
    RequestMethod.GET,
    {}
  );
}

export async function getAllProjects(
  uxpContext: IContextProvider,
  payload: any
) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/projects`,
    RequestMethod.GET,
    {},
    payload
  );
}

export async function home(uxpContext: IContextProvider) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/home`,
    RequestMethod.GET,
    {}
  );
}

export async function productCategories(uxpContext: IContextProvider) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/productCategories`,
    RequestMethod.GET,
    {}
  );
}

export async function transportDB(uxpContext: IContextProvider) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/transportDB`,
    RequestMethod.GET,
    {}
  );
}

export async function createProduct(
  uxpContext: IContextProvider,
  payload: any
) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/products`,
    RequestMethod.POST,
    {},
    payload
  );
}

export async function classifyProduct(
  uxpContext: IContextProvider,
  payload: any
) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/classify-product`,
    RequestMethod.POST,
    {},
    payload
  );
}

export async function createProject(
  uxpContext: IContextProvider,
  payload: any
) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/projects`,
    RequestMethod.POST,
    {},
    payload
  );
}

export async function createProjectProductMap(
  uxpContext: IContextProvider,
  payload: any
) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/project-product-mapping`,
    RequestMethod.POST,
    {},
    payload
  );
}
export async function getProjectImpacts(
  uxpContext: IContextProvider,
  payload: any
) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/projects/impacts`,
    RequestMethod.POST,
    {},
    payload
  );
}

export async function classifyBOM(uxpContext: IContextProvider, payload: any) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/classify-bom`,
    RequestMethod.POST,
    {},
    payload
  );
}

export async function deleteProductByID(
  uxpContext: IContextProvider,
  payload: any
) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/products/delete-product-by-id`,
    RequestMethod.POST,
    {},
    payload
  );
}

export async function classifyManufacturingProcess(
  uxpContext: IContextProvider,
  payload: any
) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/classify-manufacturing-process`,
    RequestMethod.POST,
    {},
    payload
  );
}

export async function calculateTransportDistance(
  uxpContext: IContextProvider,
  payload: any
) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/distance`,
    RequestMethod.POST,
    {},
    payload
  );
}

export async function calculateTransportEmission(
  uxpContext: IContextProvider,
  payload: any
) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/calculate-transport-emission`,
    RequestMethod.POST,
    {},
    payload
  );
}

export async function projectProductMapping(
  uxpContext: IContextProvider,
  payload: any
) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/project-product-mapping`,
    RequestMethod.POST,
    {},
    payload
  );
}

export async function bulkUpload(uxpContext: IContextProvider, payload: any) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/products/bulk-upload`,
    RequestMethod.POST,
    {},
    payload
  );
}

export async function bulkImageUpload(uxpContext: IContextProvider, payload: any) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/products/bulk-image-upload`,
    RequestMethod.POST,
    {},
    payload
  );
}

export async function getBillOfMaterials(uxpContext: IContextProvider) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/bill-of-materials`,
    RequestMethod.GET,
    {}
  );
}

export async function getManufacturingProcesses(uxpContext: IContextProvider) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/manufacturingProcesses`,
    RequestMethod.GET,
    {}
  );
}

export async function getAccountPlan(uxpContext: IContextProvider) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/account-plan`,
    RequestMethod.GET,
    {}
  );
}

// Baselines for locations
export async function getLocationData(
  uxpContext: IContextProvider,
  location?: string
) {
  let { data, error } = await executeRequest(
    uxpContext,
    `${BaseEndPoint}/locationdata${location ? "/" + location : ""}`,
    RequestMethod.GET,
    {}
  );
  if (error) {
    return { data, error };
  }
  return { data: data, error };
}
export async function updateLocationData(
  uxpContext: IContextProvider,
  location: string,
  locationData: any
) {
  return executeRequest(
    uxpContext,
    `${BaseEndPoint}/locationdata/${location}`,
    RequestMethod.PATCH,
    {},
    locationData
  );
}
