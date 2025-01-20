import './UMSDashboard.scss';
import React, { useContext, useState } from "react";
import classNames from "classnames";
import { Button, Loading, SearchBox, SideBar, ThemeChanger, UserProfile } from "uxp/components";
import { UMSContext } from "./UMSContext";
import { PageContent } from "../page/PageContent";
import { PageLayout, UMSDashboardProps } from "@types";
import { AppLauncher } from '@components/common/AppLauncher';
import { useSidebarLinks } from './sidebar-utils';
import { usePageConfiguration } from './page-utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


export const UMSDashboard: React.FC<UMSDashboardProps> = (props) => {

    const context = useContext(UMSContext)

    const [expandedSidebar, setExpandedSidebar] = useState(true)

    const { loading: loadingSidebarLinks, sidebarLinks } = useSidebarLinks()
    const { loading: loadingPageConfiguration, pageConfiguration, currentPage, refreshConfiguration } = usePageConfiguration()

    function renderEditOptions(): React.ReactNode {
        if (context.allowToEditPages) {
            return <div className='ums__dashboard_edit_btn' onClick={() => { context.onToggleEdit() }} >
                <FontAwesomeIcon icon={['fas', 'pen']} />
            </div>
        }
        return null
    }

    function renderEditToolbar() {
        if (context.editPage) {

            return <div className="ums__edit_toolbar">
                <div className="ums__edit_toolbar_content">
                    <div className="ums__edit_toolbar_left">You are in the edit mode. You can configure the layout and content of the application</div>
                    <div className="ums__edit_toolbar_right">

                        <Button
                            title='Add Widgets'
                            icon='fas plus'
                            onClick={context.openWidgetDrawer}
                            className='ums_add_widgets_button'
                        />

                        <Button
                            title='Exit'
                            icon='fas sign-out-alt'
                            onClick={context.onToggleEdit}
                        />
                    </div>
                </div>
            </div>
        }
        return null
    }

    async function onPageContentChange(layout: PageLayout) {
        if (context.allowToEditPages) {
            context.onSavePageConfig({ page: { route: currentPage, configuration: layout } })
                .then(res => { refreshConfiguration() })
        }
    }


    return <div className={classNames('ums__container', { 'ums__container--expanded': expandedSidebar })}>

        <div className={'ums__header_container'}>
            <div className={'ums__header'}>
                <div className={'ums__header_left'}>

                    <AppLauncher uxpContext={context.uxpContext} />

                    <div className="ums__header_logo_container" onClick={() => { window.location.href = '/' }} >
                        <div className="ums__header_logo"></div>
                    </div>

                </div>
                <div className={'ums__header_right'}>

                    <SearchBox value='' onChange={() => { }} placeholder='Start typing...' />

                    {
                        context?.allowToEditPages
                            ? <ThemeChanger
                                onChangeTheme={context.onChangeTheme}
                            />
                            : null
                    }

                    <UserProfile />

                    {renderEditOptions()}

                </div>

                {renderEditToolbar()}
            </div>
        </div>



        <div className={'ums__body_container'}>

            <div className={'ums__sidebar_container'}>
                <SideBar
                    items={sidebarLinks || []}
                    onClick={() => { }}
                    userGroup={context?.userGroup || null}
                    env="Prod"
                    expanded={expandedSidebar}
                    onToggleSidebar={() => { setExpandedSidebar(prev => !prev) }}
                    onHoverSidebar={() => { }}
                    className={'ums__sidebar_component'}
                    logo=''//https://static.iviva.com/lucy/logos/lucy-canvas.svg'
                    collapsedLogo='https://static.iviva.com/lucy/logos/lucy-canvas-square.svg'
                    renderLogoWithNewStyles={true}
                    loading={loadingSidebarLinks}
                />
            </div>

            <div className={'ums__contnet_container'}>
                { console.log('___pageConfiguration___', pageConfiguration) }
                {loadingPageConfiguration
                    ? <Loading />
                    : <PageContent
                        {...pageConfiguration}
                        page={1}
                        onLayoutChang={onPageContentChange}
                    />
                }
            </div>

        </div>
    </div>
}