import { SidebarLink } from "@components/dashboard/sidebar-utils";
import { IContextProvider } from "@uxp";
import { IWidgetInstance, Tab, TabComponentStyles } from "uxp/components";

export interface BaseUXPProps {
    uxpContext: IContextProvider
}

export interface BaseWidgetProps extends BaseUXPProps {
    instanceId: string,
    onWidgetPropsChange?: (id: string, widgetProps: any) => void
}

export type LayoutChange = { id: string, configuration: any }
export type PageChange = { route: string, configuration: PageLayout }

export type Changes = Record<string, LayoutChange | PageChange>

export interface IUMSContext extends BaseUXPProps {
    userGroup: string,
    allowToEditPages: boolean
    editPage: boolean,
    onToggleEdit: () => void
    onSavePageConfig: (changes: Changes) => Promise<string>
    addWidgets: boolean,
    openWidgetDrawer: () => void
    closeWidgetDrawer: () => void,
    onChangeTheme: (themeName: string) => void
}

export interface PageConfiguration {
    layout: PageLayout,
    params: Record<string, string>
}

export interface UMSDashboardProps {
}

export interface WidgetLayoutConfiguration {
    fixedHeight?: boolean,
    height?: number // percentage from the grid height
    fixedWidth?: boolean,
    width?: number// percentage from the grid width
}
export interface Widget extends IWidgetInstance {
    configurations?: {
        layout: WidgetLayoutConfiguration
    }
}

export enum PageLayoutType {
    Tabs = 'tabs',
    Widgets = 'widgets'
}
export interface IBaseLayout {
    type: PageLayoutType
}

export interface ExtendedTab extends Tab {
    content: PageLayout
}
export interface TabLayout extends IBaseLayout {
    tabs: ExtendedTab[],
    selected: string,
    styles?: TabComponentStyles
}
export interface WidgetLayout extends IBaseLayout {
    widgets: Widget[]
}

export type PageLayout = TabLayout | WidgetLayout
export interface PageConfigMapping {
    [id: string]: PageLayout
}


// types 
export enum MeterType {
    Meters = 'utilitymeters',
    VirtualMeters = 'virtualmeters',
    MeterGroups = 'metergroups'
}

export interface UtilityMeterType {
    id: string,
    name: string,
    displayName: string,
    unitConversion: { [unit: string]: number }
}
export interface BaselineType {
    id: string,
    name: string,
    duration: number
}
export interface MetadataType {
    id: string;
    type: string;
    fields: MetadataTypeField[];
}

export interface MetadataTypeField {
    id: string;
    label: string;
    type: string;
}


export type Consumption = Array<{ time: Date, value: number }>
export type ConfiguredBaselines = Record<string, number>
export interface UtilityMeter {
    id: string,
    meterId: string,
    name: string,
    displayName: string,
    meterType: string,
    unit: string,
    servingLocation: string,
    tags: { [label: string]: string },
    description: string,
    hourlyConsumption?: Consumption,
    dailyConsumption?: Consumption,
    baselines?: ConfiguredBaselines,
    metadata?: Array<Record<string, any>>
}

export interface ScalingFactor {
    [meter: string]: number
}
export interface VirtualMeter extends UtilityMeter {
    scalingFactor: ScalingFactor
}

export interface MemberMeter {
    id: string,
    factor: number,
    isMeterGroup?: boolean
}
export interface MeterGroup extends UtilityMeter {
    members: MemberMeter[]
}

export interface ILocation {
    LocationKey: string,
    LocationName: string,
    LocationType: string,
    LocationTypeKey: string,
    baselines: ConfiguredBaselines
}

export interface BaseTag {
    name: string,
    type: string,
    path: string,
    parentTagId: string
}
export interface Tag extends BaseTag {
    id: string
    childTags: Tag[],
    baselines: ConfiguredBaselines
}

export interface ConsumptionReading {
    time: string,
    value: number,
    group?: string
}

export interface App {
    name: string,
    longName: string,
    icon: string,
    homepage: string
}