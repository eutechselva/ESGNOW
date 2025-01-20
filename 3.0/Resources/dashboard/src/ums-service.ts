import { BaseTag, Tag, UtilityMeterType } from '@types'
import { AdditionalConfigurations, IContextProvider, RequestMethod } from '@uxp'
import qs from 'qs'

const ServiceName = 'UMS'
const BaseEndPoint = '/api/v1'

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

        const additionaConfigurations: AdditionalConfigurations = {
            paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
        }

        const response = await uxpContext?.executeComponent(ServiceName, route, method, params, body, additionalHeaders, additionaConfigurations)
        return { data: response }
    }
    catch (e) {
        console.error('Request failed. Error: ', e)
        return { data: null, error: 'Something went wrong' }
    }
}



// Tags endpoint
const TagsEndpoint = 'tags';

// Tags API functions
export async function getAllTags(uxpContext: IContextProvider) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${TagsEndpoint}`, RequestMethod.GET, {});
}

export async function getTagHierarchy(uxpContext: IContextProvider) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${TagsEndpoint}/hierarchy`, RequestMethod.GET, {});
}

export async function createTag(uxpContext: IContextProvider, tag: BaseTag, baselines: any) {
    let { data, error } = await executeRequest(uxpContext, `${BaseEndPoint}/${TagsEndpoint}`, RequestMethod.POST, {}, tag);
    if (error || !baselines) {
        return { data, error };
    }
    let id = data.id;
    await executeRequest(uxpContext, `${BaseEndPoint}/${TagsEndpoint}/${id}/baselines`, RequestMethod.PATCH, {}, baselines);
    return { data, error };
}

export async function updateTag(uxpContext: IContextProvider, id: string, tagData: any) {
    let { data, error } = await executeRequest(uxpContext, `${BaseEndPoint}/${TagsEndpoint}/${id}`, RequestMethod.PATCH, {}, tagData);
    if (error || !tagData.baselines) {
        return { data, error };
    }
    await executeRequest(uxpContext, `${BaseEndPoint}/${TagsEndpoint}/${id}/baselines`, RequestMethod.PATCH, {}, tagData.baselines);
    return { data, error };

}

export async function deleteTag(uxpContext: IContextProvider, id: string) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${TagsEndpoint}/${id}`, RequestMethod.DELETE, {});
}

// Get One
export async function getOneTag(uxpContext: IContextProvider, id: string) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${TagsEndpoint}/${id}`, RequestMethod.GET, {});
}

// Delete By Type
export async function deleteByTagType(uxpContext: IContextProvider, type: string) {
    // return executeRequest(uxpContext, `${BaseEndPoint}/${TagsEndpoint}/type/${type}`, RequestMethod.DELETE, {});
    return executeRequest(uxpContext, `${BaseEndPoint}/${TagsEndpoint}`, RequestMethod.DELETE, { type });
}


export function groupTagsByType(tags: Tag[]): { grouped: { [type: string]: Tag[] }, types: string[] } {
    const tagGroups: { [type: string]: Tag[] } = {}

    for (const t of tags) {
        if (!tagGroups?.[t.type]) tagGroups[t.type] = []
        tagGroups[t.type].push(t)
    }

    return { grouped: tagGroups, types: Object.keys(tagGroups) }
}


// merter types 
// Endpoint for utility meter types
const UtilityMeterTypesEndpoint = 'utilitymetertypes';
// Get all utility meter types
export async function getAllUtilityMeterTypes(uxpContext: IContextProvider) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${UtilityMeterTypesEndpoint}`, RequestMethod.GET, {});
}

export function getBaseUnit(type: UtilityMeterType) {
    if (!type) {
        return '';
    }
    let units = Object.keys(type.unitConversion);
    for (let unit of units) {
        if (type.unitConversion[unit] == 1) return unit;
    }
    return units[0];

}

// Create a new utility meter type
export async function createUtilityMeterType(uxpContext: IContextProvider, data: any) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${UtilityMeterTypesEndpoint}`, RequestMethod.POST, {}, data);
}

// Update a utility meter type
export async function updateUtilityMeterType(uxpContext: IContextProvider, name: string, data?: any) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${UtilityMeterTypesEndpoint}/${name}`, RequestMethod.PATCH, {}, data);
}

// Delete a utility meter type
export async function deleteUtilityMeterType(uxpContext: IContextProvider, name: string) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${UtilityMeterTypesEndpoint}/${name}`, RequestMethod.DELETE, {});
}

// Get one utility meter type by name
export async function getUtilityMeterType(uxpContext: IContextProvider, name: string) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${UtilityMeterTypesEndpoint}/${name}`, RequestMethod.GET, {});
}


// merters 
// Endpoint for utility meters
const MetersEndpoint = 'utilitymeters';
// Get all meters
export async function getAllMeters(uxpContext: IContextProvider, params?: any) {
    params = params || {};
    params['limit'] = 1000;

    return executeRequest(uxpContext, `${BaseEndPoint}/${MetersEndpoint}`, RequestMethod.GET, params);
}

// Create a new meter
export async function createMeter(uxpContext: IContextProvider, data: any) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${MetersEndpoint}`, RequestMethod.POST, {}, data);
}

// Update a meter
export async function updateMeter(uxpContext: IContextProvider, id: string, data: any, dataRegenerationDate?: Date) {
    let qs = {};
    if (dataRegenerationDate) {
        let start = dataRegenerationDate.toISOString();
        let stop = new Date().toISOString();
        let isChange = 1;
        qs = { isChange, start, stop };
    }
    return executeRequest(uxpContext, `${BaseEndPoint}/${MetersEndpoint}/${id}`, RequestMethod.PATCH, qs, data);
}

// Delete a meter
export async function deleteMeter(uxpContext: IContextProvider, id: string) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${MetersEndpoint}/${id}`, RequestMethod.DELETE, {});
}

// Get one meter by name
export async function getMeterDetails(uxpContext: IContextProvider, id: string) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${MetersEndpoint}/${id}`, RequestMethod.GET, {});
}

// Get the last reading of a meter
export async function getLastReading(uxpContext: IContextProvider, id: string) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${MetersEndpoint}/reading/${id}/last`, RequestMethod.GET, {});
}

// Record meter readings
export async function recordMeterReading(uxpContext: IContextProvider, id: string, data: any) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${MetersEndpoint}/${id}/reading`, RequestMethod.POST, {}, data);
}

// Record meter consumptions
export async function recordMeterConsumptions(uxpContext: IContextProvider, data: any) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${MetersEndpoint}/reading`, RequestMethod.POST, {}, data);
}



// virtual merters 
// Endpoint for virtual meters
const VirtualMetersEndpoint = 'virtualmeters';

// Get all virtual meters
export async function getAllVirtualMeters(uxpContext: IContextProvider, params?: any) {
    params = params || {};
    params['limit'] = 1000;

    return executeRequest(uxpContext, `${BaseEndPoint}/${VirtualMetersEndpoint}`, RequestMethod.GET, params);
}

// Create a new virtual meter
export async function createVirtualMeter(uxpContext: IContextProvider, data: any) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${VirtualMetersEndpoint}`, RequestMethod.POST, {}, data);
}

// Update a virtual meter
export async function updateVirtualMeter(uxpContext: IContextProvider, id: string, data?: any, dataRegenerationDate?: Date) {
    let qs = {};
    if (dataRegenerationDate) {
        let start = dataRegenerationDate.toISOString();
        let stop = new Date().toISOString();
        let isChange = 1;
        qs = { isChange, start, stop };
    }
    return executeRequest(uxpContext, `${BaseEndPoint}/${VirtualMetersEndpoint}/${id}`, RequestMethod.PATCH, qs, data);
}

// Delete a virtual meter
export async function deleteVirtualMeter(uxpContext: IContextProvider, id: string) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${VirtualMetersEndpoint}/${id}`, RequestMethod.DELETE, {});
}

// Get one virtual meter by name
export async function getVirtualMeterDetails(uxpContext: IContextProvider, id: string) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${VirtualMetersEndpoint}/${id}`, RequestMethod.GET, {});
}

// Get the last reading of a virtual meter
export async function getLastVirtualMeterReading(uxpContext: IContextProvider, id: string) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${VirtualMetersEndpoint}/reading/${id}/last`, RequestMethod.GET, {});
}


const MeterGroupsEndpoint = 'metergroups';


export async function getAllMeterGroups(context: IContextProvider, params?: any) {
    params = params || {};
    params['limit'] = 1000;

    return executeRequest(context, `${BaseEndPoint}/${MeterGroupsEndpoint}`, RequestMethod.GET, params);
}

export async function createMeterGroup(context: IContextProvider, data: any) {
    return executeRequest(context, `${BaseEndPoint}/${MeterGroupsEndpoint}`, RequestMethod.POST, {}, data);
}

export async function updateMeterGroup(context: IContextProvider, id: string, data: any, dataRegenerationDate?: Date) {
    let qs = {};
    if (dataRegenerationDate) {
        let start = dataRegenerationDate.toISOString();
        let stop = new Date().toISOString();
        let isChange = 1;
        qs = { isChange, start, stop };
    }
    return executeRequest(context, `${BaseEndPoint}/${MeterGroupsEndpoint}/${id}`, RequestMethod.PATCH, qs, data);
}
export async function flattenMeterGroup(uxpContext: IContextProvider, members: { id: string }[]) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${MeterGroupsEndpoint}/flatten`, RequestMethod.POST, {}, { members });
}

export async function getMeterGroupDetails(context: IContextProvider, id: string) {
    return executeRequest(context, `${BaseEndPoint}/${MeterGroupsEndpoint}/${id}`, RequestMethod.GET, {});
}

export async function getLastMeterGroupReading(context: IContextProvider, id: string) {
    return executeRequest(context, `${BaseEndPoint}/${MeterGroupsEndpoint}/reading/${id}/last`, RequestMethod.GET, {});
}

export async function deleteMeterGroup(context: IContextProvider, id: string) {
    return executeRequest(context, `${BaseEndPoint}/${MeterGroupsEndpoint}/${id}`, RequestMethod.DELETE, {});
}

// Baseline configuration end points
const BaselineTypesEndpoint = 'baselinetypes';
export async function getAllBaselineTypes(context: IContextProvider) {
    return executeRequest(context, `${BaseEndPoint}/${BaselineTypesEndpoint}`, RequestMethod.GET, {});
}

// Create a new utility meter type
export async function createBaselineType(uxpContext: IContextProvider, name: string) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${BaselineTypesEndpoint}`, RequestMethod.POST, {}, { name, duration: 24 });
}

// Update a utility meter type
export async function updateBaselineType(uxpContext: IContextProvider, id: string, name: string) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${BaselineTypesEndpoint}/${id}`, RequestMethod.PATCH, {}, { name });
}

// Delete a utility meter type
export async function deleteBaselineType(uxpContext: IContextProvider, id: string) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${BaselineTypesEndpoint}/${id}`, RequestMethod.DELETE, {});
}

// Get one utility meter type by name
export async function getBaselineType(uxpContext: IContextProvider, id: string) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${BaselineTypesEndpoint}/${id}`, RequestMethod.GET, {});
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


// Endpoint for meter consumption
const MeterConsumptionEndpoint = 'consumption';

// Get consumption for a specific meter type and meter ID
interface ConsumptionParams {
    start: string
    bucket: string
    end?: string,
    aggregate?: string,
    unit?: string
}
export async function getMeterConsumption(context: IContextProvider, utilityType: string, meterId: string, params: ConsumptionParams) {
    return executeRequest(context, `${BaseEndPoint}/${MeterConsumptionEndpoint}/${utilityType}/meter/${meterId}`, RequestMethod.GET, params, {});
}


// analytics 
const AnalyticsEndPoint = 'analytics'

export interface MeterAnalyticsParams {
    start: string,
    end: string,
    bucket: string,
    group?: string,
    groupType?: string
    unit?: string
}
export async function getAnalyticsForMeter(context: IContextProvider, meterType: string, meterId: string, params: MeterAnalyticsParams) {
    return executeRequest(context, `${BaseEndPoint}/${AnalyticsEndPoint}/${meterType}/${meterId}`, RequestMethod.GET, params, {});
}

export interface TagAnalyticsParams extends Omit<MeterAnalyticsParams, "group"> {
    tagGroup: string
}

interface Tags {
    [type: string]: string
}
export async function getAnalyticsForTags(context: IContextProvider, utilityType: string, params: TagAnalyticsParams, tags: Tags) {
    return executeRequest(context, `${BaseEndPoint}/${AnalyticsEndPoint}/${utilityType}/tags`, RequestMethod.POST, params, tags);
}


// Queue endpoint
const QueueEndpoint = 'queue';

export async function getPendingQueueForChanges(uxpContext: IContextProvider) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${QueueEndpoint}/pending`, RequestMethod.GET, {});
}
export async function getDoneQueue(uxpContext: IContextProvider) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${QueueEndpoint}/done`, RequestMethod.GET, {});
}
export async function getErrorQueue(uxpContext: IContextProvider) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${QueueEndpoint}/error`, RequestMethod.GET, {});
}
export async function deleteDoneQueue(uxpContext: IContextProvider) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${QueueEndpoint}/done/all`, RequestMethod.DELETE, {});
}
export async function deleteErrorQueue(uxpContext: IContextProvider) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${QueueEndpoint}/error/all`, RequestMethod.DELETE, {});
}

// Metadata type endpoint
const MetadataTypeEndpoint = 'metadatatypes';

export async function getAllMetadataTypes(context: IContextProvider, params?: any) {
    return executeRequest(context, `${BaseEndPoint}/${MetadataTypeEndpoint}`, RequestMethod.GET, params);
}

export async function createMetadataType(uxpContext: IContextProvider, data: any) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${MetadataTypeEndpoint}`, RequestMethod.POST, {}, { ...data });
}

export async function updateMetadataType(uxpContext: IContextProvider, id: string, data: any) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${MetadataTypeEndpoint}/${id}`, RequestMethod.PATCH, {}, { ...data });
}

export async function deleteMetadataType(uxpContext: IContextProvider, id: string) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${MetadataTypeEndpoint}/${id}`, RequestMethod.DELETE, {});
}

export async function getMetadataType(uxpContext: IContextProvider, id: string) {
    return executeRequest(uxpContext, `${BaseEndPoint}/${MetadataTypeEndpoint}/${id}`, RequestMethod.GET, {});
}

const ReportEndpoint = "reports"

export async function createReport(context: IContextProvider, data: any) {
    return executeRequest(context, `${BaseEndPoint}/${ReportEndpoint}`, RequestMethod.POST, {}, data);
}

export async function getReports(context: IContextProvider) {
    return executeRequest(context, `${BaseEndPoint}/${ReportEndpoint}`, RequestMethod.GET, {});
}

export async function deleteReports(context: IContextProvider, id: string) {
    return executeRequest(context, `${BaseEndPoint}/${ReportEndpoint}/${id}`, RequestMethod.DELETE, {});
}