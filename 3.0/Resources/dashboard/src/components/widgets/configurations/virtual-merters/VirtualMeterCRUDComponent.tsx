import React, { useEffect, useRef, useState } from "react";
import { BaseWidgetProps, ILocation, MeterType, Tag, UtilityMeter, UtilityMeterType, VirtualMeter } from "@types";
import { ActionResponse, CRUDComponent, useToast, WidgetWrapper } from 'uxp/components'
import { getAllLocations } from "@other-services";
import { deleteVirtualMeter, getAllMeters, getAllTags, getAllUtilityMeterTypes, getAllVirtualMeters } from "@ums-service";
import { MoreInfo } from "@components/common/MoreInfo";
import { generateUITagsFromTags, TagList } from "@components/common/TagList";
import { MeterConfigForm } from "@components/widgets/meters/MeterConfigForm";

interface VirtualMeterCRUDComponentProps extends BaseWidgetProps {
}

export const VirtualMeterCRUDComponent: React.FunctionComponent<VirtualMeterCRUDComponentProps> = (props) => {

    const { uxpContext } = props

    const [meterTypes, setMeterTypes] = useState<UtilityMeterType[]>([])
    const [meters, setMeters] = useState<UtilityMeter[]>([])
    const [locations, setLocations] = useState<ILocation[]>([])
    const [tags, setTags] = useState<Tag[]>([])

    const crudUIRef = useRef(null)
    const toast = useToast()

    useEffect(() => {
        getMeterTypes()
        getMeters()
        getLocations()
        getTags()
    }, [])

    useEffect(() => {
        console.log('Locations, meter types ', locations, meterTypes)
    }, [locations, meterTypes])

    async function getMeterTypes() {
        const { data, error } = await getAllUtilityMeterTypes(uxpContext)
        if (!!error) {
            setMeterTypes([])
            toast.error('Unable to get meter types. ' + error)
            return
        }
        setMeterTypes(data)
    }

    async function getLocations() {
        const { data, error } = await getAllLocations(uxpContext)
        if (!!error) {
            setLocations([])
            toast.error('Unable to get meter types. ' + error)
            return
        }
        setLocations(data)
    }

    async function getTags() {
        const { data, error } = await getAllTags(uxpContext)
        if (!!error) {
            setTags([])
            toast.error('Unable to get tags. ' + error)
            return
        }

        setTags(data)
    }

    async function getMeters() {
        const { data, error } = await getAllMeters(uxpContext)
        if (!!error) {
            setMeterTypes([])
            toast.error('Unable to get meters. ' + error)
            return
        }
        setMeters(data)
    }

    async function getVirtualMeters() {
        const { data, error } = await getAllVirtualMeters(uxpContext)
        if (!!error) return { items: [] }
        return { items: data }
    }

    async function handleDelete(item: VirtualMeter): Promise<ActionResponse> {
        const { data, error } = await deleteVirtualMeter(uxpContext, item.meterId)
        crudUIRef?.current?.refreshList()
        return {
            status: !!error ? 'error' : 'done',
            message: !!error ? `Unable to delete the meter. ${error}` : 'Meter deleted!',
        }
    }

    function renderCustomForm(show: boolean, onClose: () => void, editInstance?: UtilityMeter) {

        return <MeterConfigForm
            uxpContext={uxpContext}
            meterType={MeterType.VirtualMeters}
            show={show}
            onClose={onClose}
            editInstance={editInstance}
            afterSave={() => { crudUIRef?.current?.refreshList() }}
            utilityTypes={meterTypes}
            utilityMeters={meters}
            virtualMeters={[]}
            meterGroups={[]}
            tags={tags}
            locations={locations}
        />
    }

    return <WidgetWrapper>
        <CRUDComponent
            ref={crudUIRef}
            list={{
                title: 'Virtual Meters',
                columns: [
                    {
                        id: 'name',
                        label: 'Name'
                    },
                    {
                        id: 'description',
                        label: 'Description'
                    },
                    {
                        id: 'meterType',
                        label: 'Meter Type',
                        renderColumn: (item) => {
                            return <>
                                <div>{item.meterType}</div>
                                <div style={{ fontSize: '0.9em', opacity: '0.8' }}>{item.unit}</div>
                            </>;
                        }
                    },
                    {
                        id: "servingLocation",
                        label: 'Serving Location',
                        renderColumn: (item) => {
                            const location = (locations || []).find(l => l.LocationKey == item?.servingLocation)
                            return <>{location?.LocationName || 'N/A'}</>
                        }
                    },

                    {
                        id: 'tags',
                        label: 'Tags',
                        renderColumn: (item) => {
                            return <div style={{ fontSize: '0.8em', marginTop: '10px' }}>
                                    <TagList tags={generateUITagsFromTags(item.tags, tags)} />
                            </div>
                        }
                    },
                    {
                        id: 'scalingFactor',
                        label: 'Meters',
                        renderColumn: (item) => {
                            return <MoreInfo
                                title='Meters'
                                items={Object.entries(item?.scalingFactor || {})}
                                renderItem={([mid, factor]) => {
                                    const meter = (meters || []).find(m => m.meterId == mid)
                                    return <div className='more-info-scaling-factor'>
                                        <div className='more-info-scaling-factor-label'>{meter?.name || mid}</div>
                                        <div className='more-info-scaling-factor-factor'>{`✕ ${factor || 1}`}</div>
                                    </div>
                                }}

                            />;
                        }
                    }
                ],
                defaultPageSize: 25,
                data: {
                    isPaginated: false,
                    getData: getVirtualMeters
                },
                search: {
                    enabled: true,
                    fields: ['name']
                },
                onDeleteItem: handleDelete
            }}
            renderCustomAddView={renderCustomForm}
            renderCustomEditView={renderCustomForm}
        />
    </WidgetWrapper>
}