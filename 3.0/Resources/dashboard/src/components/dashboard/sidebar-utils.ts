import { joinParts } from "@utils"
import { IContextProvider } from "@uxp"
import { useContext, useEffect, useState } from "react"
import { hasValue, toJSON, useToast } from "uxp/components"
import { UMSContext } from "./UMSContext"
import defaultItems from '../../../../configurations/sidebarlinks.json'
import { useHistory } from "react-router-dom"
import { getLayoutConfigurationsById } from "@other-services"
import _ from 'lodash'

export interface StaticLinkBase {
    id: string,
    label: string,
    icon: string,
    dashboardKey: string | null,
    userRoles: string[]
}
export interface StaticRootLink extends StaticLinkBase {
    isGroupLink?: boolean,
    children?: (StaticLinkBase | DynamicChildLink)[]
}


export interface ActionSource {
    type: 'action',
    model: string,
    action: string,
    params: { [key: string]: string }
}

export interface ServiceSource {
    type: 'service',
    app: string,
    service: string,
    params: { [key: string]: any }
}

export interface ComponentSource {
    type: 'component',
    name: string,
    route: string,
    method: string,
    params: { [key: string]: any }
}

export type SidebarLinkDataSource = ComponentSource | ActionSource | ServiceSource

export interface DynamicLinkBaseConfiguration {
    idField: string,
    labelField: string,
    iconField: string,
    userRoles: string[]
    dashboardKeyField: string,
}
export interface DynamicRootLinkConfiguration extends DynamicLinkBaseConfiguration {
    isGroupLink?: boolean,
    children?: (DynamicChildLink | StaticLinkBase)[]
}

export interface DynamicLinkBase {
    id: '__dynamic_link__',
    source: SidebarLinkDataSource,
    dashboardKey: string,
}

export interface DynamicRootLink extends DynamicLinkBase {
    configuration: DynamicRootLinkConfiguration
}

export interface DynamicChildLink extends DynamicLinkBase {
    configuration: DynamicLinkBaseConfiguration
}

export type PartialSidebarLink = StaticRootLink | DynamicRootLink

export interface SidebarLinkBase {
    id: string,
    label: string,
    icon: string,
    userRoles: string[]
    click?: (SidebarLink: SidebarLink) => void,
    linkPath?: string // just for debugging
}
export interface SidebarLink extends SidebarLinkBase {
    isGroupLink: boolean
    children: SidebarLinkBase[]
}


export async function processPartialLinksToSidebarLinks(
    conetxt: IContextProvider,
    partialLinks: (StaticRootLink | StaticLinkBase | DynamicRootLink | DynamicLinkBase)[],
    onClickSidebarLink: (pathToGoTo: string) => void,
    parentPath?: string
) {
    async function updateSidebarLink(link: StaticRootLink | StaticLinkBase): Promise<SidebarLink | SidebarLinkBase> {
        const hasPath = hasValue(link.dashboardKey);
        const linkPath = joinParts([parentPath, link.dashboardKey], '/', true);

        const processed: SidebarLink | SidebarLinkBase = {
            id: link.id,
            label: conetxt.$L(link.label),
            icon: link.icon || '',
            userRoles: link.userRoles || [],
            linkPath: linkPath
        };

        if (hasPath) processed.click = () => onClickSidebarLink(linkPath);

        if ((link as StaticRootLink).isGroupLink && (link as StaticRootLink)?.children?.length > 0) {
            const processedChildLinks: (SidebarLink | SidebarLinkBase)[] = await processPartialLinksToSidebarLinks(
                conetxt,
                (link as StaticRootLink).children || [],
                onClickSidebarLink,
                linkPath
            );

            (processed as SidebarLink).isGroupLink = true;
            (processed as SidebarLink).children = processedChildLinks;

            delete processed.click; // remove click event if its a group
        }

        return processed;
    }

    async function processDynamicItems(link: DynamicRootLink | DynamicChildLink, items: any[]) {
        const parsed = (items || []).map((item: any) => {
            const { idField, labelField, dashboardKeyField, iconField, userRoles } = link.configuration;

            const _tmp: StaticRootLink | StaticLinkBase = {
                id: `${link.id}_${item[idField] || ''}`,
                label: item[labelField] || '',
                icon: item[iconField] || '',
                dashboardKey: item[dashboardKeyField] || '',
                userRoles: userRoles || [],
            };

            if ((link as DynamicRootLink)?.configuration?.isGroupLink) {
                (_tmp as StaticRootLink).isGroupLink = true;
                (_tmp as StaticRootLink).children = (link as DynamicRootLink)?.configuration?.children || [];
            }

            return _tmp;
        });

        console.log('Parsed Dynamic Items:', parsed);

        const dynamicLinkParent = joinParts([parentPath, link.dashboardKey], '/', true)
        const _processedLinks = await processPartialLinksToSidebarLinks(conetxt, parsed, onClickSidebarLink, dynamicLinkParent);
        console.log('Processed Dynamic Links:', _processedLinks);
        return _processedLinks; // Ensure this is returned
    }

    async function getItemsFromSource(source: SidebarLinkDataSource) {
        try {
            let data: any;
            switch (source.type) {
                case 'action':
                    const actionSource = source as ActionSource;
                    data = await conetxt.executeAction(actionSource.model, actionSource.action, actionSource.params || {}, { json: true });
                    break;

                case 'service':
                    const serviceSource = source as ServiceSource;
                    data = await conetxt.executeAction(serviceSource.app, serviceSource.service, serviceSource.params || {}, { json: true });
                    break;

                case 'component':
                    const componentSource = source as ComponentSource;
                    data = await conetxt.executeComponent(componentSource.name, componentSource.route, componentSource.method as any, componentSource.params || {});
                    break;

                default:
                    return [];
            }

            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.error('Unable to get items', e);
            return [];
        }
    }

    const processedLinks: (SidebarLink | SidebarLinkBase)[] = [];

    for (const value of (partialLinks || [])) {
        if (value.id === '__dynamic_link__') {
            const items = await getItemsFromSource((value as DynamicLinkBase).source);
            const parsedDynamicLinks = await processDynamicItems(value as DynamicRootLink | DynamicChildLink, items);
            processedLinks.push(...parsedDynamicLinks); // Collect processed dynamic links
        } else {
            const _processedLink = await updateSidebarLink(value as StaticRootLink | StaticLinkBase);
            processedLinks.push(_processedLink);
        }
    }

    console.log('Processed Links:', processedLinks);
    return processedLinks;
}


export const useSidebarLinks = () => {
    const context = useContext(UMSContext)

    const [loading, setLoading] = useState(false)
    const [sidebarLinks, setSidebarLinks] = useState<SidebarLink[]>([])

    const history = useHistory()
    const toast = useToast()


    useEffect(() => {
        loadLinks()
    }, [defaultItems])

    async function loadLinks() {
        setLoading(true)

        const { data, error } = await getLayoutConfigurationsById(context.uxpContext, 'sidebaritems')

        if (!!error) {
            toast.error('Unable to get the save sidebar configurations')
        }

        let items = _.cloneDeep(defaultItems)
        if (data) {
            const _items = toJSON((data as any)['Configuration'], null)
            if (!!_items && _items instanceof Array && _items.length > 0) items = _items
        }

        const links = await processPartialLinksToSidebarLinks(context.uxpContext, items as PartialSidebarLink[], handleSidebarLinkClick)
        setSidebarLinks(links as SidebarLink[])
        setLoading(false)
    }

    function handleSidebarLinkClick(page: string) {
        history.push(`/Apps/esgnow/dashboard/${page}`)
    }

    return { loading, sidebarLinks }
}