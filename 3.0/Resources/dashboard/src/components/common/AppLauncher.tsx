import { App, BaseUXPProps } from '@types'
import './AppLauncher.scss'
import React, { useEffect, useImperativeHandle, useState } from 'react'
import { DropDownButton, LoadingSpinner, NotificationBlock, SearchBox, textSearch } from 'uxp/components'
import { getAllApps } from '@other-services'
import { checkFileExists, sortByKeys } from '@utils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import DefaultIcon from '@images/product.svg'

interface AppLauncherProps extends BaseUXPProps {

}

interface AppLauncherInstanceProps { }

export const AppLauncher: React.ForwardRefExoticComponent<React.RefAttributes<AppLauncherInstanceProps> & AppLauncherProps> = React.forwardRef((props, ref) => {

    const { uxpContext } = props

    const [open, setOpen] = useState(false)
    const [apps, setApps] = useState<App[]>([])
    const [forceClose, setForceClose] = useState(false)
    const [searchText, setSearchText] = useState<string>('')
    const [loading, setLoading] = useState(false)

    const filteredApps = (apps || []).filter(a => textSearch(a.name, searchText, true))

    useImperativeHandle(ref, () => ({

    }), [])

    useEffect(() => {
        loadAllApps()
    }, [])

    async function loadAllApps() {
        setLoading(true)
        const { data, error } = await getAllApps(uxpContext)

        const allApps: App[] = []
        for (const app of data) {
            const hasIcon = await checkFileExists(app?.icon || '')

            allApps.push({
                ...app,
                icon: hasIcon ? app.icon : DefaultIcon,
            })
        }

        const sorted = sortByKeys(allApps, { name: 'asc' })

        setApps([...sorted])
        setLoading(false)
    }

    function renderAppLauncherContent() {
        return <div className='ums_app_luancher_apps__container'>
            <div className="ums_app_luancher_apps__container_header">
                <div className="ums_app_luancher_apps__container_header_left">
                    <div className="ums_app_luancher_apps__container_header_title">Apps</div>
                </div>
                <div className="ums_app_luancher_apps__container_header_right">
                    <SearchBox value={searchText} onChange={(v) => { setSearchText(v) }} />

                    <div className="ums_app_luancher_apps__container_close_button" onClick={() => {
                        setForceClose(true)
                    }}>
                        <FontAwesomeIcon icon={['fas', 'times']} />
                    </div>
                </div>

            </div>
            <div className="ums_app_luancher_apps__container_body">

                {loading ? <LoadingSpinner /> : null}
                {!loading && filteredApps?.length == 0 ? <NotificationBlock message='No apps found' /> : null}
                {!loading && filteredApps.map((app, index) => {

                    return <a
                        className='ums_app_luancher_apps__app__container'
                        title={app.longName}
                        key={index}
                        href={app.homepage || '/'}
                    >
                        <div className="ums_app_luancher_apps__app__icon_container">

                            <div className="ums_app_luancher_apps__app_icon" style={{ backgroundImage: `url(${app.icon})`, }} ></div>
                        </div>
                        <div className="ums_app_luancher_apps__app__title">{app.name}</div>
                    </a>

                })}
            </div>
        </div >
    }

    return <div className='ums_app_luancher__container' >

        <DropDownButton
            content={renderAppLauncherContent}
            position='bottom left'
            forceClose={forceClose}
            onClose={() => setForceClose(false)}
        >
            <div
                className="ums_app_luancher__launcher_button"
                onClick={() => setOpen(true)}
            ></div>
        </DropDownButton>

    </div>
})