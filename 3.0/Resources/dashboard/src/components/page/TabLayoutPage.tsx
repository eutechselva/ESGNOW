import { PageLayout, TabLayout } from "@types";
import React, { useContext, useEffect, useState } from "react";
import { TabComponent } from "uxp/components";
import { PageContent } from "./PageContent";
import _ from 'lodash'
import { useHistory, useLocation } from "react-router-dom";
import { UMSContext } from "@components/dashboard/UMSContext";


interface TabLayoutProps {
    layout: TabLayout,
    params: Record<string, string>,
    page: number,
    onLayoutChange: (layout: TabLayout) => void
}
export const TabLayoutPage: React.FC<TabLayoutProps> = (props) => {

    const context = useContext(UMSContext)
    const { type, tabs, styles, selected } = props.layout
    const [selectedTab, setSelectedTab] = useState(null)

    const history = useHistory();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    // Extract the correct tab from URL if it exists
    useEffect(() => {
        const tabFromURL = searchParams.get(`t${props.page}`);
        if (tabFromURL) {
            setSelectedTab(tabFromURL);
        } else {
            setSelectedTab(selected);
        }
    }, [location.search, props.page, selected]);


    function handleTabChange(tab: string) {
        setSelectedTab(tab)

        // Update the URL
        const updatedSearchParams = new URLSearchParams(location.search);
        updatedSearchParams.set(`t${props.page}`, tab); // e.g., t1=tab1, t2=tab2

        // Replace history with new search parameters
        history.replace({
            search: updatedSearchParams.toString(),
        });
    }

    function onTabContentChange(id: string, content: PageLayout) {
        const updatedTabs = (tabs || []).map(t => {
            if (t.id == id) t.content = content
            return t
        })

        props.onLayoutChange({ type, tabs: updatedTabs, selected, styles })
    }

    return <TabComponent
        tabs={(tabs).map(t => ({
            ...t,
            content: <PageContent
                layout={_.cloneDeep(t.content)}
                params={props.params}
                page={props.page + 1}
                onLayoutChang={(l) => onTabContentChange(t.id, l)}
            />
        }))}
        selected={selectedTab}
        onChangeTab={handleTabChange}
        styles={styles}
    />
}