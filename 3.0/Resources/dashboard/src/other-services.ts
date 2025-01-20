
import { App, ILocation, IUMSContext, PageLayout } from '@types'
import { getLocationData } from '@ums-service'
import { IContextProvider } from '@uxp'

export async function getAllLocations(uxpContext: IContextProvider): Promise<{ data: any, error?: string }> {
    try {
        const response = await uxpContext?.executeService('Location', 'Location:All', { max: 10000 }, { json: true })
        // append baselines 
        const { data, error } = await getLocationData(uxpContext)
        if (!!data) {
            for (const l of response) {
                const baselineConfig = (data || []).find((d: any) => (d.locationId == l.LocationKey))
                l.baselines = baselineConfig?.baselines || {}
            }
        }

        console.log('data_location_baseline', response)

        return { data: response, error: null }
    }
    catch (e) {
        console.error('Unable to get locations. error: ', e)
        return { error: 'Something went wrong', data: null }
    }
}

export async function getAllApps(uxpContext: IContextProvider): Promise<{ data: App[], error?: string }> {
    try {

        const res = await uxpContext.executeService('UMS', 'GetAllApps', {}, { json: true })
        console.log(res, 'installed_apps')
        return { data: res, error: null }
    }
    catch (e) {
        console.error('Unable to get locations. error: ', e)
        return { error: 'Something went wrong', data: null }
    }
}

export async function getLayoutConfigurationsById(uxpContext: IContextProvider, id: string): Promise<{ data: any, error?: string }> {
    try {
        const res = await uxpContext.executeService('UMS', 'LayoutConfiguration:GetConfigurationByID', { 'ID': id }, { json: true })
        return { data: res?.[0], error: null }
    }
    catch (e) {
        console.error('Unable to get saved configuration. error: ', e)
        return { error: 'Something went wrong', data: null }
    }
}

export async function saveLayoutConfigurationsById(uxpContext: IContextProvider, id: string, configuration: any): Promise<{ data: any[], error?: string }> {
    try {
        const paramas: any = {
            ID: id,
            Configuration: JSON.stringify(configuration)
        }
        const res = await uxpContext.executeService('UMS', 'LayoutConfiguration:SaveLayoutConfig', paramas, { json: true })
        return { data: res, error: null }
    }
    catch (e) {
        console.error('Unable to get save layout configuration. error: ', e)
        return { error: 'Something went wrong', data: null }
    }
}

export async function getSavedPageConfigurations(uxpContext: IContextProvider): Promise<{ data: any[], error?: string }> {
    try {
        const res = await uxpContext.executeService('UMS', 'PageConfig:All', {}, { json: true })
        return { data: res, error: null }
    }
    catch (e) {
        console.error('Unable to get saved configuration. error: ', e)
        return { error: 'Something went wrong', data: null }
    }
}

export async function savePageConfiguration(uxpContext: IContextProvider, route: string, configuration: PageLayout): Promise<{ data: any[], error?: string }> {
    try {
        const paramas: any = {
            Route: route,
            Configuration: JSON.stringify(configuration)
        }
        const res = await uxpContext.executeService('UMS', 'PageConfig:SavePageConfig', paramas, { json: true })
        return { data: res, error: null }
    }
    catch (e) {
        console.error('Unable to save configuration. error: ', e)
        return { error: 'Something went wrong', data: null }
    }
}