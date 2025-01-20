
import BundleConfig from '../bundle.json';

// window interface
interface ILayout {
    w?: number,
    h?: number,
    isDraggable?: boolean,
    isResizable?: boolean,
    maxH?: number,
    maxW?: number,
    minH?: number,
    minW?: number,
    static?: boolean
}

interface IContainer {
    background?: string
}

interface IWidgetPropConfig {
    name: string,
    type: string,
    label: string
    attr?: { [key: string]: any }
}
export interface IConfigPanelProps {
    onSubmit: (data: { [key: string]: any }) => void
    onCancel?: () => void
}
type IWidgetPreloader = 'default' | 'line-chart' | 'bar-chart' | 'donut-chart' | 'heatmap-chart' | 'gauge' | 'map'

interface IWidgetConfig {
    layout?: ILayout
    props?: IWidgetPropConfig[],
    configPanel?: React.FunctionComponent<IConfigPanelProps>,
    preLoader?: IWidgetPreloader
}

interface IWidgetObject {
    id: string,
    widget: any,
    configs?: IWidgetConfig
    defaultProps?: { [propName: string]: any }
    external?: {
        styles?: { [key: string]: string }
        scripts?: { [key: string]: string }
    }
}
type SidebarLinkClick = () => void;

interface ISidebarLinkProps {
    onClose: () => void;
    uxpContext: IContextProvider
}
interface IMenuPanelProps {
    uxpContext: IContextProvider
}
interface ISidebarLink {
    id: string,
    click?: SidebarLinkClick
    component?: React.FunctionComponent<ISidebarLinkProps> | React.Component<ISidebarLinkProps, {}>,
    link?: string,
    // target?: string,
    // icon?: string,
    // label: string,
}
interface IMenuItem {
    id: string,
    title?: string,
    content: () => JSX.Element
    link?: string,
    component?: React.FunctionComponent<ISidebarLinkProps> | React.Component<ISidebarLinkProps, {}>,
    menuPanel?: React.FunctionComponent<IMenuPanelProps> | React.Component<IMenuPanelProps, {}>
}
interface IRenderUIItemProps {
    id: string,
    component: any,
    uiProps?: any
}
declare global {
    interface Window {
        registerWidget(config: IWidgetObject): void;
        registerLink(config: ISidebarLink): void;
        registerUI(config: IRenderUIItemProps): void;
        registerMenuItem(config: IMenuItem): void
    }
}


interface IWidgetManager {
    loadFromMarketPlace: boolean;
    url: string;
}

interface IPartialContextProvider {
    root: string,
    // sidebarContent: ISidebarLink[],
    scriptFiles: string[],
    widgetManager: IWidgetManager;
    lucyUrl: string;
    apiKey: string;
    userKey: string;
}

/**
 * Options for executing Lucy Actions
 */
interface ILucyActionExecutionOptions {
    /** Set this to true to parse the data as JSON and return it */
    json?: boolean;
}

type IDataFunction = (max: number, lastPageToken: string, args?: any) => Promise<{ items: Array<any>, pageToken: string }>;

type IShowUITypes = "popup" | "tab"
interface IShowUIOptions {
    target?: "_blank" | "_self"
}
export interface IContextProvider extends IPartialContextProvider {
    executeAction: (model: string, action: string, parameters: any, options?: ILucyActionExecutionOptions) => Promise<any>;
    executeService: (app: string, service: string, parameters: any, options?: ILucyActionExecutionOptions) => Promise<any>;
    fireEvent: (eventID: string) => Promise<void>;
    hasAppRole: (roles: string | string[]) => Promise<boolean>;
    /**
     * This will return a function that can be passed into DataList, DataTable, DynamicList
     * (max: number, lastPageToken: string, args?: any) => Promise<{ items: Array<any>, pageToken: string }>
     * this function will return a paginated set of documents for the given filter in args 
     * 
     * pass the Lucy modal name & collection name 
     */
    fromLucyDataCollection(model: string, collection: string): IDataFunction
    /**
     * 
     * @param uiId 
     * @param bundleId 
     * @param author 
     * @param type 
     * @param options 
     * 
     * this function will execute the render UI function & will render the given ui
     * 
     */
    executeRenderUI: (uiId: string, bundleId?: string, author?: string, type?: IShowUITypes, options?: IShowUIOptions) => void

}
export function registerWidget(_widget: IWidgetObject) {
    let id = (BundleConfig.id + '/widget/' + _widget.id).toLowerCase();

    if (!window.registerWidget) {
        console.error('This code is not being run within the context of UXP');
        return;
    }

    // get widget details from bundle.json 
    // get widget
    let _widgetDetails = BundleConfig.widgets?.find((w: any) => w.id == _widget.id)

    if (!_widgetDetails) {
        console.log("Please update the bundle.json")
        throw "Error: The widget you are trying to register is not in the bundle.json. Please update the bundle.json before continue";
    }
    // merge them
    let updatedWidget = { ..._widget, ..._widgetDetails, ...{ id } };

    window.registerWidget(updatedWidget);
}
export function registerLink(_link: ISidebarLink) {
    let id = (BundleConfig.id + '/sidebarlink/' + _link.id).toLowerCase();

    if (!window.registerLink) {
        console.error('This is not is not being run within the UXP context');
        return;
    }
    console.log('registering link....', id);
    // get widget details from bundle.json 
    // get widget
    let _linkDetails = BundleConfig.sidebarLinks?.find((s: any) => s.id == _link.id)

    if (!_linkDetails) {
        console.log("Please update the bundle.json")
        throw "Error: The sidebar link you are trying to register is not in the bundle.json. Please update the bundle.json before continue";
    }
    // merge them
    let updatedLink = { ..._link, ..._linkDetails, ...{ id } }

    window.registerLink(updatedLink);
}
export function registerMenuItem(_menuItem: IMenuItem) {
    let id = (BundleConfig.id + '/menuitem/' + _menuItem.id).toLowerCase();
    if (!window.registerMenuItem) {
        console.error('This is not is not being run within the UXP context');
        return;
    }
    console.log('registering menu item....', id);
    // get widget details from bundle.json 
    // get widget
    let _menuItemDetails = BundleConfig.menuItems.find((s: any) => s.id == _menuItem.id)
    if (!_menuItemDetails) {
        console.log("Please update the bundle.json")
        throw "Error: The menu item you are trying to register is not in the bundle.json. Please update the bundle.json before continue";
    }
    // merge them
    let updatedMenuItem = { ..._menuItem, ..._menuItemDetails, ...{ id } }

    window.registerMenuItem(updatedMenuItem);
}
export function registerUI(_ui: IRenderUIItemProps) {
    let id = (BundleConfig.id + '/ui/' + _ui.id).toLowerCase();
    if (!window.registerUI) {
        console.error('This is not is not being run within the UXP context');
        return;
    }
    console.log('registering link....', id);
    // get widget details from bundle.json 
    // get widget
    let _uiDetails = BundleConfig.uis.find((s: any) => s.id == _ui.id)
    if (!_uiDetails) {
        console.log("Please update the bundle.json")
        throw "Error: The ui you are trying to register is not in the bundle.json. Please update the bundle.json before continue";
    }
    // merge them
    let updatedUI = { ..._ui, ..._uiDetails, ...{ id } }
    window.registerUI(updatedUI);
}