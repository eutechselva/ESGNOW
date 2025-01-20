import './MeterDetails.scss'
import React, { useEffect, useState } from "react";
import { BaseWidgetProps, ILocation, MeterGroup, MeterType, Tag, UtilityMeter, VirtualMeter } from "@types";
import { formatToISOString, getLabelFonmEnum, getRelativeTime, roundOffValue, toSingular } from "@utils";
import { AsyncButton, Button, FormSectionProps, hasValue, LoadingSpinner, Modal, useAlert, useToast } from "uxp/components";
import { getAllTags, getBaseUnit, getLastMeterGroupReading, getLastReading, getLastVirtualMeterReading, getMeterDetails, getMeterGroupDetails, getVirtualMeterDetails, recordMeterReading } from "@ums-service";
import { Aggregation, Bucket, ConsumptionChart, VisualizationType } from "../consumption/Consumption";
import { getAllLocations } from '@other-services';
import { addDays, endOfDay, startOfDay, startOfMonth } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface MeterDetailsProps extends BaseWidgetProps {
    show: boolean,
    onClose: () => void,
    utilityType: string
    meterType: MeterType,
    meterId: string,
    triggerEdit: () => void,
    editing: boolean
}

export const MeterDetails: React.FC<MeterDetailsProps> = (props) => {
    const { uxpContext, instanceId, show, onClose, meterId, utilityType, meterType, triggerEdit, editing } = props

    const [loading, setLoading] = useState<boolean>(false)
    const [loadingLastReading, setLoadingLastReading] = useState<boolean>(false)
    const [details, setDetails] = useState<UtilityMeter | VirtualMeter | MeterGroup | null>(null)
    const [lastReading, setLastReading] = useState<{ time: string, reading: string } | null>(null)
    const [locations, setLocations] = useState<ILocation[]>([])
    const [tags, setTags] = useState<Tag[]>([])

    const selectedTypeLabel = getLabelFonmEnum(meterType, MeterType)

    const toast = useToast()
    const alerts = useAlert()

    useEffect(() => {
        getTags()
        getLocations()
    }, [])

    useEffect(() => {
        loadMeterDetails()
    }, [meterId, editing])

    useEffect(() => {
        loadLastReading()
    }, [meterId])

    async function loadLastReading() {
        if (!hasValue(meterId)) return
        setLoadingLastReading(true)

        const service = (meterType == MeterType.MeterGroups ? getLastMeterGroupReading : (meterType == MeterType.VirtualMeters ? getLastVirtualMeterReading : getLastReading))

        const { data, error } = await service(uxpContext, meterId)
        if (!!error) {
            setLastReading(null)
            toast.error(`Unable to get the last reading. Error: ${error}`)
            setLoadingLastReading(false)
            return
        }

        setLastReading(data)
        setLoadingLastReading(false)
    }

    async function loadMeterDetails() {
        if (!hasValue(meterId) || editing) return
        setLoading(true)

        const service = (meterType == MeterType.MeterGroups ? getMeterGroupDetails : (meterType == MeterType.VirtualMeters ? getVirtualMeterDetails : getMeterDetails))

        const { data, error } = await service(uxpContext, meterId)
        if (!!error) {
            toast.error(`Unable to load details. Error: ${error}`)
            setDetails(null)
            setLoading(false)
            return
        }

        console.log('details', data)
        setDetails(data)
        setLoading(false)
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

    async function getLocations() {
        const { data, error } = await getAllLocations(uxpContext)
        if (!!error) {
            setLocations([])
            toast.error('Unable to get meter types. ' + error)
            return
        }
        setLocations(data)
    }

    function getLocationName(key: string) {
        const location = locations.find(l => l.LocationKey == key)
        if (!location) return 'N/A'
        return location.LocationName
    }


    async function addReadingToMeter() {
        try {

            const formData = await alerts.form({
                title: 'Add Reading',
                formStructure: [
                    {
                        title: '',
                        columns: 1,
                        fields: [
                            {
                                name: 'reading',
                                label: 'Reading',
                                type: 'number',
                                value: 0,
                                validate: {
                                    required: true,
                                }
                            },
                            {
                                name: 'time',
                                label: 'Recorded At',
                                type: 'datetime',
                                value: new Date(),
                                validate: {
                                    required: true
                                }
                            }
                        ]
                    }
                ] as FormSectionProps[]
            })

            if (!formData) return

            const reading = {
                reading: formData.reading,
                time: formatToISOString(formData.time)
            }
            const { data, error } = await recordMeterReading(uxpContext, meterId, reading)

            if (!!error) {
                toast.error(`Unable to add reading. Error: ${error}`)
                return
            }

            toast.success('Reading recorded!')
        }
        catch (e) {
            console.error('Unable to add reading. error: ', e)
            toast.error(`Unable to record reading. Something went wrong`)
        }
        finally {
            loadLastReading()
        }
    }

    function renderLastReading() {
        let value: string = null
        let time: string = null

        if (!!lastReading) {
            value = '' + roundOffValue(lastReading.reading, { decimalPoints: 5 })
            time = getRelativeTime(lastReading?.time)
        }

        return <div className="ums_meter_details__header_last_reading">
            <div className='ums_meter_details__header_last_reading_label'>Last Reading: </div>
            <div className="ums_meter_details__header_last_reading_value">
                {
                    loadingLastReading
                        ? 'Loading...'
                        : (!!value) ?
                            <>
                                <div className='ums_meter_details__header_last_reading_reading' >{value}</div>
                                <div className='ums_meter_details__header_last_reading_time' >&nbsp;({time})</div>
                            </>
                            : 'N/A'
                }
            </div>
        </div>
    }

    return <Modal
        show={show}
        onClose={onClose}
        title={''}
        className="ums_meter_details__modal"
        headerContent={<div />}
    >
        {loading ? <LoadingSpinner /> :
            <div className="ums_meter_details__container">
                <div className="ums_meter_details__left">
                    <DetailsSection label={'Meter Id'} value={details?.meterId || ''} />
                    <DetailsSection label={'Meter Name'} value={details?.displayName || ''} />
                    <DetailsSection label={'Type'} value={details?.meterType || ''} />
                    <DetailsSection label={'Unit'} value={details?.unit || ''} />
                    <DetailsSection label={'Location'} value={getLocationName(details?.servingLocation)} />
                    <DetailsSection label={'Tags'} value={''} />
                    {Object.entries(details?.tags || {}).map(([key, value]) => {
                        const tag = tags.find(t => t.id == value)
                        if (!tag) return null
                        return <DetailsSection label={tag.type} value={tag.path} />
                    })}

                    <div className="ums_meter_details__footer">
                        <Button
                            icon='fas pencil'
                            title={`Edit ${toSingular(selectedTypeLabel)}`}
                            onClick={triggerEdit}
                        />
                    </div>
                </div>
                <div className="ums_meter_details__right">
                    <div className='details-header'>
                        <div className="ums_meter_details__header">
                            <div className="ums_meter_details__header_left">
                                <div className="ums_meter_details__header_title">
                                    {toSingular(selectedTypeLabel)}: {loading ? 'Loading...' : details?.displayName}
                                </div>
                            </div>
                            <div className="ums_meter_details__header_right">
                                {renderLastReading()}

                                {
                                    meterType == MeterType.Meters
                                        ? <AsyncButton
                                            icon='fas plus'
                                            title="Add Reading"
                                            loadingTitle='Saving...'
                                            onClick={addReadingToMeter}
                                            className='ums_meter_details__add_reading_btn'
                                        />
                                        : null
                                }

                                <div className="ums_meter_details__close_btn" onClick={() => { onClose() }}>
                                    <FontAwesomeIcon icon={['fas', 'times']} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="ums_meter_details__chart_container">
                        <ConsumptionChart
                            uxpContext={uxpContext}
                            instanceId={instanceId}
                            title={'Consumption'}
                            visualizationType={VisualizationType.BarChart}
                            filters={{
                                startDate: startOfMonth(new Date()),
                                endDate: endOfDay(new Date()),
                                utilityMeterType: utilityType,
                                unit: details?.unit||'',
                                targetType: meterType as any,
                                targetIds: [meterId],
                                tagGroup: null,
                                bucket: Bucket.Day,
                                group: null,
                                aggregation: Aggregation.Sum,
                            }}
                            hideShadow={true}
                            hideFilters={['utilityMeterType', 'targetType', 'targetIds']}
                            reportView={false}
                        />

                    </div>
                </div>
            </div>
        }
    </Modal>
}

const DetailsSection: React.FC<{ label: string, value: string }> = ({ label, value }) => {
    return <div className="ums_meter_details__section">
        <div className="ums_meter_details__section_label">{label}</div>
        <div className="ums_meter_details__section_value">{value}</div>
    </div>
}