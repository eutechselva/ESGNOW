import './Tags.scss';
import { getAllMeterGroups, getAllMeters, getAllTags, getAllVirtualMeters, groupTagsByType } from '@ums-service';
import { BaseWidgetProps, ILocation, MeterGroup, MeterType, Tag, UtilityMeter, VirtualMeter } from "@types";
import classNames from "classnames";
import React, { useEffect, useState } from "react";
import { CRUDComponent, generateTreeNodesFromFlatList, LoadingSpinner, TableComponent, ToggleFilter, TreeNode, TreeView, useToast, WidgetWrapper } from "uxp/components";
import { getAllLocations } from '@other-services';
import { Aggregation, Bucket, ConsumptionChart, TargetType, VisualizationType } from '../consumption/Consumption';
import { convertJSONToLowercase, generateLabelValuePairsFromEnum } from '@utils';
import { addDays, endOfDay, startOfDay } from 'date-fns';

interface TagsComponentProps extends BaseWidgetProps {
    utilityType: string // this will be extracted from url
    hideShadow?: boolean,
}

export const TagsComponent: React.FC<TagsComponentProps> = (props) => {

    const { uxpContext, instanceId, utilityType, hideShadow } = props

    const [locations, setLocations] = useState<ILocation[]>([])
    const [tags, setTags] = useState<Tag[]>([])
    const [procesedNodes, setProcessedNodes] = useState<Record<string, TreeNode[]>>({})
    const [selectedNodes, setSelectedNodes] = useState<Record<string, TreeNode>>({})
    const [meters, setMeters] = useState<(UtilityMeter | VirtualMeter | MeterGroup)[]>([])
    const [meterType, setMeterType] = useState<MeterType>(MeterType.Meters)
    const [loadingTags, setLoadingTags] = useState(false)
    const [loadingMeters, setLoadingMeters] = useState(false)

    const toast = useToast()


    useEffect(() => {
        setLoadingTags(true)
        getTags()
        getLocations()
    }, [])

    useEffect(() => {
        setLoadingTags(true)
        const _processedNodes: Record<string, TreeNode[]> = {}
        _processedNodes['Location'] = generateTreeNodesFromFlatList(locations || [], '', 'LocationKey', 'LocationName', 'ParentLocationKey', 'LocationKey', true, { leadingSlash: true })

        const { grouped } = groupTagsByType(tags)
        for (const [type, _tags] of Object.entries(grouped)) {
            _processedNodes[type] = generateTreeNodesFromFlatList(_tags || [], '', 'id', 'name', 'parentTagId', 'path')
        }

        setProcessedNodes(_processedNodes)
        setLoadingTags(false)
    }, [tags, locations])

    useEffect(() => {
        loadMeters()
    }, [selectedNodes, meterType])

    async function getTags() {
        const { data, error } = await getAllTags(uxpContext)
        if (!!error) {
            setTags([])
            toast.error('Unable to get tags. ' + error)
            return
        }
        setTags(data || [])
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
        setLoadingMeters(true)
        const service = (meterType == MeterType.MeterGroups ? getAllMeterGroups : meterType == MeterType.VirtualMeters ? getAllVirtualMeters : getAllMeters)
        const params: any = { tag: [], metertype: utilityType }

        for (const [type, node] of Object.entries(selectedNodes)) {
            const label = type.toLowerCase() == 'location' ? 'location' : type
            const value = node.path //type.toLowerCase() == 'location' ? node.path : node.id
            params.tag.push(`${label}:${value}`)
        }

        const { data, error } = await service(uxpContext, params)
        if (!!error) {
            setMeters([])
            toast.error('Unable to get meters. ' + error)
            return
        }

        setMeters(data || [])
        setLoadingMeters(false)
    }


    const selectedTags = Object.entries(selectedNodes).reduce((a, [type, node]) => {
        const val = node.path  // type.toLowerCase() == 'location' ? node.path : node.path;
        a[type.toLowerCase()] = val.toLowerCase()
        return a
    }, {} as Record<string, string>)

    return <WidgetWrapper className={classNames('ums_tags__container', { 'ums_tags__container--hide-shadow': hideShadow })}>

        <div className="ums_tags__left">

            {loadingTags
                ? <LoadingSpinner />
                : <>
                    {(Object.entries(procesedNodes).map(([type, nodes]) => {
                        return <div className="ums_tags__tag_group" key={type}>
                            <div className="ums_tags__tag_group_label"> {type} </div>
                            <div className="ums_tags__tag_group_tags">
                                <TreeView
                                    items={nodes}
                                    expandAllNodes={type.toLowerCase() != 'location'}
                                    selected={selectedNodes?.[type] || null}
                                    onSelect={(val: TreeNode) => {
                                        setSelectedNodes(prev => {
                                            if (prev?.[type]?.path == val.path) delete prev[type]
                                            else prev[type] = val
                                            return { ...prev }
                                        })
                                    }}
                                />

                            </div>
                        </div>
                    }))}
                </>}
        </div>

        <div className="ums_tags__right">

            <div className="ums_tags__chart_container">
                <ConsumptionChart
                    uxpContext={uxpContext}
                    instanceId={instanceId}
                    title={'Consumption'}
                    visualizationType={VisualizationType.BarChart}
                    filters={{
                        startDate: startOfDay(addDays(new Date(), -7)),
                        endDate: endOfDay(new Date()),
                        utilityMeterType: utilityType,
                        unit: 'kwh',
                        targetType: TargetType.Tags,
                        targetIds: null,
                        tagGroup: null,
                        bucket: Bucket.Day,
                        group: null,
                        aggregation: Aggregation.Sum,
                        tags: selectedTags
                    }}
                    hideShadow={true}
                    hideFilters={['utilityMeterType', 'targetType', 'targetIds', 'tags']}
                    reportView={false}
                />
            </div>

            <div className="ums_tags__meter_list_container">
                {loadingMeters
                    ? <LoadingSpinner />
                    :
                    <CRUDComponent
                        list={{
                            title: <ToggleFilter
                                value={meterType}
                                onChange={(v) => { setMeterType(v as MeterType) }}
                                options={generateLabelValuePairsFromEnum(MeterType)}
                            />,
                            data: {
                                isPaginated: false,
                                getData: meters || []
                            },
                            columns: [
                                {
                                    id: 'displayName',
                                    label: 'Name'
                                },
                                {
                                    id: "servingLocation",
                                    label: 'Location',
                                    renderColumn: (item) => {
                                        const location = (locations || []).find(l => l.LocationKey == item?.servingLocation)
                                        return <>{location?.LocationName || 'N/A'}</>
                                    }
                                },
                            ],
                            defaultPageSize: 10,
                            search: {
                                enabled: false,
                                fields: ['name', 'displayName']
                            }
                        }}

                    />
                }
            </div>

        </div>

    </WidgetWrapper>
}