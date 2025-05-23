import React, { useContext, useState } from "react";
import { PageLayout, PageLayoutType, TabLayout, UILayout, WidgetLayout } from "@types";
import { TabLayoutPage } from "./TabLayoutPage";
import { WidgetLayoutPage } from "./WidgetLayoutPage";
import './PageContent.scss';
import { NotificationBlock } from "uxp/components";
import { UILayoutPage } from "./UILayoutPage";


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

    function renderContent() {
        switch (layout?.type as PageLayoutType) {
            case PageLayoutType.Tabs:
                return <TabLayoutPage layout={{ ...layout as TabLayout }} params={{ ...params }} page={page} onLayoutChange={onLayoutChang} />
            case PageLayoutType.Widgets:
                return <WidgetLayoutPage layout={{ ...layout as WidgetLayout }} params={{ ...params }} page={page} onLayoutChange={onLayoutChang} />
            case PageLayoutType.UI:
                return <UILayoutPage layout={{ ...layout as UILayout }} page={page} />
            default:
                return <NotificationBlock message="Invalid layout type" />
        }
    }

    return <div className={'ums_page_content__container'}>
        {renderContent()}
    </div>
}