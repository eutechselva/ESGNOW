import React, { useContext, useState } from "react";
import { PageLayout, PageLayoutType, TabLayout, WidgetLayout } from "@types";
import { TabLayoutPage } from "./TabLayoutPage";
import { WidgetLayoutPage } from "./WidgetLayoutPage";
import './PageContent.scss';


interface PageContentProps {
    layout: PageLayout,
    params: Record<string, string>,
    page: number
    onLayoutChang: (layout: PageLayout) => void
}
export const PageContent: React.FC<PageContentProps> = (props) => {

    const { layout, params, page, onLayoutChang } = props

    console.log('___layout___', layout)

    if (!layout) return <div className="ums_page_layout_not_configured__container">
        <div className="ums_page_layout_not_configured__message">Page has not configured</div>
    </div>
    return <div className={'ums_page_content__container'}>
        {((layout?.type as PageLayoutType) == PageLayoutType.Tabs)
            ? <TabLayoutPage layout={{ ...layout as TabLayout }} params={{ ...params }} page={page} onLayoutChange={onLayoutChang} />
            : <WidgetLayoutPage layout={{ ...layout as WidgetLayout }} params={{ ...params }} page={page} onLayoutChange={onLayoutChang} />
        }
    </div>
}