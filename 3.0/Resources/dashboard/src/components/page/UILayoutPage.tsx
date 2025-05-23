import { UMSContext } from "@components/dashboard/UMSContext";
import { UILayout, WidgetLayout } from "@types";
import { getRegisteredWidgets, roundOffValue } from "@utils";
import React, { useContext, useEffect, useRef, useState } from "react";
import { appendDummyWidgets, calculateNumberOfCells, Changes, getModuleIdFromWidget, hasValue, IWidgetInstance, LoadingSpinner, removeDummyWidgets, toNum, useDashboardUtils, WidgetContainerBlock, WidgetDrawerModal } from "uxp/components";
import _ from 'lodash'
import { IRenderUIItemProps } from "@uxp";


interface UILayoutPageProps {
    layout: UILayout,
    page: number,
}
export const UILayoutPage: React.FC<UILayoutPageProps> = (props) => {

    const context = useContext(UMSContext)
    const { layout } = props

    const [component, setComponent] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        /**
         * Here we are not trying to load scripts , since all components used are in this project (for now)
         * if we want to load components from other projects we can look in to loading scripts, just like we do in widget layout page 
         **/

        setLoading(true)
        const registeredUIs = (window as any).RenderUIItems as IRenderUIItemProps[];
        const instance = registeredUIs?.find(r => r.id == (layout?.ui))

        if (!instance) {
            setComponent(() => <>Unable to find the given ui</>)
            setLoading(false)
            return
        }

        setComponent(() => instance.component)
        setLoading(false)
    }, [layout])


    function renderComponent() {
        if (!component) {
            return (
                <div className="uxpcore_remotecomponent__not_found">
                    Unable to find the given ui
                </div>
            );
        }

        return React.createElement(component, {
            uxpContext: context?.uxpContext || {},
        });
    }

    return <div className="esgnow_ui_layout_page__container">
        {loading ? <LoadingSpinner /> : renderComponent()}
    </div>
}