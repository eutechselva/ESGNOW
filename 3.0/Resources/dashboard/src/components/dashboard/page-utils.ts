import _ from 'lodash'
import { PageConfiguration, PageLayout, PageLayoutType } from "@types";
import { useContext, useEffect, useState } from "react";
import { UMSContext } from "./UMSContext";
import defaultConfigurations from '../../../../configurations/pages.json'
import { useLocation } from 'react-router-dom';
import { hasValue } from 'widget-designer/components';
import { getSavedPageConfigurations } from '@other-services';
import { toJSON, useToast } from 'uxp/components';

interface PageConfigs {
    [route: string]: PageLayout
}

// Function to match path with config and extract dynamic parameters
export function getPageConfigForRoute(pageConfigs: PageConfigs, path: string): { layout: PageLayout, params: Record<string, string> } {
    // Check for an exact match first
    if (pageConfigs[path]) {
        return { layout: _.cloneDeep(pageConfigs[path]), params: {} };
    }

    // Check for dynamic route matches
    for (const pattern in pageConfigs) {
        // Convert pattern to a regular expression, capturing named parameters
        const paramNames: string[] = [];
        const regexPattern = pattern.replace(/:\w+/g, (match) => {
            paramNames.push(match.substring(1));  // Store the param name without ':'
            return "(\\w+)";
        });

        const regex = new RegExp(`^${regexPattern}$`);
        const match = path.match(regex);

        if (match) {
            // Extract param values from the matched path
            const params = paramNames.reduce((acc, paramName, index) => {
                acc[paramName] = match[index + 1];
                return acc;
            }, {} as Record<string, string>);

            return { layout: _.cloneDeep(pageConfigs[pattern]), params };
        }
    }

    // Return null if no match found
    return { layout: null, params: {} };
}



export const usePageConfiguration = () => {
    const context = useContext(UMSContext)

    const [loadingAllConfiguration, setLoadingAllConfigurations] = useState(false)
    const [allConfigurations, setAllConfigurations] = useState<PageConfigs>({})
    const [loadingPageConfiguration, setLoadingPageConfiguration] = useState(false)
    const [pageConfiguration, setPageConfiguration] = useState<PageConfiguration | null>(null)
    const [currentPage, setCurrentPage] = useState('__home__')

    const currentLocation = useLocation()
    const toast = useToast()

    useEffect(() => {
        loadConfigurations()
    }, [])

    useEffect(() => {
        getPageConfiguration()
    }, [currentLocation, allConfigurations])

    useEffect(() => {
        console.log('configuration', allConfigurations)
    }, [allConfigurations])

    async function loadConfigurations() {
        setLoadingAllConfigurations(true)

        const { data, error } = await getSavedPageConfigurations(context.uxpContext)

        if (!!error) {
            toast.error('Unable to get the saved page configurations')
        }

        const { __home__, ...rest } = _.cloneDeep(defaultConfigurations)

        const allConfigs: PageConfigs = { ...rest as any }

        if (data) {
            for (const { Route, Configuration } of data) {
                allConfigs[Route] = toJSON(Configuration, { type: PageLayoutType.Widgets, widgets: [] })
            }
        }

        allConfigs['__home__'] = allConfigs[__home__.page]

        setAllConfigurations(allConfigs)
        setLoadingAllConfigurations(false)
    }

    function getCurrentPageRoute() {
        const path = (currentLocation?.pathname || '').toLowerCase().replace('/apps/ESGNOW/dashboard', '')
        const _page = hasValue(path) ? path : '__home__'
        return _page
    }

    async function getPageConfiguration() {
        setLoadingPageConfiguration(true)

        const route = getCurrentPageRoute()
        setCurrentPage(route == '__home__' ? defaultConfigurations.__home__.page : route)

        const config = getPageConfigForRoute(allConfigurations, route)
        console.log('loadingPageConfiguration_____', route, config)

        setPageConfiguration(_.cloneDeep(config))
        setLoadingPageConfiguration(false)

    }

    async function refreshConfiguration() {
        loadConfigurations()
    }

    return { loading: loadingAllConfiguration || loadingPageConfiguration, pageConfiguration, currentPage, refreshConfiguration }
}