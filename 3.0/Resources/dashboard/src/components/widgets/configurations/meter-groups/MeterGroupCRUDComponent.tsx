import React, { useEffect, useRef, useState } from "react";
import { BaseWidgetProps, ILocation, MemberMeter, MeterGroup, MeterType, Tag, UtilityMeter, UtilityMeterType, VirtualMeter } from "@types";
import { ActionResponse, CRUDComponent, useToast, WidgetWrapper } from 'uxp/components'
import { deleteMeterGroup, getAllMeterGroups, getAllMeters, getAllTags, getAllUtilityMeterTypes, getAllVirtualMeters } from "@ums-service";
import { getAllLocations } from "@other-services";
import { generateUITagsFromTags, TagList } from "@components/common/TagList";
import { MoreInfo } from "@components/common/MoreInfo";
import { MeterConfigForm } from "@components/widgets/meters/MeterConfigForm";

interface MeterGroupCRUDComponentProps extends BaseWidgetProps {
}

export const MeterGroupCRUDComponent: React.FunctionComponent<MeterGroupCRUDComponentProps> = (props) => {

    const { uxpContext } = props

    const [meterTypes, setMeterTypes] = useState<UtilityMeterType[]>([])
    const [meters, setMeters] = useState<UtilityMeter[]>([])
    const [virtualMeters, setVirtualMeters] = useState<VirtualMeter[]>([])
    const [meterGroups, setMeterGroups] = useState<MeterGroup[]>([])
    const [locations, setLocations] = useState<ILocation[]>([])
    const [tags, setTags] = useState<Tag[]>([])

    const [counter, setCounter] = useState(0)

    const crudUIRef = useRef(null)
    const toast = useToast()

    useEffect(() => {
        getMeterTypes()
        getMeters()
        getVirtualMeters()
        getMeterGroups()
        getLocations()
        getTags()
    }, [counter])


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

    async function getMeterTypes() {
        const { data, error } = await getAllUtilityMeterTypes(uxpContext)
        if (!!error) {
            setMeterTypes([])
            toast.error('Unable to get meter types. ' + error)
            return
        }
        setMeterTypes(data)
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
        if (!!error) return setVirtualMeters([])
        return setVirtualMeters(data)
    }

    async function getMeterGroups() {
        const { data, error } = await getAllMeterGroups(uxpContext)
        if (!!error) return setMeterGroups([])
        return setMeterGroups(data)
    }

    async function handleDelete(item: MeterGroup): Promise<ActionResponse> {
        const { data, error } = await deleteMeterGroup(uxpContext, item.id)
        setCounter(prev => prev + 1)
        return {
            status: !!error ? 'error' : 'done',
            message: !!error ? `Unable to delete the meter group. ${error}` : 'Meter group deleted!',
        }
    }

    function renderCustomForm(show: boolean, onClose: () => void, editInstance?: UtilityMeter) {

        return <MeterConfigForm
            uxpContext={uxpContext}
            meterType={MeterType.MeterGroups}
            show={show}
            onClose={onClose}
            editInstance={editInstance}
            afterSave={() => { crudUIRef?.current?.refreshList() }}
            utilityTypes={meterTypes}
            utilityMeters={meters}
            virtualMeters={virtualMeters}
            meterGroups={meterGroups}
            tags={tags}
            locations={locations}
        />
    }

    return <WidgetWrapper>
        <CRUDComponent
            ref={crudUIRef}
            list={{
                title: 'Meter Groups',
                columns: [
                    {
                        id: 'name',
                        label: 'Name',
                    },
                    {
                        id: 'meterType',
                        label: 'Meter Type'
                    },
                    {
                        id: "members",
                        label: 'Members',
                        renderColumn: (item) => {

                            return <MoreInfo
                                title='Members'
                                items={item?.members || []}
                                renderItem={(member: MemberMeter) => {

                                    let type = 'Meter Group'
                                    let meter: MeterGroup | UtilityMeter | VirtualMeter = member?.isMeterGroup ? (meterGroups || []).find(m => m.id == member.id) : null
                                    if (!member?.isMeterGroup) {
                                        const um = (meters || []).find(m => m.meterId == member.id)
                                        if (um) { type = 'Utility Meter'; meter = um; }
                                        else {
                                            const vm = (virtualMeters || []).find(m => m.meterId == member.id)
                                            if (vm) { type = 'Virtual Meter'; meter = vm }
                                        }
                                    }

                                    return <div className='more-info-scaling-factor'>
                                        <div className='more-info-scaling-factor-label'>{meter?.displayName || meter.meterId} | {type}</div>
                                        <div className='more-info-scaling-factor-factor'>{`✕ ${member.factor || 1}`}</div>
                                    </div>
                                }}

                            />;

                            // return <SimpleTable showBordersUnderRows={true}>
                            //     {(item?.members || []).map((member: MemberMeter) => {
                            //         let type = 'Meter Group'
                            //         let meter: MeterGroup | UtilityMeter | VirtualMeter = member?.isMeterGroup ? (meterGroups || []).find(m => m.id == member.id) : null
                            //         if (!member?.isMeterGroup) {
                            //             const um = (meters || []).find(m => m.meterId == member.id)
                            //             if (um) { type = 'Utility Meter'; meter = um; }
                            //             else {
                            //                 const vm = (virtualMeters || []).find(m => m.meterId == member.id)
                            //                 if (vm) { type = 'Virtual Meter'; meter = vm }
                            //             }
                            //         }
                            //         return <tr>
                            //             <td>{meter?.displayName || 'N/A'}</td>
                            //             <td>{type}</td>
                            //             <td>{member?.factor}</td>
                            //         </tr>
                            //     })}
                            // </SimpleTable>
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
                ],
                defaultPageSize: 25,
                data: {
                    isPaginated: false,
                    getData: meterGroups || []
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