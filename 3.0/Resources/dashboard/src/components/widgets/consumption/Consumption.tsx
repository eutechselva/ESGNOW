import './Consumption.scss'
import React, { useEffect, useState } from "react";
import { BaselineType, BaseWidgetProps, ConsumptionReading, ILocation, MeterGroup, Tag, UtilityMeter, UtilityMeterType, VirtualMeter } from "@types";
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, PieChart, Line, Pie, Cell, Area, ReferenceArea } from 'recharts';
import { Button, Checkbox, DateRangePicker, DropDownButton, FormField, hasValue, Input, isRelativeDate, Label, Loading, Modal, MultiSelect, Select, toDate, ToggleFilter, toNum, toStr, useHasChanged, useToast, WidgetWrapper } from "uxp/components";
import { createReport, getAllBaselineTypes, getAllMeterGroups, getAllMeters, getAllTags, getAllUtilityMeterTypes, getAllVirtualMeters, getAnalyticsForMeter, getAnalyticsForTags, groupTagsByType, MeterAnalyticsParams, TagAnalyticsParams } from "@ums-service";
import { getAllLocations } from "@other-services";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { calculateBaselineValueBasedOnBucket, convertJSONToLowercase, formatNumber, formatToDateString, generateLabelValuePairsFromEnum, getEndDate, getLabelFonmEnum, getPreviousRangeFromRelativeDates, getStartDate, joinParts, roundOffValue, toSentenceCase, toSingular, wait } from "@utils";
import { FilterSection, MultipleTagInput } from "@components/common/CustomInputs";
import { Contributions } from './Contributions';
import classNames from 'classnames';
import useExportToExcel from '@hooks/useExportToExcel';
import tinycolor from 'tinycolor2';
import { findMeterDetails, findTagDetails } from '../meters/meter_tag_utils';
import _ from 'lodash';
import { IContextProvider } from '@uxp';
// Define a pool of 20 dynamic colors
const DynamicColors = [
    "#9370DB", "#FEB56A", "#D568FB", "#FE6A35",
    "#e8c1a0", "#f47560", "#f1e15b", "#e8a838", "#61cdbb",
    "#97e3d5", "#ffaf3b", "#d04a02", "#d7ef23", "#04d9a6",
    "#41d8c8", "#4086f2", "#a140d8", "#e75d6f", "#ce6e15",
    "#fde75d", "#f99455", "#44dcd6", "#fc5130", "#7f74ff",
];
export enum VisualizationType {
    DonutChart = 'Donut',
    BarChart = 'Bar',
    ColumnChart = 'Column',
    AreaChart = 'Area',
    LineChart = 'Line',
}

export interface FilterError {
    [field: string]: string
}

export enum Bucket {
    'FiveMinutes' = '5m',
    'FifteenMinutes' = '15m',
    'ThirtyMinutes' = '30m',
    'Hour' = '1h',
    'Day' = '1d',
    'Week' = '1w',
    'Month' = '1mo',
    'Year' = '1y'
}

export enum Group {
    'DayOfWeek' = 'dayofweek',
    'HourOfDay' = 'hourofday',
    'DayOfMonth' = 'dayofmonth',
}

export enum Aggregation {
    'Sum' = 'sum',
    'Average' = 'average',
    'Min' = 'min',
    'Max' = 'max'
}

export enum TargetType {
    'UtilityMeters' = 'utilitymeters',
    'VirtualMeters' = 'virtualmeters',
    'MeterGroups' = 'metergroups',
    'Tags' = 'tags',
}

export interface RawData {
    current: any[],
    previous1?: any[]
    previous2?: any[]
}


export interface Reading {
    label: string,
    value: number,
    sortValue: string | number,
}

export interface GroupedReading extends Reading {
    groupLabel: string // this will be the group name
}
export interface FormattedRawData {
    current: (Reading | GroupedReading)[],
    previous1?: (Reading | GroupedReading)[]
    previous2?: (Reading | GroupedReading)[]
}

export interface ChartData {
    label: string, // x axis
    [key: string]: string | number // other values => Ex: consumption: 10, consumptionColor: #424242
}
export interface ProcessedData {
    unit?: string, // unit => kwh
    xAxisLabel: string,
    yAxisLabel: string,
    chartType: VisualizationType
    yAxisWidth?: number,
    data: ChartData[],
    grouping: Group,
    tagGrouping: boolean
    chartLabels: string[]
}

export interface Filters {
    startDate: string | Date;
    endDate: string | Date
    dateRangePreset?: string

    utilityMeterType: string; // energy | water | etc 
    unit: string,
    targetType: TargetType, // utilitymeter | virtualmeter| metergroup
    targetIds: string[], // meter ids
    tagGroup?: string, // tag group name
    tags?: Record<string, string>

    bucket: Bucket,
    group?: Group,
    aggregation: Aggregation,
    enableGrouping?: boolean

    compareRanges?: 0 | 1 | 2
}

export type HideFilterOptions = keyof Filters | 'chartType' | 'dateRange';
export interface ConsumptionWidgetProps extends BaseWidgetProps {
    title: string,
    visualizationType?: VisualizationType,
    filters?: Filters,
    hideShadow?: boolean,
    hideFilters?: HideFilterOptions[],
    reportView: boolean
}

export const ConsumptionChart: React.FC<ConsumptionWidgetProps> = (props) => {
    const { uxpContext, instanceId, title, reportView } = props
    const [expand, setExpand] = useState(false)
    const [filters, setFilters] = useState<Filters | null>(null)
    const [meterTypes, setMeterTypes] = useState<UtilityMeterType[]>([])
    const [utilityMeters, setUtilityMeters] = useState<UtilityMeter[]>([])
    const [virtualMeters, setVirtualMeters] = useState<VirtualMeter[]>([])
    const [meterGroups, setMeterGroups] = useState<MeterGroup[]>([])
    const [tags, setTags] = useState<Tag[]>([])
    const [tagTypes, setTagTypes] = useState<string[]>([])
    const [locations, setLocations] = useState<ILocation[]>([])
    const [filterErrors, setFilterErrors] = useState<FilterError>({})
    const [loadingData, setLoadingData] = useState(false)
    const [visualizationType, setVisualizationType] = useState<VisualizationType>(props.visualizationType || VisualizationType.BarChart);
    const [baselineTypes, setBaselineTypes] = useState<BaselineType[]>([])
    const [selectedBaseline, setSelectedBaseline] = useState<string>(null)
    const [configuredBaselines, setConfiguredBaselines] = useState<{ [baselineId: string]: number }>({})
    const [showContributions, setShowContributions] = useState<boolean>(false)
    const [showReportForm, setShowReportForm] = useState<boolean>(false)
    const [reportName, setReportName] = useState<string>("")
    const [zoomHistory, setZoomHistory] = useState<Array<{ start: string | Date, end: string | Date, bucket: string }>>([]);


    // using two states here 
    // rawData - the raw consumption get from the ums service/app
    // formattedRawData - raw consumption data is formatted in the the structure that use in this widget
    // later it will be processed on the fly to generate the chart - this is done like this because we have to switch between differnt chart types and when do so prevent from calling the back end each time
    const [rawData, setRawData] = useState<RawData>({ current: [] })
    const [formattedRawData, setFormattedRawData] = useState<FormattedRawData>({ current: [] })


    // check if props have changed 
    const hasPropsChanged = useHasChanged(props)

    const exportToExcel = useExportToExcel;

    const toast = useToast()

    const showBaseline = (
        visualizationType != VisualizationType.DonutChart
        && (
            (filters?.targetType == TargetType.Tags && Object.keys(filters?.tags)?.length == 1)
            || (filters?.targetType != TargetType.Tags && filters?.targetIds?.length == 1)
        )
    );
    const showComparisonFilter = (isRelativeDate(filters?.startDate) && isRelativeDate(filters?.endDate) && visualizationType != VisualizationType.DonutChart)
    function zoomIn(s: Date | string, e: Date | string) {
        console.log('zooming in', s, e);
        let start = filters.startDate;
        let end = filters.endDate;
        let bucket = filters.bucket;


        setZoomHistory((history) => {
            const newZH = [...history, { start, end, bucket }];
            console.log('ZH PUSH', history, newZH);
            return newZH;
        });
        let newBucket = filters.bucket;
        let startDate = toDate(s);
        let endDate = toDate(e);
        let diff = Number(endDate) - Number(startDate);
        let hour = 3600 * 1000;
        let day = hour * 24;
        let month = day * 30;
        if (diff <= hour * 3) {
            newBucket = Bucket.FifteenMinutes
        } else if (diff <= day * 2) {
            newBucket = Bucket.Hour;
        } else if (diff <= month) {
            newBucket = Bucket.Day
        } else if (diff <= month * 3) {
            newBucket = Bucket.Week;
        } else if (diff < month * 12 * 2) {
            newBucket = Bucket.Month;
        } else {
            newBucket = Bucket.Year;
        }
        console.log(s, e, diff, newBucket, '<<<<');
        updateFilters({ startDate: s, endDate: e, bucket: newBucket });
    }
    function zoomOut() {
        if (zoomHistory.length == 0) return;
        let last = zoomHistory[zoomHistory.length - 1];

        updateFilters({ startDate: last.start, endDate: last.end, bucket: last.bucket });
        setZoomHistory((zh) => {
            const zhNew = [...zh];
            return zhNew.slice(0, zh.length - 1);
        });
    }
    useEffect(() => {
        if (!hasPropsChanged) return
        getAllUtilityMeterTypes(uxpContext).then(({ data, error }) => {
            if (error) {
                setMeterTypes([])
                toast.error(`Unable to get meter types. Error: ${error}`)
                return
            }
            setMeterTypes(data)
        })

        getAllMeters(uxpContext).then(({ data, error }) => {
            if (error) {
                setUtilityMeters([])
                toast.error(`Unable to get utility meters. Error: ${error}`)
                return
            }
            setUtilityMeters(data)
        })

        getAllVirtualMeters(uxpContext).then(({ data, error }) => {
            if (error) {
                setVirtualMeters([])
                toast.error(`Unable to get virtual meters. Error: ${error}`)
                return
            }
            setVirtualMeters(data)
        })

        getAllMeterGroups(uxpContext).then(({ data, error }) => {
            if (error) {
                setMeterGroups([])
                toast.error(`Unable to get meter types. Error: ${error}`)
                return
            }
            setMeterGroups(data)
        })

        getAllTags(uxpContext).then(({ data, error }) => {
            if (error) {
                setTags([])
                setTagTypes([])
                toast.error(`Unable to get tags. Error: ${error}`)
                return
            }
            const { types } = groupTagsByType(data)
            setTagTypes(types)
            setTags(data)
        })

        getAllLocations(uxpContext).then(({ data, error }) => {
            if (error) {
                setLocations([])
                toast.error(`Unable to get locations. Error: ${error}`)
                return
            }

            setLocations(data)
        })

        getAllBaselineTypes(uxpContext).then(({ data, error }) => {
            if (error) {
                setBaselineTypes([])
                toast.error(`Unable to get baseline types. Error: ${error}`)
                return
            }

            setBaselineTypes(data)
        })

    }, [hasPropsChanged])

    useEffect(() => {
        if (!hasPropsChanged) return
        if (isValidChartType(props?.visualizationType, VisualizationType)) setVisualizationType(props.visualizationType)
        else setVisualizationType(VisualizationType.BarChart)
    }, [props?.visualizationType, hasPropsChanged])

    useEffect(() => {
        if (!hasPropsChanged) return
        console.log('unitchange', props.filters);
        setFilters({ ...props.filters })
    }, [props.filters, hasPropsChanged])

    useEffect(() => {
        console.log('filters', filters)
        loadData()
    }, [filters, utilityMeters, virtualMeters, meterGroups, tags, locations])

    useEffect(() => {
        console.log('formatted_raw_data', formattedRawData)
    }, [formattedRawData])

    useEffect(() => {
        if ((filters?.targetType == TargetType.Tags && Object.keys(filters?.tags || {}).length == 1) || (filters?.targetType != TargetType.Tags && filters?.targetIds?.length == 1)) {
            if (filters?.targetType == TargetType.Tags) {
                const firstKey = Object.keys(filters?.tags)?.[0]
                const tag = hasValue(firstKey) ? findTagDetails(filters?.tags?.[firstKey], tags, locations) : null
                if (tag) {
                    setConfiguredBaselines(tag.baselines || {})
                    return
                }
            }
            else {
                const meter = findMeterDetails(filters?.targetIds?.[0], utilityMeters, virtualMeters, meterGroups)
                if (meter) {
                    setConfiguredBaselines(meter?.baselines || {})
                    return
                }
            }
        }
        setConfiguredBaselines({})
    }, [props, filters?.targetType, filters?.targetIds, filters?.tags, locations, tags,utilityMeters, meterGroups, virtualMeters])

    function getBaselineValues() {
        const baselineType = (baselineTypes || []).find(b => b.id == selectedBaseline)
        const baselineValue = (configuredBaselines?.[selectedBaseline] || 0)

        return calculateBaselineValueBasedOnBucket(baselineType, baselineValue, filters?.bucket, filters?.group, filters?.aggregation, { start: filters?.startDate, end: filters?.endDate })
    }

    function processData() {
        const uniqueLabels = new Set<string>()
        const firstChartLabel = (filters?.compareRanges <= 0 || visualizationType === VisualizationType.DonutChart)
            ? 'Consumption'
            : 'Current';

        const hasTagGrouping = filters?.enableGrouping && hasValue(filters?.tagGroup);
        const hasMultipleMeters = filters?.targetIds?.length > 1

        const mergeData = (data: any[], labelKey: string) => {
            for (const rd of data) {
                const key = (hasTagGrouping || hasMultipleMeters)
                    ? (['Consumption', 'Current'].includes(labelKey))
                        ? (rd as GroupedReading).groupLabel
                        : `${labelKey}:${(rd as GroupedReading).groupLabel}`
                    : labelKey;

                uniqueLabels.add(key)

                const existing = _data.find(d => d.label === rd.label);
                if (existing) {
                    existing[key] = rd.value;
                } else {
                    _data.push({
                        label: rd.label,
                        sortValue: rd.sortValue,
                        [key]: rd.value,
                    });
                }
            }
        };

        const _data: ChartData[] = [];
        // Merge current data
        mergeData(formattedRawData?.current || [], firstChartLabel);

        // Merge previous comparison data
        if (showComparisonFilter && filters?.compareRanges >= 1) {
            mergeData(formattedRawData?.previous1 || [], 'Previous1');
        }
        if (showComparisonFilter && filters?.compareRanges === 2) {
            mergeData(formattedRawData?.previous2 || [], 'Previous2');
        }

        // Add baseline data
        if (showBaseline && hasValue(selectedBaseline)) {
            const baselineValues = getBaselineValues();
            for (const d of _data) {
                d['Baseline'] = (filters?.group && filters?.aggregation === Aggregation.Sum)
                    ? (baselineValues as Record<number, number>)[toNum(d.sortValue)]
                    : baselineValues as number;
            }

            uniqueLabels.add('Baseline')
        }

        // Sort data by numeric, date, or string value
        _data.sort((a, b) => {
            const labelA = a.sortValue;
            const labelB = b.sortValue;

            const numA = Number(labelA);
            const numB = Number(labelB);

            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;

            const dateA = new Date(labelA);
            const dateB = new Date(labelB);

            if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) return dateA.getTime() - dateB.getTime();

            return labelA.toString().localeCompare(labelB.toString());
        });

        console.log('_______chart_data___', _data, uniqueLabels)
        return {
            xAxisLabel: 'Time Period',
            yAxisLabel: `${toSentenceCase(filters?.utilityMeterType)} Usage`,
            chartType: visualizationType,
            unit: filters?.unit || '',
            data: _data,
            yAxisWidth: filters?.group ? 50 : 150,
            grouping: filters?.enableGrouping ? filters?.group : null,
            tagGrouping: hasTagGrouping,
            chartLabels: Array.from(uniqueLabels)
        } as ProcessedData;
    }

    function formatGroupLabel(x: any): string {
        switch (filters.group) {
            case Group.DayOfMonth: return x;

            case Group.DayOfWeek: return [
                'Sun',
                'Mon',
                'Tue',
                'Wed',
                'Thu',
                'Fri'
                , 'Sat'
            ][Number(x) || 0] || x;

            case Group.HourOfDay: return (
                x == 0 ? '12am' :
                    x < 12 ? `${x}am` :
                        x == 12 ? `${x}pm` :
                            `${x - 12}pm`
            );

        }
    }

    function parseConsumptionToRawData(data: ConsumptionReading[], formatToDate: boolean, dateFormat: string) {
        const labelField = hasValue(filters.group) ? 'group' : 'time'
        const valueField = 'value'

        return ((data || []) as ConsumptionReading[])
            .filter((d) => (hasValue(d[labelField]) && hasValue(d[valueField], true, true)))
            .map((d) => ({
                label: formatToDate ? formatToDateString(d[labelField], dateFormat) : formatGroupLabel(d[labelField]),
                value: roundOffValue(d[valueField], { decimalPoints: 5 }),
                sortValue: formatToDate ? formatToDateString(d[labelField], 'yyyy-MM-dd HH:mm') : d[labelField],
            }))
    }


    function getLabel(id: string) {
        if (filters.targetType == TargetType.Tags) {
            const tag = findTagDetails(id, tags, locations)
            if (!tag) return id
            return (tag as ILocation).LocationName || (tag as Tag).name
        }
        else {
            const meter = findMeterDetails(id, utilityMeters, virtualMeters, meterGroups, filters?.targetType as any)
            if (!meter) return id
            return meter.displayName
        }
    }
    function parseGroupedConsumptionToRawData(data: { [type: string]: ConsumptionReading[] }, formatToDate: boolean, dateFormat: string) {
        const groupedReadings: GroupedReading[] = []

        for (const [key, value] of Object.entries(data)) {

            const groupLabel = getLabel(key)
            const readings: GroupedReading[] = (parseConsumptionToRawData(value, formatToDate, dateFormat) || [])
                .map(r => ({
                    ...r,
                    groupLabel: groupLabel,
                }));

            groupedReadings.push(...readings)
        }

        return groupedReadings
    }

    function parsedToRowData(data: any) {

        const formatToDate = !hasValue(filters.group)
        var dateFormat = 'yyyy-MM-dd HH:mm';
        if (formatToDate) {
            switch (filters.bucket) {
                case Bucket.Day:
                case Bucket.Week:
                    dateFormat = 'dd/MM/yyyy'; break;
                case Bucket.Month:
                    dateFormat = "MMM-yy"; break;
                case Bucket.Year:
                    dateFormat = 'yyyy'; break;
            }
        }

        return parseGroupedConsumptionToRawData(data, formatToDate, dateFormat);
    }


    async function getAnalitcsForMultipleMeters(params: MeterAnalyticsParams): Promise<{ data: any, error?: string }> {
        const readings: { [meterId: string]: ConsumptionReading[] } = {}

        for (const target of filters?.targetIds || []) {
            const { data, error } = await getAnalyticsForMeter(uxpContext, filters.targetType, target, params)
            readings[target] = (!error && !!data) ? data.consumptions || [] : null
        }

        return { data: readings, error: null }
    }

    async function getAnalytics(params: MeterAnalyticsParams | TagAnalyticsParams) {
        const useTagsEndpoint = filters.targetType == TargetType.Tags

        return (useTagsEndpoint
            ? getAnalyticsForTags(uxpContext, filters.utilityMeterType, params as TagAnalyticsParams, convertJSONToLowercase(filters.tags))
            : getAnalitcsForMultipleMeters(params)
        )
    }

    async function loadData() {
        const { isValid, errors } = validateFilters()
        setFilterErrors(errors)

        if (!isValid) return
        setLoadingData(true)
        const params: MeterAnalyticsParams | TagAnalyticsParams = {
            start: getStartDate(toDate(filters.startDate)),
            end: getEndDate(toDate(filters.endDate)),
            bucket: filters?.bucket || '',
            unit: filters?.unit || ''
        }

        if (filters?.enableGrouping) {
            if (filters?.targetType == TargetType.Tags && hasValue(filters?.tagGroup)) (params as TagAnalyticsParams).tagGroup = filters?.tagGroup
            if (hasValue(filters?.group)) { params.group = filters.group }
            if (hasValue(filters?.aggregation)) params.groupType = filters?.aggregation
        }

        // get consumption data for current selected date range 
        const { data, error } = await getAnalytics(params)

        if (!!error) {
            setFormattedRawData({ current: [] })
            setRawData({ current: [] })
            setLoadingData(false)

            toast.error(`Unable to get the consumption. Error: ${error}`)
            return
        }

        // get previous consumption 
        let previous1: any[] = []
        let previous2: any[] = []

        if (showComparisonFilter && hasValue(filters?.compareRanges)) {
            if (filters.compareRanges >= 1) {
                // calculate previous range 
                const prev1Params = _.cloneDeep(params)
                const previousRange1 = getPreviousRangeFromRelativeDates(filters?.startDate, filters?.endDate, 1)

                if (!!previousRange1 && !!previousRange1?.startDate && !!previousRange1?.endDate) {
                    console.log('previous_range', previousRange1.startDate, previousRange1.endDate)

                    prev1Params.start = previousRange1.startDate
                    prev1Params.end = previousRange1.endDate

                    const { data, error } = await getAnalytics(prev1Params)

                    if (!error) {
                        previous1 = data
                    }
                }

            }
            if (filters.compareRanges == 2) {
                // calculate previous range 
                const prev2Params = _.cloneDeep(params)
                const previousRange2 = getPreviousRangeFromRelativeDates(filters?.startDate, filters?.endDate, 2)

                if (!!previousRange2 && !!previousRange2?.startDate && !!previousRange2.endDate) {
                    console.log('previous_range', previousRange2.startDate, previousRange2.endDate)

                    prev2Params.start = previousRange2.startDate
                    prev2Params.end = previousRange2.endDate

                    const { data, error } = await getAnalytics(prev2Params)

                    if (!error) {
                        previous2 = data
                    }
                }
            }
        }

        setRawData({ current: data, previous1: previous1, previous2: previous2 })
        setFormattedRawData({ current: parsedToRowData(data), previous1: parsedToRowData(previous1), previous2: parsedToRowData(previous2) })

        await wait(300)
        setLoadingData(false)
    }

    function isValidChartType(ct: any, types: any) {
        return hasValue(ct) && Object.values(types).includes(ct)
    }

    function updateFilters(values: { [key: string]: any }) {
        setFilters((prev) => ({ ...prev, ...values }))
    }

    function validateFilters(): { isValid: boolean, errors: FilterError } {
        const _errors: FilterError = {}

        if (!hasValue(filters?.startDate) || !hasValue(filters?.endDate)) _errors['dateRange'] = 'Date range is required'
        if (!hasValue(filters?.utilityMeterType)) _errors['utilityMeterType'] = 'Utility type is required'
        if (!hasValue(filters?.targetType)) _errors['targetType'] = 'Target Type is required'
        if (filters?.targetType != TargetType.Tags) {
            if (!filters?.targetIds || filters?.targetIds?.length == 0) _errors['targetIds'] = 'At least one target is required'
            else {
                // validate meter check the utility type and meter type 
                const inst = ((filters?.targetType == TargetType.MeterGroups ? meterGroups : filters?.targetType == TargetType.VirtualMeters ? virtualMeters : utilityMeters) || []).find(m => ((filters?.targetIds || []).includes(m?.meterId || m.id)))
                if (!inst) _errors['targetIds'] = `Target is empty or an invalid. Expect a valid ${toSingular(getLabelFonmEnum(filters.targetType, TargetType))}`
                else if (inst.meterType != filters?.utilityMeterType) _errors['targetIds'] = `Invalid target selected. Expect a valid ${filters?.utilityMeterType} ${toSingular(getLabelFonmEnum(filters.targetType, TargetType))}`
            }
        }
        if (filters?.targetType == TargetType.Tags) {
            if (!filters?.tags || Object.keys(filters?.tags)?.length == 0) _errors['tags'] = 'At least one tag is required'
        }
        if (!hasValue(filters?.group) && !hasValue(filters?.bucket)) {
            _errors['group'] = 'Group or bucket is required'
            _errors['bucket'] = 'Group or bucket is required'
        }
        // if (!hasValue(filters?.aggregation)) _errors['aggregation'] = 'Aggregation is required'
        return { isValid: Object.keys(_errors)?.length == 0, errors: _errors }
    }

    function getUnits() {
        const utilityType = hasValue(filters?.utilityMeterType) ? (meterTypes || []).find(mt => mt.name == filters.utilityMeterType) : null
        if (!utilityType) return []
        return (Object.keys(utilityType.unitConversion || {}) || []).map((unit => ({ label: unit, value: unit })))
    }
    function formatForExcel(lbl: string, index: number) {
        return (index + 1) + ' - ' + lbl.replace(/[\/\\\*]/g, '_').slice(0, 20);
    }
    function exportData() {
        const fileName: string = `${title} ${formatToDateString(filters.startDate, 'yyyy-MM-dd')}-${formatToDateString(filters.endDate, 'yyyy-MM-dd')}`
        const firstChartLabel = (visualizationType == VisualizationType.DonutChart) ? 'Consumption' : 'Current'
        let pd = processData();
        const dataToExport: Record<string, any[]> = Object.fromEntries(pd.chartLabels.map((label, i) => {
            return [formatForExcel(label, i), pd.data.map((pdr) => ({
                [pd.xAxisLabel]: pdr.label,
                [pd.yAxisLabel]: pdr[label]
            }))];
        }));
        // dataToExport[firstChartLabel] = rawData.current || []
        exportToExcel(dataToExport, fileName)
    }
    async function saveAsReport() {
        try {
            console.log("report saved")
            if (reportName == "") {
                toast.error("Report Name is empty")
                return
            }
            const { data, error } = await createReport(uxpContext, {
                title: reportName,
                props: {
                    filters,
                    title: reportName,
                    visualizationType,
                    hideShadow: props.hideShadow,
                    hideFilters: props.hideFilters,
                    reportView: true
                },
                createdUser: uxpContext.userKey
            })

            if (!!error) {
                toast.error(`Unable to 'create' report. Error: ${error}`)
                return null
            }
            toast.success(`Report created!`)
            setReportName("")
            return data
            
        } finally {
            setShowReportForm(false)
        }
    }

    function renderMeterDropdown(list: (UtilityMeter | VirtualMeter | MeterGroup)[]) {
        if (!hasValue(filters?.utilityMeterType)) return null

        const meters = (list || []).filter(m => (m.meterType == filters?.utilityMeterType))

        return <MultiSelect
            selected={filters?.targetIds || []}
            onChange={v => updateFilters({ targetIds: v })}
            options={meters}
            labelField="displayName"
            valueField="meterId"
        />
    }

    function renderMeterSelection() {
        if (!hasValue(filters?.targetType)) return null
        switch (filters?.targetType) {
            case TargetType.UtilityMeters: return renderMeterDropdown(utilityMeters || [])
            case TargetType.VirtualMeters: return renderMeterDropdown(virtualMeters || [])
            case TargetType.MeterGroups: return renderMeterDropdown(meterGroups || [])
            default: return null
        }
    }

    function renderTargeSelection() {

        if (filters?.targetType == TargetType.Tags) {
            return <FilterSection
                title="Target"
                error={filterErrors['tags']}
                hide={canHideFilter('tags')}
            >
                <MultipleTagInput
                    value={filters?.tags || {}}
                    onChange={(val) => {
                        updateFilters({ tags: val });
                    }}
                    tags={tags || []}
                    locations={{
                        enable: true,
                        locations: locations || [],
                        generatePathFromKey: true,
                        includeLeadingSlash: true
                    }}
                    returnPathOnSelect={true}
                />
            </FilterSection>
        }

        return <FilterSection
            title="Target"
            error={filterErrors['targetIds']}
            hide={canHideFilter('targetIds')}
        >
            {renderMeterSelection()}
        </FilterSection>
    }

    function renderSelectedTags() {
        if (!!filters?.tags && Object.keys(filters?.tags).length > 0) {

            const _selectedTags = Object.entries(filters?.tags)?.reduce((a, [type, value]) => {
                const inst = type.toLowerCase() == 'location'
                    ? (locations || []).find(l => {
                        const parts = value?.split('/')
                        const locId = parts[parts.length - 1]

                        return l.LocationKey == locId
                    })
                    : (tags || []).find(t => t.path == value)
                if (inst) a.push(`${_.capitalize(type)}: ${type.toLowerCase() == 'location' ? (inst as ILocation).LocationName : (inst as Tag).name}`)
                return a
            }, []);

            return <div className="ums_consumption_chart__applied_filters" >
                {joinParts(_selectedTags, " | ", true)}
            </div>
        }
        return null

    }

    function getVisualizationOptions() {
        const opts = generateLabelValuePairsFromEnum(VisualizationType).map(r => ({ ...r, icon: `/Resources/ESGNOW/dashboard/images/charts-colored/${r.value}.svg` }))

        if (filters?.enableGrouping) {
            return [...opts].filter(o => ([VisualizationType.BarChart, VisualizationType.ColumnChart, VisualizationType.DonutChart].includes(o.value as VisualizationType)))
        }
        return opts
    }

    function renderBaseChart(): React.ReactNode {
        const showFooter = (filters?.targetType != TargetType.UtilityMeters && filters?.targetType != TargetType.Tags)
        return <div className={classNames("ums_consumption_chart__chart_container", { 'ums_consumption_chart__chart_container--has-footer': showFooter })}>
            <div className="ums_consumption_chart__chart_filters">

                <DateRangePicker
                    title="date range"
                    startDate={filters?.startDate || ''}
                    endDate={filters?.endDate || ''}
                    preset={filters?.dateRangePreset || ''}
                    onChange={(s, e, pr) => {
                        setZoomHistory([]);
                        updateFilters({ startDate: s, endDate: e, dateRangePreset: pr });
                    }}
                    presets={{
                        enable: true
                    }}
                    renderAsPill={{
                        minWidth: 20
                    }}
                />
                {renderSelectedTags()}

                {!reportView && <div className="ums_consumption_chart__applied_filters" onClick={() => { setExpand(true) }} >
                    Filters({(filters && Object.entries(filters).reduce((a, [key, val]) => (hasValue(val) ? a + 1 : a), 0))})
                </div>}
                {expand && <Select
                    options={getVisualizationOptions()}
                    onChange={v => setVisualizationType(v as VisualizationType)}
                    selected={visualizationType}
                    iconField='icon'
                    renderPlaceholder={{
                        renderAsPill: {
                            maxWidth: 200,
                            minWidth: 100,
                        },
                        renderCustomPill: (clear) => {
                            let selected = generateLabelValuePairsFromEnum(VisualizationType).find(x => x.value == visualizationType);
                            return <div className='consumption-chart-selection'>
                                <div className='consumption-chart-selection-icon' style={{ backgroundImage: `url(/Resources/ESGNOW/dashboard/images/charts-colored/${selected?.value}.svg)` }} />
                                <div className='consumption-chart-selection-chart-type'>{selected?.label || 'Chart Type'}</div>
                            </div>
                        }
                    }}
                />}
                {(zoomHistory.length > 0) ? <div className='ums_consumption_chart__zoom_btn'>
                    <Button icon='fas search-minus' title='Zoom out' onClick={zoomOut} />
                </div> : null}
                {!reportView ? <div className="ums_consumption_chart__export_btn">
                    <Button
                        icon='fas cloud-download-alt'
                        title='Export'
                        onClick={exportData}
                    />
                   {expand && <span className='more_btn'>
                        <Button
                            icon='fas chart-line'
                            title='Save As Report'
                            onClick={() => {
                                setShowReportForm(true);
                                setReportName("")
                            }}
                        />
                    </span>}
                </div> : null}
            </div>

            {(!validateFilters()?.isValid ? <div className='ums_consumption_chart__error'>Invalid filters. Please configure them to load the data</div> : null)}
            {console.log('filter_errors_', validateFilters()?.errors, filters)}
            <div className="ums_consumption_chart__chart">
                {
                    loadingData
                        ? <Loading />
                        : <>
                            {
                                (visualizationType == VisualizationType.DonutChart
                                    ? <DonutChartComponent data={processData()} />
                                    : <ComposedChartComponent
                                        data={processData()}
                                        vertical={visualizationType == VisualizationType.ColumnChart}
                                        onZoom={(s, e) => zoomIn(s, e)}
                                        uxpContext={uxpContext}
                                    />
                                )
                            }
                        </>
                }
            </div>

            {(showFooter) &&
                <div className="ums_consumption_chart__chart_footer">
                    <div className="ums_consumption_chart__chart_footer_left">
                        View Contributions
                    </div>
                    <div className="ums_consumption_chart__chart_footer_right">
                        <Button
                            title='View'
                            onClick={() => setShowContributions(true)}
                        />
                    </div>
                </div>
            }
        </div>
    }

    function canHideFilter(field: HideFilterOptions) {
        return (props?.hideFilters || []).includes(field)
    }

    function getTargetNames() {
        if ([TargetType.VirtualMeters, TargetType.MeterGroups].includes(filters?.targetType) && filters?.targetIds?.length > 0) {
            return (filters?.targetIds || []).map(t => findMeterDetails(t, utilityMeters, virtualMeters, meterGroups)?.displayName).filter(n => !!n)
        }
        else if (filters?.targetType == TargetType.Tags && Object.keys(filters?.tags)?.length > 0) {
            return (Object.values(filters?.tags).map(t => {
                const tag = findTagDetails(t, tags, locations)
                return (tag as ILocation)?.LocationName || (tag as Tag)?.name || null
            })).filter(n => !!n)
        }

        return []
    }

    function renderContributionsModalHeader() {

        const targetNames = getTargetNames()

        return <div className='ums_contributions_chart_modal_header'>
            Contributions for &nbsp;{targetNames?.[0] || 'N/A'}
            {
                targetNames?.length > 1
                    ? <>
                        <DropDownButton
                            showOnHover
                            content={() => <>
                                {(targetNames.slice(1).map(n => (<div style={{ padding: '4px 10px' }} key={n}>{n}</div>)))}
                            </>}
                        >
                            &nbsp;and {(targetNames?.length - 1)} more {getLabelFonmEnum(filters?.targetType, TargetType)}
                        </DropDownButton>
                    </>
                    : null
            }
        </div>
    }

    function renderReportFormModalHeader() {
        const targetNames = getTargetNames()

        return <div className='ums_report_form_header'>
            Report Form
        </div>
    }
    
    console.log('UNITFILTER',filters?.unit);
    return <WidgetWrapper className={classNames('ums_consumption_chart__container', { 'ums_consumption_chart__container--hide-shadow': props.hideShadow })}>
        <div className="ums_consumption_chart__header uxp-drag-handler">
            <div className={`ums_consumption_chart__title ${reportView ? "report-title" : ""}`}>{title || 'Consumption'}</div>
            {!reportView && <div className="ums_consumption_chart__filters">

                <div className="ums_consumption_chart__expand_btn" onClick={() => {
                    setExpand(true)
                }} >
                    <FontAwesomeIcon icon={['fas', 'sliders-h']} />
                </div>
            </div>}
        </div>

        {renderBaseChart()}

        <Modal
            show={expand}
            onClose={() => { setExpand(false) }}
            headerContent={<div style={{ display: 'flex', width: '100%', marginRight: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>View and Filter</div>
                <div>
                    {uxpContext.hasAppRole('UMS', 'canconfigurepages') ?
                        <Button title='Save Filters' onClick={() => {
                            props.onWidgetPropsChange(props.instanceId, {
                                visualizationType: visualizationType,
                                filters: filters
                            })
                        }}
                        />
                        : null}

                </div>
            </div>}
            title="View and Filter"
            className="ums_consumption_chart_modal"
        >
            <div className="ums_consumption_chart_expanded__container">
                <div className="ums_consumption_chart_expanded__chart_container">
                    <div className="ums_consumption_chart_expanded__chart_chart">
                        {renderBaseChart()}
                    </div>
                </div>
                <div className="ums_consumption_chart_expanded__filter_container">
                    <div className="ums_consumption_chart_expanded__filters">

                        <FilterSection
                            title="Utility Type"
                            error={filterErrors['utilityMeterType']}
                            hide={canHideFilter('utilityMeterType')}
                        >
                            <Select
                                selected={filters?.utilityMeterType || ''}
                                onChange={v => updateFilters({ utilityMeterType: v })}
                                options={meterTypes || []}
                                labelField="name"
                                valueField="name"
                                placeholder='select'
                                onClear={() => updateFilters({ utilityMeterType: null })}
                            />
                        </FilterSection>

                        {hasValue(filters?.utilityMeterType) ?
                            <FilterSection
                                title="Unit"
                                error={filterErrors['unit']}
                                hide={canHideFilter('unit')}
                            >
                                <Select
                                    selected={filters?.unit || ''}
                                    onChange={v => updateFilters({ unit: v })}
                                    options={getUnits()}
                                    onClear={() => updateFilters({ unit: null })}
                                />
                            </FilterSection>
                            : null}

                        <FilterSection
                            title="Target Type"
                            error={filterErrors['targetType']}
                            hide={canHideFilter('targetType')}
                        >
                            <Select
                                selected={filters?.targetType || ''}
                                onChange={v => updateFilters({ targetType: v, targetIds: null, tags: {} })}
                                options={generateLabelValuePairsFromEnum(TargetType)}
                                onClear={() => updateFilters({ targetType: null, targetIds: null, tags: {} })}
                            />
                        </FilterSection>


                        {renderTargeSelection()}

                        {
                            [VisualizationType.BarChart, VisualizationType.ColumnChart, VisualizationType.DonutChart].includes(visualizationType)
                                ? <FormField>
                                    <Checkbox
                                        checked={filters?.enableGrouping}
                                        onChange={v => {
                                            const temp: any = { enableGrouping: v }
                                            if (!v) {
                                                temp.group = null
                                                temp.tagGroup = null
                                            }
                                            updateFilters(temp)
                                        }}
                                        label='Enable Grouping'
                                    />
                                </FormField>
                                : null
                        }

                        {
                            ([VisualizationType.BarChart, VisualizationType.ColumnChart, VisualizationType.DonutChart].includes(visualizationType) && filters?.enableGrouping)
                                ? <>
                                    <FilterSection
                                        title="Group"
                                        error={filterErrors['group']}
                                        hide={canHideFilter('group')}
                                    >
                                        <Select
                                            selected={filters?.group || ''}
                                            onChange={v => updateFilters({ group: v })}
                                            options={generateLabelValuePairsFromEnum(Group)}
                                            onClear={() => updateFilters({ group: null })}
                                        />
                                    </FilterSection>

                                    <FilterSection
                                        title="Aggregation"
                                        error={filterErrors['aggregation']}
                                        hide={canHideFilter('aggregation')}
                                    >
                                        <Select
                                            selected={filters?.aggregation || ''}
                                            onChange={v => updateFilters({ aggregation: v })}
                                            options={generateLabelValuePairsFromEnum(Aggregation)}
                                            onClear={() => updateFilters({ aggregation: null })}
                                        />
                                    </FilterSection>

                                    {
                                        (filters?.targetType == TargetType.Tags)
                                            ? <FilterSection
                                                title="Tag Group"
                                                error={filterErrors['tagGroup']}
                                                hide={canHideFilter('tagGroup')}
                                            >
                                                <Select
                                                    selected={filters?.tagGroup || ''}
                                                    onChange={v => updateFilters({ tagGroup: v })}
                                                    options={[...tagTypes, 'Location'].map(t => ({ label: t, value: t }))}
                                                    onClear={() => updateFilters({ tagGroup: null })}
                                                />
                                            </FilterSection>

                                            : null
                                    }
                                </>

                                : <FilterSection
                                    title="Bucket"
                                    error={filterErrors['bucket']}
                                    hide={canHideFilter('bucket')}
                                >
                                    <Select
                                        selected={filters?.bucket || ''}
                                        onChange={v => updateFilters({ bucket: v, group: null, tagGroup: null })}
                                        options={generateLabelValuePairsFromEnum(Bucket)}
                                        onClear={() => updateFilters({ bucket: null })}
                                    />
                                </FilterSection>
                        }

                        <FilterSection
                            title="Baseline"
                            hide={!showBaseline}
                        >
                            <Select
                                selected={selectedBaseline || ''}
                                onChange={v => setSelectedBaseline(v)}
                                options={
                                    (Object.keys(configuredBaselines || {})
                                        .map(b => {
                                            const baseline = baselineTypes.find(bt => bt.id == b)
                                            if (!baseline) return null
                                            return { label: baseline.name, value: baseline.id }
                                        })
                                        .filter(b => !!b)
                                    )}
                                onClear={() => setSelectedBaseline(null)}
                            />
                        </FilterSection>

                        <FilterSection
                            title='Compare With Previous consumption'
                            hide={!showComparisonFilter}
                        >
                            <ToggleFilter
                                value={toStr(filters?.compareRanges || '0')}
                                onChange={v => updateFilters({ compareRanges: toNum(v) })}
                                options={[
                                    { label: "Don't Compare", value: '0' },
                                    { label: "Last one period ", value: '1' },
                                    { label: "Last two periods", value: '2' },
                                ]}
                            />
                        </FilterSection>

                    </div>
                </div>
            </div>
        </Modal>

        <Modal
            show={showContributions && filters?.targetType != TargetType.UtilityMeters && (filters?.targetIds?.length > 0 || Object.keys(filters?.tags)?.length > 0)}
            onClose={() => { setShowContributions(false) }}
            title=''
            className='ums_contributions_chart_modal'
            headerContent={renderContributionsModalHeader()}
        >
            <Contributions
                uxpContext={uxpContext}
                utilityType={filters?.utilityMeterType}
                meterType={filters?.targetType as any}
                startDate={filters?.startDate}
                endDate={filters?.endDate}
                meterIds={filters?.targetIds}
            />
        </Modal>

        <Modal
            show={showReportForm}
            onClose={() => { setShowReportForm(false) }}
            title=''
            className='ums_report_form_modal'
            headerContent={renderReportFormModalHeader()}
        >
            <Label>Report Name</Label>
            <Input value={reportName} onChange={setReportName}></Input>
            <Button title={'Save'} onClick={saveAsReport}></Button>
        </Modal>

    </WidgetWrapper >
}


interface ComposedChartComponentProps {
    data: ProcessedData
    vertical?: boolean
    onZoom: (start: string | Date, end: string | Date) => void;
    uxpContext: IContextProvider
}
function getBarWidthForDataCount(count: number) {
    if (count > 30) return 7;
    if (count > 10) return 15;
    return 20;
}
function getBarRadiusForDataCount(count: number) {
    if (count > 30) return 10;
    if (count > 10) return 5;
    return 3;
}
const ComposedChartComponent: React.FC<ComposedChartComponentProps> = (props) => {


    const [refAreaLeft, setRefAreaLeft] = React.useState<any>(null);
    const [refAreaRight, setRefAreaRight] = React.useState<any>(null);
    const [isZooming, setIsZooming] = React.useState(false);

    const { data, vertical, uxpContext } = props;
    const PreviousDataLabelRegexp = /^Previous(\d+):(.+)$/;

    console.log('_chrtat___caadata', data)

    const maxReading = (data.data || []).reduce((a, b) => (Math.max(a, toNum(b?.['Consumption']), toNum(b?.['Current']), toNum(b?.['Previous1']), toNum(b?.['Previous2']), toNum(b?.['Baseline']))), 0)
    const maxValue = maxReading + maxReading * 0.1

    const fixedColors: Record<string, string> = {
        Consumption: "#9370DB",
        Current: "#9370DB",
        Previous1: "#FEB56A",
        Previous2: "#D568FB",
        Baseline: "#FE6A35",
    };



    const chartTypeMapping: Record<string, any> = {
        [VisualizationType.LineChart]: Line,
        [VisualizationType.BarChart]: Bar,
        [VisualizationType.ColumnChart]: Bar,
        [VisualizationType.AreaChart]: Area,
        'Baseline': Line
    }

    const labelColorMapping: { [label: string]: string } = {}

    // Function to get color based on key
    function getColorForKey(key: string, dynamicKeyIndex: number): string {
        if (key in fixedColors) {
            return fixedColors[key];
        }

        if (key in labelColorMapping) return labelColorMapping[key]

        const match = key?.match(PreviousDataLabelRegexp)
        if (match) {
            const [val, number, originalLabel] = match

            const originalIndex = data.chartLabels.findIndex(d => d == originalLabel)
            const originalColor = (originalLabel in labelColorMapping)
                ? labelColorMapping[originalLabel]
                : DynamicColors[(originalIndex > -1 ? originalIndex : dynamicKeyIndex) % DynamicColors.length];

            if (originalIndex > -1) {
                const _color = tinycolor(originalColor).darken((15 * toNum(number, 1))).toHexString()
                labelColorMapping[key] = _color
                return _color
            }

            labelColorMapping[key] = originalColor
            return originalColor
        }

        const c = DynamicColors[dynamicKeyIndex % DynamicColors.length];
        labelColorMapping[key] = c
        return c
    }
    function renderDataSeries() {
        const series = [];
        const radius = getBarRadiusForDataCount(data?.data?.length || 0);
        const maxBarSize = getBarWidthForDataCount(data?.data?.length || 0);
        const visualizationType = data.chartType || "bar"; // Default to bar
        const yAxisId = "y1"; // Assuming a single y-axis

        // Common properties for charts
        const commonProps: any = {
            maxBarSize,
            radius: [radius, radius, 0, 0],
            yAxisId,
        };



        // Render series without tag grouping 
        for (const [index, key] of data.chartLabels.entries()) {
            const fillColor = getColorForKey(key, index);

            if (data.tagGrouping) commonProps.stackId = (key?.startsWith('Previous1') ? 'Previous1' : key?.startsWith('Previous2') ? 'Previous2' : 'Current')

            // Choose chart type dynamically
            const ChartComponent = (key == 'Baseline') ? chartTypeMapping['Baseline'] : chartTypeMapping[visualizationType]

            if (key == 'Baseline') commonProps.dot = false

            series.push(
                React.createElement(ChartComponent, {
                    key,
                    dataKey: key,
                    fill: fillColor,
                    stroke: fillColor,
                    barCategoryGap: "20%",
                    ...commonProps,
                })
            );
        }
        return series;
    }

    const labelStyle = { fill: uxpContext.theme.primaryTextColor };
    const tickStyle = { fill: uxpContext.theme.primaryTextColor };

    function renderXAxis() {
        if (vertical) {
            return (
                <XAxis
                    type="number"
                    label={{
                        value: `${data.yAxisLabel} (${data.unit})`,
                        position: 'insideBottom',
                        offset: -15,
                        style: labelStyle
                    }}
                    domain={[0, roundOffValue(maxValue, { decimalPoints: 2 })]}
                    tick={{ style: tickStyle }}
                />
            );
        }
        return (
            <XAxis
                dataKey="label"
                label={{
                    value: data?.xAxisLabel || 'Time Period',
                    offset: -15,
                    position: 'insideBottom',
                    style: labelStyle
                }}
                minTickGap={20}
                tick={{ style: tickStyle }}
            />
        );
    }

    function renderYAxis() {
        if (vertical) {
            return (
                <YAxis
                    yAxisId={'y1'}
                    type="category"
                    dataKey="label"
                    label={{
                        value: data?.xAxisLabel || 'Time Period',
                        position: 'insideLeft',
                        angle: -90,
                        offset: 20,
                        style: labelStyle
                    }}
                    scale="band"
                    width={data.yAxisWidth || 150}
                    tick={{ style: tickStyle }}
                />
            );
        }
        return (
            <YAxis
                yAxisId={'y1'}
                label={{
                    value: `${data.yAxisLabel} (${data.unit})`,
                    position: 'insideLeft',
                    angle: -90,
                    offset: 20,
                    style: labelStyle
                }}
                width={data.yAxisWidth || 150}
                tickLine={false}
                tickFormatter={(tick) => `${formatNumber(tick, 0, props.data.unit)}`}
                domain={[0, roundOffValue(maxValue, { decimalPoints: 2 })]}
                tick={{ style: tickStyle }}
            />
        );
    }

    function getMaxValueKey(datum: any) {
        return Object.entries(datum)
            .reduce((maxKey: string | number, [key, value]) => (typeof value === "number" && (maxKey === null || (value > (datum[maxKey] as number))) ? key : maxKey), null);
    }



    function getPeakConsumption() {

        function appendMaxConsumption(datum: ChartData): ChartData {
            const totals: { [key: number]: number } = { 0: 0, 1: 0, 2: 0 }
            for (const dataLabel of Object.keys(datum)) {

                if (data.chartLabels.includes(dataLabel)) {
                    const match = dataLabel.match(PreviousDataLabelRegexp)
                    if (match) {
                        const [val, number] = match
                        totals[Number(number)] += (datum[dataLabel] as number)
                    }
                    else totals[0] += (datum[dataLabel] as number)
                }
            }

            const maxValLabel = getMaxValueKey(totals)
            datum.maxConsumption = totals[maxValLabel as number]
            return datum
        }

        if (data.tagGrouping) {
            const maxDatum = data.data.reduce((max: ChartData, current) => {
                const updatedDatum = appendMaxConsumption(current)
                if (max == null) return updatedDatum
                if (current['maxConsumption'] > max?.['maxConsumption']) return updatedDatum
                return max
            }, null)

            return { datum: maxDatum, label: 'maxConsumption' }
        }

        return (data.data.reduce((max: { datum: ChartData, label: string }, current) => {
            const maxValLabel = getMaxValueKey(current)
            if (max?.datum == null) return { datum: current, label: maxValLabel }
            if (current[maxValLabel] > max?.datum?.[max?.label]) return { datum: current, label: maxValLabel }
            return max
        }, { datum: null, label: null }))
    }

    function renderPeakConsumption() {
        const { datum, label } = getPeakConsumption()
        return <div className="ums_consumption_composed_chart__analytics__section">
            <div className="ums_consumption_composed_chart__analytics__title">Peak Consumption </div>
            <div className="ums_consumption_composed_chart__analytics__value"> {formatNumber(datum?.[label], 0, data.unit)} </div>
            <div className="ums_consumption_composed_chart__analytics__subtitle">{datum?.label || 'N/A'}</div>
        </div>
    }

    function countKeysInObject(
        obj: Record<string, any>,
        keysToCheck: string[],
        keysToSkip: string[] = []
    ): number {
        // Create a Set for keys to skip for efficient lookups
        const skipSet = new Set(keysToSkip);

        // Filter the keysToCheck, excluding keys in keysToSkip, then count how many exist in the object
        return keysToCheck.filter(key => !skipSet.has(key) && key in obj).length;
    }


    function calculateSavings() {
        let totalConsumption = 0, totalBaseline = 0;

        for (const d of data.data) {
            for (const l of data.chartLabels) {
                if (l == 'Baseline') totalBaseline += (toNum(d[l], 0) * countKeysInObject(d, data.chartLabels, ['Baseline']))
                else totalConsumption += toNum(d[l], 0)
            }
        }

        return (totalBaseline - totalConsumption)
    }

    function renderSavings() {

        if (data.data.some(d => 'Baseline' in d)) {
            const savings = calculateSavings()
            return <div className="ums_consumption_composed_chart__analytics__section">
                <div className="ums_consumption_composed_chart__analytics__title">Savings</div>
                <div className="ums_consumption_composed_chart__analytics__value"> {formatNumber(savings, 0, data.unit)} </div>
            </div>
        }

        return null
    }

    const canZoom = (data.chartType == VisualizationType.AreaChart || data.chartType == VisualizationType.BarChart
        || data.chartType == VisualizationType.LineChart
    ) && (!data.grouping && !data.tagGrouping);
    return (
        <div className={classNames("ums_consumption_composed_chart__container")}>

            {/* Analytics Summary Section */}
            <div className="ums_consumption_composed_chart__analytics">
                {renderPeakConsumption()}
                {renderSavings()}
            </div>

            {/* Chart */}
            <div className="ums_consumption_composed_chart__chart" style={{ userSelect: 'none' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart

                        onMouseDown={(e: any) => {
                            if (canZoom) {

                                setIsZooming(true);
                                setRefAreaRight(null);
                                setRefAreaLeft({ x: e.activeLabel, value: e.activePayload?.[0]?.payload?.sortValue })
                            }
                        }}
                        onMouseMove={(e: any) => {
                            if (canZoom && refAreaLeft?.value && isZooming) {
                                setRefAreaRight({ x: e.activeLabel, value: e.activePayload?.[0]?.payload?.sortValue });
                            }
                        }}
                        onMouseUp={() => {
                            if (canZoom) {
                                setIsZooming(false);
                                let [s1, e1] = [refAreaLeft?.value, refAreaRight?.value];
                                let startVal = toDate(refAreaLeft?.value);
                                let endVal = toDate(refAreaRight?.value);
                                if (endVal < startVal) {
                                    [e1, s1] = [s1, e1];
                                }
                                if (s1 && e1) {
                                    props.onZoom(s1, e1);
                                }

                            }
                        }}

                        width={100}
                        height={100}
                        data={data.data || []}
                        margin={{
                            top: 50,
                            right: 50,
                            bottom: 50,
                            left: vertical ? 10 : 100,
                        }}
                        layout={vertical ? 'vertical' : 'horizontal'}
                    >
                        <CartesianGrid vertical={vertical} horizontal={!vertical} stroke="#f5f5f5" />

                        {renderXAxis()}
                        {renderYAxis()}
                        <Tooltip formatter={(value: number) => `${formatNumber(value, 0, props.data.unit)}`} />

                        <Legend
                            align="right"
                            verticalAlign="top"
                            wrapperStyle={{ paddingBottom: 10 }}
                        />


                        {renderDataSeries()}
                        {(refAreaLeft && refAreaRight && isZooming) ? (
                            <ReferenceArea yAxisId="y1" x1={refAreaLeft?.x} x2={refAreaRight?.x} fill='#EEEEEE' fillOpacity={0.5} strokeOpacity={0.3} />
                        ) : null}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

        </div>
    );
}


interface DonutChartComponentProps {
    data: ProcessedData,
}
const DonutChartComponent: React.FC<DonutChartComponentProps> = (props) => {

    const { data } = props
    // const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6699', '#BEBEBE', '#D5B668', '#3B8EA5', '#A3D9FF', '#FF6F61', '#6A5ACD', '#FFD700', '#7B68EE', '#FF4500', '#32CD32', '#ADFF2F', '#FF1493', '#7FFF00', '#6B8E23', '#FF6347', '#4682B4', '#FF8C00', '#E6E6FA', '#DDA0DD', '#20B2AA', '#FFDAB9', '#FF69B4', '#CD5C5C', '#F0E68C', '#D2691E', '#BC8F8F', '#F08080'];
    const colors = DynamicColors;

    // const chartData = (data.data || []).map(d => ({ ...d, name: d.label }))
    const labelValueMap: { [key: string]: number } = {};
    for (let row of data.data || []) {
        for (const ul of data.chartLabels) {
            if (!labelValueMap[ul]) labelValueMap[ul] = 0;
            labelValueMap[ul] += Number(row[ul]) || 0;
        }
    }
    const chartData = Object.entries(labelValueMap).map(([label, value]) => ({ label, value, name: label }));

    function renderCustomizedLabel(labelProps: any) {
        const { innerRadius, outerRadiusm, x, y, cx, cy, label, value, fill } = labelProps

        return (
            <text x={x} y={y}
                fill={fill}
                textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"
            >
                {`${label} - ${formatNumber(value, 0, props.data.unit)}`}
            </text>
        );
    };
    return <ResponsiveContainer width="100%" height='100%'>

        <PieChart>
            <Pie
                data={chartData || []}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={90}
                fill="#8884d8"
                isAnimationActive={false}
                label={renderCustomizedLabel}
                startAngle={90}
                endAngle={-270}
            >
                {(chartData || []).map((entry, index) => (
                    <Cell
                        key={`cell-${index}`}
                        fill={colors[index % colors.length]}
                    />
                ))}
            </Pie>

            <Tooltip formatter={(value: number) => `${formatNumber(value, 0, props.data.unit)}`} />

            <Legend
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
                iconType="circle"
                formatter={(value) => <span style={{ padding: '6px', marginLeft: '5px' }}>{value}</span>}
            />
        </PieChart>
    </ResponsiveContainer>
}