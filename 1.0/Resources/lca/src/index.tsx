import { registerWidget, registerLink, IContextProvider, registerUI } from './uxp';

import './styles.scss';
import LCAWidget from './views/products';
import ProductDashboardWidget from './views/product-dashboard';
import LCADashboardWidget from './views/LCA-dashboard';
// No need to import ProductInformation since it's used inside LCAWidget

/**
 * Register as a Widget
 */
registerWidget({
    id: "LCA",
    widget: LCAWidget,
    configs: {
        layout: {
            // w: 12,
            // h: 12,
            // minH: 12,
            // minW: 12
        }
    },
});

registerWidget({
    id: "ProductDashboard",
    widget: ProductDashboardWidget,
    configs: {
        layout: {
            // w: 12,
            // h: 12,
            // minH: 12,
            // minW: 12
        }
    } 
});

registerWidget({
    id: "ProductDashboard",
    widget: ProductDashboardWidget,
    configs: {
        layout: {
            // w: 12,
            // h: 12,
            // minH: 12,
            // minW: 12
        }
    } 
});


registerLink({
    id: "lca-dashboard",
    component: LCADashboardWidget
});

/**
 * Register as a Sidebar Link
 */
registerLink({
    id: "product-dashboard",
    component: ProductDashboardWidget
});

registerLink({
    id: "lca-widget",
    component: LCAWidget
});


/**
 * Register as a UI
 */
// If you plan to register it as UI in the future, uncomment below
/*
registerUI({
    id: "LCA",
    component: LCAWidget
});
*/

// registerUI({
//     id:"LCA",
//     component: LCAWidget,
//     showDefaultHeader: false

// });