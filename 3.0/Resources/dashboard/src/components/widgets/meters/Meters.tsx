import { Sparkline } from "@components/common/SparkLine";
import { getAllLocations } from "@other-services";
import { BaselineType, BaseWidgetProps, Consumption, ILocation, MeterGroup, MeterType, Tag, UtilityMeter, UtilityMeterType, VirtualMeter } from "@types";
import { deleteMeter, deleteMeterGroup, deleteVirtualMeter, getAllBaselineTypes, getAllMeterGroups, getAllMeters, getAllTags, getAllUtilityMeterTypes, getAllVirtualMeters } from "@ums-service";
import { generateLabelValuePairsFromEnum, getLabelFonmEnum, toSingular } from "@utils";
import React, { useEffect, useRef, useState } from "react";
import { ActionResponse, Button, Checkbox, CRUDComponent, FormField, hasValue, Label, Select, ToggleFilter, useToast, WidgetWrapper } from "uxp/components";
import { Deviation } from "@components/common/Deviation";
import { MeterDetails } from "./MeterDetails";
import { LabelIcons } from "@components/common/Icons";
import { generateUITagsFromTags, TagList } from "@components/common/TagList";
import { MeterConfigForm } from "./MeterConfigForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import './Meters.scss'
import { calculateTotalConsumptionAndBaselinValue, hasDeviated } from "./meter_tag_utils";

interface MetersComponentProps extends BaseWidgetProps {
    utilityType: string // this will be extracted from url,
    showOnlyDeviatedOnes?: boolean
}


export const MetersComponent: React.FC<MetersComponentProps> = (props) => {
    const { uxpContext, instanceId, utilityType } = props

    const [utilityTypes, setUtilityTypes] = useState<UtilityMeterType[]>([])
    const [locations, setLocations] = useState<ILocation[]>([])
    const [tags, setTags] = useState<Tag[]>([])

    const [utilityMeters, setUtilityMeters] = useState<UtilityMeter[]>([])
    const [virtualMeters, setVirtualMeter] = useState<VirtualMeter[]>([])
    const [meterGroups, setMeterGroups] = useState<MeterGroup[]>([])
    const [meterType, setMeterType] = useState<MeterType>(MeterType.Meters)
    const [viewInstance, setViewInstance] = useState<UtilityMeter | VirtualMeter | MeterGroup | null>(null)
    const [showEditForm, setShowEditForm] = useState<boolean>(false)
    const [baselines, setBaseliens] = useState<BaselineType[]>([]);
    const [selectedBaseline, setSelectedBaseline] = useState('');
    const [deviatedOnly, setDeviatedOnly] = useState(false)

    const [baselineRange, setBaselineRange] = useState(1);

    const [loading, setLoading] = useState<{ [key in MeterType]: boolean }>({
        [MeterType.Meters]: false,
        [MeterType.VirtualMeters]: false,
        [MeterType.MeterGroups]: false,
    });

    const selectedTypeLabel = getLabelFonmEnum(meterType, MeterType)

    const crudUIRef = useRef(null)
    const toast = useToast()

    useEffect(() => {
        getUtilityTypes()
        getTags()
        getLocations()
        loadUtilityMeters()
        loadVirtualMeters()
        loadMeterGroups()
        loadBaselines()
    }, [])

    useEffect(() => {
        loadMeters()
    }, [utilityType, meterType])

    useEffect(() => { }, [])

    async function getUtilityTypes() {
        const { data, error } = await getAllUtilityMeterTypes(uxpContext)
        if (!!error) {
            setUtilityTypes([])
            toast.error('Unable to get meter types. ' + error)
            return
        }
        setUtilityTypes(data)
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

    async function loadMeters() {
        if (!hasValue(utilityType) || !hasValue(meterType)) return
        switch (meterType) {
            case MeterType.MeterGroups:
                loadMeterGroups()
            case MeterType.VirtualMeters:
                loadVirtualMeters()
            default:
                loadUtilityMeters()
        }
    }

    async function loadUtilityMeters() {
        setLoading(prev => ({ ...prev, [MeterType.Meters]: true }))
        const { data, error } = await getAllMeters(uxpContext, { metertype: utilityType })
        if (!!error) {
            setUtilityMeters([])
            toast.error('Unable to get meters. ' + error)
            return
        }

        setUtilityMeters(data || [])
        setLoading(prev => ({ ...prev, [MeterType.Meters]: false }))
    }

    async function loadVirtualMeters() {
        setLoading(prev => ({ ...prev, [MeterType.VirtualMeters]: true }))
        const { data, error } = await getAllVirtualMeters(uxpContext, { metertype: utilityType })
        if (!!error) {
            setVirtualMeter([])
            toast.error('Unable to get meters. ' + error)
            return
        }

        setVirtualMeter(data || [])
        setLoading(prev => ({ ...prev, [MeterType.VirtualMeters]: false }))

    }

    async function loadMeterGroups() {
        setLoading(prev => ({ ...prev, [MeterType.MeterGroups]: true }))
        const { data, error } = await getAllMeterGroups(uxpContext, { metertype: utilityType })
        if (!!error) {
            setMeterGroups([])
            toast.error('Unable to get meters. ' + error)
            return
        }

        setMeterGroups(data || [])
        setLoading(prev => ({ ...prev, [MeterType.MeterGroups]: false }))
    }
    async function loadBaselines() {
        const { data, error } = await getAllBaselineTypes(props.uxpContext);
        setBaseliens(data);
    }

    function getMeters(): any[] {
        const _meters = (meterType == MeterType.MeterGroups ? meterGroups : (meterType == MeterType.VirtualMeters ? virtualMeters : utilityMeters))
        if (!_meters) return []

        if (hasValue(selectedBaseline) && !!deviatedOnly) {
            return _meters.filter(m => hasDeviated(m, selectedBaseline, baselineRange))
        }
        return _meters
    }

    function renderConsumptionTrend(item: UtilityMeter | VirtualMeter | MeterGroup) {

        let data = baselineRange == 1 ? (item.hourlyConsumption || []) : (item.dailyConsumption || []);
        let highLimit: number | undefined = undefined;
        if (item.baselines?.[selectedBaseline]) {
            highLimit = Number(item.baselines[selectedBaseline]);
            if (baselineRange == 1) highLimit = Number(item.baselines[selectedBaseline]) / 24;
        }
        let remainingLength = ((baselineRange==1) ? 24: baselineRange) - data.length;
        const sparkLineData = [...data,...(new Array(remainingLength).fill({time:null,value:null}))] as Consumption;
        return <Sparkline
            data={sparkLineData}
            color="#52A1F2"
            highColor="#DA4382"
            highLimit={highLimit}
            type='bar'
        />
    }

    function renderCustomForm(show: boolean, onClose: () => void, editInstance?: UtilityMeter | VirtualMeter | MeterGroup) {

        return <MeterConfigForm
            uxpContext={uxpContext}
            meterType={meterType}
            utilityType={utilityType}
            show={show}
            onClose={onClose}
            editInstance={editInstance}
            afterSave={() => { loadMeters() }}
            utilityTypes={utilityTypes}
            utilityMeters={utilityMeters}
            virtualMeters={virtualMeters}
            meterGroups={meterGroups}
            tags={tags}
            locations={locations}
        />
    }

    async function onDeleteMeter(item: UtilityMeter | VirtualMeter | MeterGroup): Promise<ActionResponse> {

        const service = (meterType == MeterType.MeterGroups ? deleteMeterGroup : (meterType == MeterType.VirtualMeters ? deleteVirtualMeter : deleteMeter))

        const { data, error } = await service(uxpContext, item.meterId || item.id)

        loadMeters()

        return {
            status: !!error ? 'error' : 'done',
            message: !!error ? `Unable to delete ${toSingular(selectedTypeLabel)}. Error: ${error}` : `${toSingular(selectedTypeLabel)} deleted!`
        }
    }

    return <WidgetWrapper className="ums_meters__container" >

        <CRUDComponent
            ref={crudUIRef}
            list={{
                title: <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Select
                        selected={meterType}
                        onChange={v => setMeterType(v as MeterType)}
                        options={generateLabelValuePairsFromEnum(MeterType)}
                        renderPlaceholder={{
                            renderAsPill: {
                                minWidth: 20,
                            }
                        }}
                    />
                    <div style={{ marginLeft: '20px' }}>
                        <Select
                            placeholder="Baseline"
                            options={baselines}
                            valueField="id"
                            labelField="name"
                            selected={selectedBaseline}
                            onChange={setSelectedBaseline}
                            renderCustomDropdownContent={(closer) => {
                                return <div className='baseline-config'>
                                    <div className='baseline-config-title'>Baseline Selection</div>
                                    <ToggleFilter
                                        disableShadow={true}
                                        value={baselineRange + ''}
                                        onChange={(v) => setBaselineRange(Number(v))}

                                        options={[
                                            { label: '24 Hours', value: '1' },
                                            { label: '30 Days', value: '30' },
                                        ]} />
                                    {
                                        baselines.map((b) => {
                                            return <div className={classNames('baseline-config-item', { selected: (selectedBaseline == b.id) })} onClick={() => { setSelectedBaseline(b.id) }}><Label

                                                className="baseline-config-item-label" icon={LabelIcons.Baseline}>{b.name}</Label>
                                                {
                                                    selectedBaseline == b.id && <FontAwesomeIcon icon={'check-circle'} />
                                                }
                                            </div>;
                                        })
                                    }

                                   {selectedBaseline &&  <FormField >
                                        <Checkbox
                                            checked={deviatedOnly}
                                            onChange={setDeviatedOnly}
                                            label="Only show deviations from selected baseline"
                                            type='switch-box'
                                        />
                                    </FormField>}

                                    <Button
                                        title="Done"
                                        onClick={() => { closer() }}
                                    />
                                </div>;
                            }}
                            renderPlaceholder={{
                                renderAsPill: {
                                    minWidth: 20,
                                },
                                renderCustomPill: (onClear) => {
                                    const baseline = baselines.find(b => b.id == selectedBaseline)
                                    return <div>{baseline ? baseline.name : 'Select a baseline'}</div>
                                },
                            }}
                            onClear={() => setSelectedBaseline(null)}
                        />
                    </div>
                </div>,
                data: {
                    isPaginated: false,
                    getData: getMeters(),
                    isLoading: loading[meterType]
                },
                columns: [
                    {
                        id: 'displayName',
                        label: 'Name',
                        renderColumn: (item) => {
                            return <>
                                <div style={{ cursor: 'pointer' }} >{item.displayName}
                                </div>
                                <div style={{ fontSize: '0.8em', marginTop: '10px' }}>
                                    <TagList tags={generateUITagsFromTags(item.tags, tags)} />
                                </div>
                            </>;
                        }
                    },
                    {
                        id: "servingLocation",
                        label: 'Location',
                        renderColumn: (item) => {
                            const location = (locations || []).find(l => l.LocationKey == item?.servingLocation)
                            return <Label icon={location?.LocationName && LabelIcons.Location || ''}>{location?.LocationName || 'N/A'}</Label>;
                        }
                    },
                    {
                        id: 'deviation',
                        label: 'Deviation',
                        maxWidth: 50,
                        renderColumn: (item) => {
                            // let totalConsumption = 0;

                            // let consumptionItems: any[] = ((baselineRange == 1) ? item.hourlyConsumption : item.dailyConsumption) || [];
                            // let baselineScale = baselineRange == 1 ? 1 / 24 : baselineRange;
                            // let baselineMultiplier = 0;
                            // if (baselineRange == 1) {
                            //     for (let c of consumptionItems) {
                            //         baselineMultiplier += baselineScale;
                            //         totalConsumption += Number(c.value);
                            //     }
                            // } else {
                            //     for (let k = baselineRange - 1; k >= 0; k--) {
                            //         baselineMultiplier += baselineScale;
                            //         totalConsumption += Number(consumptionItems?.[k]?.value || 0);
                            //     }
                            // }

                            // let baselineValue = (Number(item.baselines?.[selectedBaseline]) || 0) * baselineMultiplier || totalConsumption;
                            const { totalConsumption, totalBaselineValue } = calculateTotalConsumptionAndBaselinValue(item, selectedBaseline, baselineRange)
                            return <Deviation
                                value={totalConsumption}
                                baseline={totalBaselineValue || totalConsumption}
                            />
                        }
                    },
                    {
                        id: 'consumption',
                        label: 'Consumption',
                        renderColumn: renderConsumptionTrend,
                        minWidth: 200,
                        maxWidth: 300
                    }
                ],
                defaultPageSize: 25,

                search: {
                    enabled: true,
                    fields: ['displayName'],
                },
                addButton: {
                    label: 'Add'
                },
                onDeleteItem: onDeleteMeter,
                onClickRow: (e, item: any) => setViewInstance(item)
            }}
            renderCustomAddView={renderCustomForm}
            renderCustomEditView={renderCustomForm}
        />


        <MeterDetails
            uxpContext={uxpContext}
            instanceId={instanceId}
            show={!!viewInstance}
            onClose={() => setViewInstance(null)}
            meterType={meterType}
            meterId={viewInstance?.meterId || viewInstance?.id}
            triggerEdit={() => setShowEditForm(true)}
            editing={showEditForm}
            utilityType={utilityType}
        />

        {renderCustomForm((showEditForm && !!viewInstance), () => { setShowEditForm(false) }, viewInstance)}

    </WidgetWrapper>
}