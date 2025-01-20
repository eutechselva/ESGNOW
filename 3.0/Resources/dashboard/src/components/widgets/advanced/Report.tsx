import React, { useCallback, useRef, useState } from "react";
import { BaseWidgetProps } from "@types";
import { deleteReports, getReports } from "@ums-service";
import { ActionResponse, CRUDComponent, Modal, WidgetWrapper } from 'uxp/components'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface ReportComponentProps extends BaseWidgetProps {}

const LocationOrigin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');

const layout = JSON.stringify({
    "w": 30,
    "h": 15,
    "x": 0,
    "y": 20
})

export const Report: React.FunctionComponent<ReportComponentProps> = (props) => {
    const { uxpContext } = props
    const crudUIRef = useRef(null)
    const [selectedMeasurements, setSelectedMeasurements] = useState<{ measurementToRemove?: string[], measurementToUpdate?: string[] } | null>(null);

    const getData = useCallback(async () => {
        const { data, error } = await getReports(uxpContext)
        if (!!error) return { items: [] }

        return { items: data }
    }, [uxpContext])

    async function handleDelete(item:any): Promise<ActionResponse> {
        const { data, error } = await deleteReports(uxpContext, item.id);
        crudUIRef?.current?.refreshList();
        return {
            status: !!error ? 'error' : 'done',
            message: !!error ? `Unable to delete the reports. ${error}` : 'Reports deleted!'
        };
    }


    return <WidgetWrapper>
        <CRUDComponent
            ref={crudUIRef}
            list={{
                title: 'Report',
                columns: [
                    {
                        id: 'title',
                        label: 'Title',
                        renderColumn: (item) => item.title
                    }
                ],
                onDeleteItem: handleDelete,
                onClickRow: (e, item) => {
                    window.open(`${LocationOrigin}/Apps/UXP/page/consumption?__props__=${item.props}&__layout__=${layout}` )
                },

                defaultPageSize: 25,
                data: {
                    isPaginated: false,
                    getData
                },
                search: {
                    enabled: true,
                    fields: ['title']
                },
            }}
        />
    </WidgetWrapper>
}