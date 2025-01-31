import './styles.scss';
import React, { useEffect, useState } from 'react';
import { registerUI, enableLocalization, IUserDetails, registerWidget } from './uxp';
import { BaseUXPProps, Changes, IUMSContext, LayoutChange, PageChange } from '@types';
import { BrowserRouter as Router, } from 'react-router-dom';
import { UMSContext } from '@components/dashboard/UMSContext';
import { UMSDashboard } from '@components/dashboard/UMSDashboard';
import {  saveLayoutConfigurationsById, savePageConfiguration } from '@other-services';
import ProductDashboardWidget from './lca/views/product-dashboard';
import LCAWidget from './lca/views/products';
import LCADashboardWidget from './lca/views/LCA-dashboard';

const WrappedDashboard: React.FC<BaseUXPProps> = (props) => {

    const { uxpContext } = props
    const [user, setUser] = useState<IUserDetails | null>(null)
    const [editPage, setEditPage] = useState(false)
    const [addWidgets, setAddWidgets] = useState(false)

    useEffect(() => {
        getUser()
    }, [])



    async function onChangeTheme(theme: string) {
        const { data, error } = await saveLayoutConfigurationsById(uxpContext, 'theme', { 'themeName': theme })
    }

    async function getUser() {
        uxpContext?.getUserDetails()
            ?.then(res => setUser(res))
            ?.catch(e => { console.log('error getting user: ', e) })
    }

    async function onSaveChanges(changes: Changes): Promise<string> {

        const { data, error } = await (changes.hasOwnProperty('layout')
            ? saveLayoutConfigurationsById(uxpContext, (changes['layout'] as LayoutChange).id, (changes['layout'] as LayoutChange).configuration)
            : savePageConfiguration(uxpContext, (changes['page'] as PageChange).route, (changes['page'] as PageChange).configuration)
        )

        if (error) {
            console.error('Error saving changes:', error);
        }
        return 'done'
    }

    const contextValue: IUMSContext = {
        uxpContext,
        userGroup: user?.userGroup || null,
        allowToEditPages: !!user && uxpContext.hasAppRole('ESGNOW', 'canconfigurepages'),
        editPage: editPage || false,
        onToggleEdit: () => { setEditPage(prev => (!prev)) },
        addWidgets: addWidgets,
        openWidgetDrawer: () => { setAddWidgets(true) },
        closeWidgetDrawer: () => { setAddWidgets(false) },
        onSavePageConfig: onSaveChanges,
        onChangeTheme: onChangeTheme
    }

    return <Router>
        <UMSContext.Provider value={contextValue} >
            <UMSDashboard />
        </UMSContext.Provider>
    </Router>
}

registerUI({
    id: "esg-now-dashboard",
    component: WrappedDashboard,
    showDefaultHeader: false
});

registerWidget({
    id: 'product-dashboard',
    widget: ProductDashboardWidget,
    configs: {
        layout: {
            w: 30,
            h: 20,
        }
    }
})

registerWidget({
    id: 'lca-widget',
    widget: LCAWidget,
    configs: {
        layout: {
            w: 30,
            h: 20,
        }
    }
})

registerWidget({
    id: 'lca-dashboard',
    widget: LCADashboardWidget,
    configs: {
        layout: {
            w: 30,
            h: 20,
        }
    }
})

enableLocalization()