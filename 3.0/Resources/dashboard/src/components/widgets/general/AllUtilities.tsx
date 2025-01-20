import { IContextProvider } from '@uxp';
import React, { useEffect } from 'react';
import { CRUDComponent, DateRangePicker, DefaultLoader, Loading, LoadingSpinner, Select, TitleBar, toDate, useUpdateWidgetProps, WidgetWrapper } from "uxp/components";
import './AllUtilities.scss';
import { getAllBaselineTypes, getAllUtilityMeterTypes, getAnalyticsForTags, getLocationData } from '@ums-service';
import { BaselineType, BaseWidgetProps, ILocation, UtilityMeterType } from '@types';
import { LocationTreeInput } from '@components/common/CustomInputs';
import { getAllLocations } from '@other-services';

import { formatNumber, getEndDate, getStartDate } from '@utils';
import { Deviation } from '@components/common/Deviation';
interface IWidgetProps extends BaseWidgetProps {
    baseline: string;
    locationKey: string;
    locationPath: string;
}
function getTypeIcon(t: string) {
    return '/Resources/ESGNOW/dashboard/images/' + t.toLowerCase() + '.svg';
}
export const AllUtilitiesOverview: React.FC<IWidgetProps> = (props) => {
    const [types, setTypes] = React.useState<UtilityMeterType[]>([]);
    const [baselines, setBaselines] = React.useState<BaselineType[]>([]);
    const [locations, setLocations] = React.useState([]);
    const [startDate, setStartDate] = React.useState<Date | string>('-12m');
    const [endDate, setEndDate] = React.useState<Date | string>('0d');
    const [datePreset, setDatePreset] = React.useState('');
    const [typeStatus, setTypeStatus] = React.useState<{ [type: string]: boolean }>({});
    const [typeData, _setTypeData] = React.useState<{ [type: string]: { data?: any, error?: any } }>({});
    const [baselineValues, setBaselineValues] = React.useState<any>({});

    const [locationKey, setLocationKey] = React.useState(props.locationKey||'');
    const [location, setLocation] = React.useState(props.locationPath||'');
    const [baseline, setBaseline] = React.useState(props.baseline||'');

    // const propUpdater = useUpdateWidgetProps();
    // const propUpdater = props.onWidgetPropsChange;
    // useEffect(()=>{
    //     const updatedProps = {baseline,location:{key:locationKey,name:location}};
    //     propUpdater(props.instanceId,updatedProps);
    //     console.log('leprops',updatedProps);
    // },[locationKey,location,baseline]);
    // console.log('leprops got updated props',props);


    useEffect(() => {
        getAllUtilityMeterTypes(props.uxpContext).then(({ data, error }) => {
            if (error) throw error;
            setTypes(data);
        }).catch(console.error);

        getAllLocations(props.uxpContext).then(({ data, error }) => {
            if (error) {
                setLocations([])
                return;
            }

            setLocations(data)
        });
        getAllBaselineTypes(props.uxpContext).then(({ data, error }) => {
            if (error) {
                setBaselines([]);
                return;
            }
            setBaselines(data);
        });
    }, []);
    function setTypeLoading(type: string, loading: boolean) {
        setTypeStatus((s) => ({ ...s, [type]: loading }));
    }
    function setTypeData(type: string, data: any, error: any) {
        _setTypeData((s) => ({ ...s, [type]: { data, error } }));
    }
    function getBaseUnit(type: UtilityMeterType) {
        let units = Object.keys(type.unitConversion);
        for (let unit of units) {
            if (type.unitConversion[unit] == 1) return unit;
        }
        return units[0];

    }
    async function loadTypeAnalytics(type: UtilityMeterType) {
        setTypeLoading(type.id, true);

        let { data, error } = await getAnalyticsForTags(props.uxpContext, type.name, {
            bucket: '10y',
            end: getEndDate(toDate(endDate)),
            start: getStartDate(toDate(startDate)),
            tagGroup: '',
            unit: getBaseUnit(type),
        }, { location });
        setTypeLoading(type.id, false);
        let finalValue = data?.consumptions?.[0].value || null;
        setTypeData(type.id, finalValue, error);
        if (error) {
            console.error(error);
        }
    }
    useEffect(() => {
        if (!types || types.length == 0) return;
        if (!location) return;
        Promise.all(types.map(loadTypeAnalytics))
            .then(() => {

            }).catch((r: any) => {
                console.error(r);
            });

    }, [startDate, endDate, datePreset, location, types]);
    useEffect(() => {
        if (!locationKey) return;
        getLocationData(props.uxpContext, locationKey)
            .then(({ data, error }) => {
                let baselineValues = data?.baselines;
                setBaselineValues(baselineValues);
            });
    }, [location, baseline])
    useEffect(()=>console.log('BASELINE',baseline),[baseline]);

    let ed = toDate(endDate);
    let sd = toDate(startDate);
    let timePassed = Number(ed) - Number(sd);
    let days = timePassed / (1000 * 3600 * 24);


    return (
        <WidgetWrapper className='all-utilities-widget'

        >
            <TitleBar title={'Utility Baseline Comparison '}>
                <div style={{ display: 'flex' }}>
                    <DateRangePicker
                        title="date range"
                        startDate={startDate || ''}
                        endDate={endDate || ''}
                        preset={datePreset}
                        onChange={(s, e, pr) => {
                            setStartDate(s);
                            setEndDate(e);
                            setDatePreset(pr);

                        }}
                        presets={{
                            enable: true
                        }}
                        renderAsPill={{
                            minWidth: 320
                        }}
                    />
                    <LocationTreeInput
                        selected={location}
                        onChange={(p, node) => {
                            setLocation(p);
                            setLocationKey(node?.original?.LocationKey);
                        }}
                        locations={locations as ILocation[]}
                        generatePathFromKey={true}
                        includeLeadingSlash={true}
                        returnPathOnSelect={true}
                    />
                    <Select options={baselines} valueField='id' labelField='name' selected={baseline}
                        onChange={setBaseline} placeholder='Select baseline' />

                </div>
            </TitleBar>
            <div className={'all-utilities-widget-container'}>
                {types.map((item, index) => {
                    let { data, error } = typeData[item.id] || { data: null, error: null };
                    let loading = typeStatus[item.id];
                    let baselineValue = baselineValues?.[item.name]?.[baseline];
                    let baselineConsumption = Number(baselineValue)*days;
                    return <div key={index} className={'all-utilities-widget-container-card card-' + item.name.toLowerCase().replace(/\s/g, '')}>
                        <div className={'all-utilities-widget-container-header'} >
                            <span className={'all-utilities-widget-container-icon-container'} >
                                <span className={'all-utilities-widget-container-icon'} />
                            </span>
                        </div>
                        <div className='all-utilities-widget-container-body'>
                            <h3>{item.displayName}</h3>
                            {/* {item.change && <div className={'all-utilities-widget-container-change'}>⬇️ {item.change}</div>} */}
                        </div>
                        <div className={'all-utilities-widget-container-footer'} >
                            {
                                loading ? <DefaultLoader /> : error ?
                                    <div className='loading-error' /> :
                                    formatNumber(data, 0, getBaseUnit(item))
                            }
                            {/* {item.total} */}
                        </div>
                        {
                            baselineValue && <>
                                <Deviation value={data} baseline={baselineConsumption} showPercentage={true} />
                            </>
                        }
                    </div>
                })}
            </div>
        </WidgetWrapper>
    );
};

export const AllUtilitiesBenchmark: React.FC<IWidgetProps> = (props) => {
    const [types, setTypes] = React.useState<UtilityMeterType[]>([]);
    const [baselines, setBaselines] = React.useState<BaselineType[]>([]);
    const [location, setLocation] = React.useState(props.locationPath || '');
    const [locationKey, setLocationKey] = React.useState(props.locationKey||'');
    const [locations, setLocations] = React.useState([]);
    const [startDate, setStartDate] = React.useState<Date | string>('-12m');
    const [endDate, setEndDate] = React.useState<Date | string>('0d');
    const [datePreset, setDatePreset] = React.useState('');
    const [typeStatus, setTypeStatus] = React.useState<{ [type: string]: boolean }>({});
    const [typeData, _setTypeData] = React.useState<{ [type: string]: { data?: any, error?: any } }>({});
    const [baseline, setBaseline] = React.useState(props.baseline || '');
    const [baselineValues, setBaselineValues] = React.useState<any>({});

    useEffect(() => {
        getAllUtilityMeterTypes(props.uxpContext).then(({ data, error }) => {
            if (error) throw error;
            setTypes(data);
        }).catch(console.error);

        getAllLocations(props.uxpContext).then(({ data, error }) => {
            if (error) {
                setLocations([])
                return;
            }

            setLocations(data)
        });
        getAllBaselineTypes(props.uxpContext).then(({ data, error }) => {
            if (error) {
                setBaselines([]);
                return;
            }
            setBaselines(data);
        });
    }, []);

    useEffect(()=>console.log('BASELINE',baseline),[baseline]);

    function setTypeLoading(type: string, loading: boolean) {
        setTypeStatus((s) => ({ ...s, [type]: loading }));
    }
    function setTypeData(type: string, data: any, error: any) {
        _setTypeData((s) => ({ ...s, [type]: { data, error } }));
    }
    function getBaseUnit(type: UtilityMeterType) {
        let units = Object.keys(type.unitConversion);
        for (let unit of units) {
            if (type.unitConversion[unit] == 1) return unit;
        }
        return units[0];

    }
    async function loadTypeAnalytics(type: UtilityMeterType) {
        setTypeLoading(type.id, true);

        let { data, error } = await getAnalyticsForTags(props.uxpContext, type.name, {
            bucket: '10y',
            end: getEndDate(toDate(endDate)),
            start: getStartDate(toDate(startDate)),
            tagGroup: '',
            unit: getBaseUnit(type),
        }, { location });
        setTypeLoading(type.id, false);
        let finalValue = data?.consumptions?.[0].value || null;
        setTypeData(type.id, finalValue, error);
        if (error) {
            console.error(error);
        }
    }
    useEffect(() => {
        if (!types || types.length == 0) return;
        if (!location) return;
        Promise.all(types.map(loadTypeAnalytics))
            .then(() => {

            }).catch((r: any) => {
                console.error(r);
            });

    }, [startDate, endDate, datePreset, location, types]);
    useEffect(() => {
        if (!locationKey) return;
        getLocationData(props.uxpContext, locationKey)
            .then(({ data, error }) => {

                let baselineValues = data?.baselines;
                setBaselineValues(baselineValues);
            });
    }, [location, baseline])


    let ed = toDate(endDate);
    let sd = toDate(startDate);
    let timePassed = Number(ed) - Number(sd);
    let days = timePassed / (1000 * 3600 * 24);

    return (
        <WidgetWrapper className='all-utilities-widget'

        >
            <TitleBar title={'Utility Baseline Comparison '}>
                <div style={{ display: 'flex' }}>
                    <DateRangePicker
                        title="date range"
                        startDate={startDate || ''}
                        endDate={endDate || ''}
                        preset={datePreset}
                        onChange={(s, e, pr) => {
                            setStartDate(s);
                            setEndDate(e);
                            setDatePreset(pr);

                        }}
                        presets={{
                            enable: true
                        }}
                        renderAsPill={{
                            minWidth: 320
                        }}
                    />
                    <LocationTreeInput
                        selected={location}
                        onChange={(p, node) => {
                            setLocation(p);
                            setLocationKey(node?.original?.LocationKey);
                        }}
                        locations={locations as ILocation[]}
                        generatePathFromKey={true}
                        includeLeadingSlash={true}
                        returnPathOnSelect={true}
                    />
                    <Select options={baselines} valueField='id' labelField='name' selected={baseline}
                        onChange={setBaseline} placeholder='Select baseline' />

                </div>
            </TitleBar>
            <div className={'all-utilities-benchmark-container'}>
                <CRUDComponent
                    list={{
                        title: 'Utility Benchmarks',
                        columns: [
                            {
                                id: 'icon',
                                label: '',
                                maxWidth: 40,
                                minWidth: 40,
                                renderColumn: (item) => {
                                    return <span className={'all-utilities-widget-container-icon'} style={{ backgroundImage: `url(${getTypeIcon(item.name)})` }}></span>

                                },
                            },
                            {
                                id: 'displayName',
                                label: 'Utility Type',
                                minWidth: 100,
                                maxWidth: 100,
                            },
                            {
                                id: 'data',
                                label: 'Consumption',
                                renderColumn: (item) => {
                                    let { data, error } = typeData[item.id] || { data: null, error: null };
                                    let loading = typeStatus[item.id];
                                    if (loading) return <LoadingSpinner />;
                                    return formatNumber(data, 0, getBaseUnit(item));
                                },
                            },
                            {
                                id: 'benchmark',
                                label: 'Benchmark',
                                renderColumn: (item) => {
                                    // return JSON.stringify(baselineValues)+'=>' + item.name + '=>' + baseline;
                                    let { data, error } = typeData[item.id] || { data: null, error: null };
                                    let loading = typeStatus[item.id];
                                    if (loading) return <LoadingSpinner />;
                                    let bv = baselineValues?.[item.name]?.[baseline];
                                    if (!bv) return '';
                                    let bvm = Number(bv)*days;
                                    return formatNumber(bvm,0,getBaseUnit(item));
                                },
                            },
                        ],
                        defaultPageSize: 10,
                        data: {
                            getData: types.map((item) => {
                                return item;
                            })
                        }
                    }}
                />
            </div>
        </WidgetWrapper>
    );
};
