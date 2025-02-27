import { AdditionalConfigurations, IContextProvider, RequestMethod } from '@uxp'
import qs from 'qs'

const ServiceName = 'ESGNOW'
const BaseEndPoint = '/api'

// common function to execute micro service and handle errors 
async function executeRequest(uxpContext: IContextProvider, route: string, method: RequestMethod, params: any, body?: any, headers?: { [key: string]: string }): Promise<{ data: any, error?: string }> {
    try {
        if (!uxpContext) {
            alert('context ')
            return { data: null, error: 'UXP Context is undefined' }
        }

        const additionalHeaders = {
            ...headers,
            'X-IVIVA-TIMEZONE': Intl.DateTimeFormat().resolvedOptions().timeZone
        }

        const additionConfigurations: AdditionalConfigurations = {
            paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
        }

        const response = await uxpContext?.executeComponent(ServiceName, route, method, params, body, additionalHeaders, additionConfigurations)
        return response;
    }
    catch (e) {
        console.error('Request failed. Error: ', e)
        return e;
    }
}

export async function getAllProducts(uxpContext: IContextProvider) {
    return executeRequest(uxpContext, `${BaseEndPoint}/products`, RequestMethod.GET, {});
}

export async function getAllProjects(uxpContext: IContextProvider) {
    return executeRequest(uxpContext, `${BaseEndPoint}/projects`, RequestMethod.GET, {});
}

export async function productCategories(uxpContext: IContextProvider) {
    return executeRequest(uxpContext, `${BaseEndPoint}/productCategories`, RequestMethod.GET, {});
}

export async function  createProduct(uxpContext: IContextProvider , payload: any) {
    return executeRequest(uxpContext, `${BaseEndPoint}/products`, RequestMethod.POST, {},payload);
}

export async function  classifyProduct(uxpContext: IContextProvider , payload: any) {
    return executeRequest(uxpContext, `${BaseEndPoint}/classify-product`, RequestMethod.POST, {},payload);
}

export async function  createProject(uxpContext: IContextProvider , payload: any) {
    return executeRequest(uxpContext, `${BaseEndPoint}/projects`, RequestMethod.POST, {},payload);
}

export async function  createProjectProductMap(uxpContext: IContextProvider , payload: any) {
    return executeRequest(uxpContext, `${BaseEndPoint}/project-product-mapping`, RequestMethod.POST, {},payload);
}
export async function getProjectImpacts(uxpContext: IContextProvider , payload: any) {
    return executeRequest(uxpContext, `${BaseEndPoint}/projects/impacts`, RequestMethod.POST, {}, payload);
}

// Baselines for locations
export async function getLocationData(uxpContext: IContextProvider, location?: string) {
    let { data, error } = await executeRequest(uxpContext, `${BaseEndPoint}/locationdata${location ? '/' + location : ''}`, RequestMethod.GET, {});
    if (error) {
        return { data, error };
    }
    return { data: data, error };
}
export async function updateLocationData(uxpContext: IContextProvider, location: string, locationData: any) {
    return executeRequest(uxpContext, `${BaseEndPoint}/locationdata/${location}`, RequestMethod.PATCH, {}, locationData);

}