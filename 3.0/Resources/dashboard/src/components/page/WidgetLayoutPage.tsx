import { UMSContext } from "@components/dashboard/UMSContext";
import { WidgetLayout } from "@types";
import { getRegisteredWidgets, roundOffValue } from "@utils";
import React, { useContext, useEffect, useRef, useState } from "react";
import { appendDummyWidgets, calculateNumberOfCells, Changes, getModuleIdFromWidget, hasValue, IWidgetInstance, removeDummyWidgets, toNum, useDashboardUtils, WidgetContainerBlock, WidgetDrawerModal } from "uxp/components";
import _ from 'lodash'

interface GridSize {
    width: number,
    height: number,
    cellWidth: number,
    margin: [number, number]
}
function processWidgets(widgets: any[], params: Record<string, string>, gridSize: GridSize, allowedToEdit: boolean) {
    const updated = (widgets || []).map((w, i) => {
        const registered = getRegisteredWidgets()
        const inst = registered.find(r => (r.id == w.id && r.name == w.name))

        // replace dynamic props 
        if (!!w?.props && Object.keys(w?.props).length > 0) {
            for (const [key, value] of Object.entries(w.props)) {
                if (typeof value == 'string' && (value as string).startsWith(':')) {
                    const paramName = (value as string).replace(':', '').trim()
                    w.props[key] = params[paramName] || ''
                }
            }
        }

        const layout = w.layout
        const { fixedHeight, height } = w?.configurations?.layout || {}
        if (fixedHeight && hasValue(height)) {

            const cellCount = roundOffValue(calculateNumberOfCells(gridSize.height, gridSize.cellWidth, gridSize.margin), { integer: true })
            if (toNum(cellCount)) {
                layout.h = cellCount
            }
        }

        // layout.isDraggable = allowedToEdit,
        // layout.isResizable = allowedToEdit


        w.widget = inst?.widget || null
        return w
    })

    return updated
}

interface WidgetLayoutPageProps {
    layout: WidgetLayout,
    params: Record<string, string>,
    page: number,
    onLayoutChange: (layout: WidgetLayout) => void
}
export const WidgetLayoutPage: React.FC<WidgetLayoutPageProps> = (props) => {

    const context = useContext(UMSContext)
    const { layout, params, onLayoutChange } = props

    const [hasAllScriptsLoaded, setHasAllScriptsLoaded] = React.useState(false)
    const [gridSize, setGridSize] = useState<GridSize>({ width: 0, height: 0, cellWidth: 0, margin: [0, 0] })
    const [widgets, setWidgets] = useState<IWidgetInstance[]>([])
    const [isResizing, setIsResizing] = useState(false)

    const widgetsRef = useRef<IWidgetInstance[]>([])
    const { handleWidgetContainerChanges, handleWidgetDrawerChanges, loadPlaceholders, loadWidgetScripts } = useDashboardUtils()

    useEffect(() => {
        const _widgets = processWidgets(layout?.widgets || [], params, gridSize, context.allowToEditPages)
        widgetsRef.current = appendPlaceholderWidgets(_widgets)
        setWidgets(widgetsRef.current)

        findAndLoadWidgetScripts()
    }, [layout?.widgets, gridSize])

    function updateWidgets(_widgets: IWidgetInstance[]) {
        widgetsRef.current = appendPlaceholderWidgets(_widgets.filter(w => !!w))
        setWidgets(widgetsRef.current)
    }

    function appendPlaceholderWidgets(_widgets: IWidgetInstance[]) {
        return appendDummyWidgets(_widgets, {
            message: {
                enable: true,
                content: 'This page needs to be configured by an admin user'
            }
        })
    }

    function commitWidgetChanges(_widgets: IWidgetInstance[]) {
        onLayoutChange({ type: layout.type, widgets: removeDummyWidgets(_widgets) })
    }

    function findAndLoadWidgetScripts() {
        if (hasAllScriptsLoaded) return
        const scripts = (layout?.widgets || []).reduce((map: Record<string, string>, w) => {
            const moduleId = getModuleIdFromWidget(w);
            if (hasValue(moduleId) && !moduleId.startsWith('uxp-widget-designer-bundle') && !map[moduleId]) {
                map[moduleId] = `/api/UXP/module?id=${moduleId}`;
            }
            return map;
        }, {});


        loadWidgetScripts(Object.values(scripts), hasAllScriptsLoaded, setHasAllScriptsLoaded, widgetsRef.current, updateWidgets)
        loadPlaceholders(widgetsRef.current, hasAllScriptsLoaded, updateWidgets)
    }

    async function onChangeDashboard(changes: Changes) {

        const { installed, deleted } = await handleWidgetContainerChanges(changes, widgets, [])
        updateWidgets(installed)

        if ((changes.hasOwnProperty('layout') && isResizing) || !changes.hasOwnProperty('layout')) {
            commitWidgetChanges(installed)
        }

        setIsResizing(false)
    }

    async function onChangeWidgetDrawer(changes: Changes) {
        const { installed, deleted } = await handleWidgetDrawerChanges(changes, widgetsRef.current, hasAllScriptsLoaded, updateWidgets)
        updateWidgets(installed)
        commitWidgetChanges(installed)
    }

    async function handleWidgetPropsChange(id: string, widgetProps: any) {
        const _widgets = widgets || []
        for (const w of _widgets) {
            if (w._id == id) {
                w.props = { ...w.props, ...widgetProps }
            }
        }

        commitWidgetChanges(_widgets)
    }

    return <>
        <WidgetContainerBlock
            widgets={widgets}
            editDashboard={context.editPage}
            onChangeDashboard={onChangeDashboard}
            canEditDashboard={context.allowToEditPages}
            canManageWidgetsAndSettings={false}
            openMenu={() => { }}
            toolbarItems={[]}
            minWidth={300}
            onGridResize={(width, height, cellWidth, margin) => {
                setGridSize({ width, height, cellWidth, margin })
            }}
            hideDefaultEditToolbar={true}
            onWidgetPropsChange={handleWidgetPropsChange}
            onResizeStart={() => { setIsResizing(true) }}
        // onResizeEnd={() => { setIsResizing(false) }}
        />

        <WidgetDrawerModal
            show={context.allowToEditPages && context.editPage && context.addWidgets}
            onClose={context.closeWidgetDrawer}
            onChange={onChangeWidgetDrawer}
        />

    </>
}