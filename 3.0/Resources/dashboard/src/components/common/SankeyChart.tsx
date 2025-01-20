import { BaseUXPProps } from '@types';
import React from 'react';
import { ResponsiveSankey, SankeyLinkDatum, SankeyMouseHandler, SankeyNodeDatum } from '@nivo/sankey'
import './SankeyChart.scss';

export interface SankeyChartData {
    nodes: SankeyNode[];
    links: SankeyLink[];
}
export interface SankeyNode {
    id: string,
    nodeColor?: string
}

export interface SankeyLink {
    source: string;
    target: string;
    value: number;
    startColor: string
    endColor: string
}

interface SankeyChartProps extends BaseUXPProps {
    data: SankeyChartData,
    onClickNode?: (data: SankeyNodeDatum<SankeyNode, SankeyLink>) => void
    onClickLink?: (data: SankeyLinkDatum<SankeyNode, SankeyLink>) => void
}

export const SankeyChart: React.FunctionComponent<SankeyChartProps> = (props) => {

    function handleClick(data: SankeyNodeDatum<SankeyNode, SankeyLink> | SankeyLinkDatum<SankeyNode, SankeyLink>, event: any) {
        if ((data as any)?.source) {
            if (props?.onClickLink) props?.onClickLink?.(data as SankeyLinkDatum<SankeyNode, SankeyLink>)
        }
        else if (props?.onClickNode) props?.onClickNode?.(data as SankeyNodeDatum<SankeyNode, SankeyLink>)
    }

    return <div className='ums_sankey_chart__container' >
        <ResponsiveSankey
            data={props.data}
            margin={{ top: 40, right: 40, bottom: 100, left: 50 }}
            align="justify"
            colors={{ scheme: 'category10' }}
            nodeOpacity={1}
            nodeHoverOthersOpacity={0.35}
            nodeThickness={20}
            nodeSpacing={24}
            nodeBorderWidth={1}
            nodeBorderColor={{
                from: 'color',
                modifiers: [['darker', 0.8]],
            }}
            nodeBorderRadius={3}
            linkOpacity={0.5}
            linkHoverOthersOpacity={0.1}
            linkContract={3}
            enableLinkGradient={true}
            labelPosition="inside"
            labelOrientation="horizontal"
            labelPadding={16}
            labelTextColor={{
                from: 'color',
                modifiers: [['darker', 1]],
            }}
            theme={{
                tooltip: {
                    container: {
                        background: 'white',
                        color: 'black',
                        fontSize: '14px',
                    },
                },
            }}
            onClick={handleClick}
        />

    </div>
}