import React, { useEffect, useState } from 'react';
import { BaseUXPProps, ConsumptionReading, MeterGroup, MeterType, UtilityMeter, VirtualMeter } from '@types';
import { hasValue, Loading, Modal, useToast } from 'uxp/components';
import { getAllMeterGroups, getAllMeters, getAllVirtualMeters, getAnalyticsForMeter, getMeterGroupDetails, getVirtualMeterDetails, MeterAnalyticsParams } from '@ums-service';
import { SankeyChart, SankeyChartData, SankeyLink, SankeyNode } from '@components/common/SankeyChart';
import { getEndDate, getStartDate, removeDuplicates } from '@utils';
import { Bucket } from './Consumption';
import { findMeterDetails, getMeterType } from '../meters/meter_tag_utils';
import './Contributions.scss';

interface ContributionsComponentProps extends BaseUXPProps {
    utilityType: string;
    meterType: MeterType.MeterGroups | MeterType.VirtualMeters;
    meterIds: string[];
    startDate: string | Date;
    endDate: string | Date;
}

interface Member {
    id: string;
    factor: number;
    details: UtilityMeter | VirtualMeter | MeterGroup;
    meterType: MeterType;
}

export const Contributions: React.FunctionComponent<ContributionsComponentProps> = (props) => {
    const { uxpContext, utilityType, meterType, meterIds, startDate, endDate } = props;

    const [loading, setLoading] = useState<{ [key: string]: boolean }>({
        [MeterType.Meters]: false,
        [MeterType.VirtualMeters]: false,
        [MeterType.MeterGroups]: false,
        details: false
    });
    const [details, setDetails] = useState<{ [meterId: string]: VirtualMeter | MeterGroup | null }>(null);
    const [chartData, setChartData] = useState<SankeyChartData>({ nodes: [], links: [] });
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set()); // To track expanded nodes

    const [utilityMeters, setUtilityMeters] = useState<UtilityMeter[]>([]);
    const [virtualMeters, setVirtualMeter] = useState<VirtualMeter[]>([]);
    const [meterGroups, setMeterGroups] = useState<MeterGroup[]>([]);

    const toast = useToast();

    useEffect(() => {
        loadUtilityMeters();
        loadVirtualMeters();
        if (meterType === MeterType.MeterGroups) {
            loadMeterGroups();
        }
    }, [meterType]);

    useEffect(() => {
        loadMeterDetails();
    }, [meterIds]);

    useEffect(() => {
        processToNodes();
    }, [loading, details, utilityMeters, virtualMeters, meterGroups]);

    async function loadUtilityMeters() {
        setLoading(prev => ({ ...prev, [MeterType.Meters]: true }));
        const { data, error } = await getAllMeters(uxpContext, { metertype: utilityType });
        if (error) {
            setUtilityMeters([]);
            toast.error('Unable to get meters. ' + error);
            return;
        }
        setUtilityMeters(data || []);
        setLoading(prev => ({ ...prev, [MeterType.Meters]: false }));
    }

    async function loadVirtualMeters() {
        setLoading(prev => ({ ...prev, [MeterType.VirtualMeters]: true }));
        const { data, error } = await getAllVirtualMeters(uxpContext, { metertype: utilityType });
        if (error) {
            setVirtualMeter([]);
            toast.error('Unable to get meters. ' + error);
            return;
        }
        setVirtualMeter(data || []);
        setLoading(prev => ({ ...prev, [MeterType.VirtualMeters]: false }));
    }

    async function loadMeterGroups() {
        setLoading(prev => ({ ...prev, [MeterType.MeterGroups]: true }));
        const { data, error } = await getAllMeterGroups(uxpContext, { metertype: utilityType });
        if (error) {
            setMeterGroups([]);
            toast.error('Unable to get meters. ' + error);
            return;
        }
        setMeterGroups(data || []);
        setLoading(prev => ({ ...prev, [MeterType.MeterGroups]: false }));
    }


    async function getMultipleMeterDetails() {
        const meterDetails: { [meterId: string]: VirtualMeter | MeterGroup } = {}

        for (const meterId of meterIds || []) {
            const service = meterType === MeterType.MeterGroups ? getMeterGroupDetails : getVirtualMeterDetails;
            const { data, error } = await service(uxpContext, meterId);

            meterDetails[meterId] = (!error && !!data) ? data : null
        }
        return meterDetails
    }
    async function loadMeterDetails() {
        if (!meterIds || meterIds?.length == 0) return;
        setLoading(prev => ({ ...prev, details: true }));

        const data = await getMultipleMeterDetails()
        setDetails(data);
        setLoading(prev => ({ ...prev, details: false }));
    }

    async function getTotalConsumptionForMeter(id: string, type: MeterType) {
        const params: MeterAnalyticsParams = {
            start: getStartDate(startDate),
            end: getEndDate(endDate),
            bucket: Bucket.Year
        };
        const { data, error } = await getAnalyticsForMeter(uxpContext, type, id, params);
        if (error) {
            console.error('Unable to get consumpton for meter/metergroup :  ', id, '. Error: ', error)
            return undefined;
        }
        const totalConsumption = ((data?.consumptions || []) as ConsumptionReading[]).reduce((a, b) => a + b.value, 0);
        if (!hasValue(totalConsumption)) { console.error('Consumptoin is 0 for meter/metergroup : ', id, '. Response: ', data) }
        return totalConsumption
    }

    function extractMembers(meterDetails: VirtualMeter | MeterGroup): Member[] {
        const members: Member[] = (meterType === MeterType.VirtualMeters
            ? Object.entries((meterDetails as VirtualMeter)?.scalingFactor || {}).map(([key, value]) => ({ id: key, factor: value }))
            : (meterDetails as MeterGroup)?.members || []
        ).map(m => {
            const _details = findMeterDetails(m.id, utilityMeters, virtualMeters, meterGroups);
            return {
                ...m,
                details: _details,
                meterType: getMeterType(_details)
            };
        });

        return members;
    }

    async function generateNodesAndLinks(rootNode: SankeyNode, members: Member[]) {
        const nodes: SankeyNode[] = [rootNode, ...(members || []).map(m => ({ id: m?.details?.displayName || m.id, meterDetails: m?.details, meterType: m?.meterType }))];
        const links: SankeyLink[] = [];

        await Promise.all((members || []).map(async (m) => {
            const tc = await getTotalConsumptionForMeter(m.id, m.meterType);

            const linkColor = (m.factor > 0) ? '#4CAF50' : '#F44336'
            links.push({
                source: rootNode.id,
                target: m?.details?.displayName || m.id,
                value: tc || 0,
                startColor: linkColor,
                endColor: linkColor
            });
        }));

        return { nodes, links };
    }

    async function processToNodes() {
        if (loading.details || !details || Object.values(loading).some(val => val)) {
            setChartData({ nodes: [], links: [] });
            return;
        }

        const _nodes: SankeyNode[] = []
        const _links: SankeyLink[] = []
        const _rootNodes: string[] = []

        for (const [meterId, meterDetails] of Object.entries(details)) {
            if (!meterDetails) continue

            const members = extractMembers(meterDetails);

            const rootNode: SankeyNode = {
                id: meterDetails.displayName
            };

            const { nodes, links } = await generateNodesAndLinks(rootNode, members);
            _nodes.push(...nodes)
            _links.push(...links)
            _rootNodes.push(rootNode.id)
        }

        setChartData({ nodes: removeDuplicates(_nodes, 'id'), links: removeDuplicates(_links, ['source', 'target']) });
        setExpandedNodes(prev => new Set([...prev, ..._rootNodes]))
    }

    async function handleNodeExpand(node: SankeyNode, meterDetails: VirtualMeter | MeterGroup) {
        if (expandedNodes.has(node.id)) return;

        const members = extractMembers(meterDetails);
        const { nodes, links } = await generateNodesAndLinks(node, members);
        setChartData(prev => {
            const finalNodes = removeDuplicates([...prev.nodes, ...nodes], 'id');
            const finalLinks = removeDuplicates([...prev.links, ...links], ['source', 'target']);
            return { nodes: finalNodes, links: finalLinks };
        });

        setExpandedNodes(prev => new Set(prev).add(node.id));
    }

    async function handleNodeClick(data: any) {
        if (data?.meterDetails && data?.meterType !== MeterType.Meters) {
            const node = chartData?.nodes?.find(n => n.id === data.id);
            if (node) handleNodeExpand(node, data?.meterDetails);
        }
    }

    const hasEverythingLoaded = !Object.values(loading).some(val => val);

    return (
        <div className="ums_contributions__container">
            {hasEverythingLoaded && chartData?.nodes?.length > 0 && chartData?.links?.length > 0 ? (
                <SankeyChart uxpContext={uxpContext} data={chartData} onClickNode={handleNodeClick} />
            ) : (
                <Loading />
            )}
        </div>
    );
};
