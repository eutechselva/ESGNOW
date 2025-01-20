import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, BarChart, Bar, Cell } from 'recharts';

interface SparklineProps {
    data: Array<{ value: number }>; // Define `data` as an array of objects with a `value` field
    color?: string;
    type: 'bar' | 'line';
    highColor?: string;
    highLimit?: number;
}
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #cccccc", padding: "10px", borderRadius: "5px" }}>
                <p style={{ margin: 0 }}><strong>Index:</strong> {label}</p>
                <p style={{ margin: 0 }}><strong>Value:</strong> {payload[0].value}</p>
                {/* Add additional data or styling as needed */}
            </div>
        );
    }
    return null;
};
export const Sparkline: React.FC<SparklineProps> = ({ data, color, type, highColor, highLimit }) => {
    let lowColor = color || 'pink';
    let getColor = (v: number|null) => {
        if (v == null) return '#EFEFEFAA';
        if (!highLimit) return lowColor;
        if (v >= highLimit) return (highColor || 'pink');
        return lowColor;
    };
    let maxData = Math.max(...data.map((x)=>(x.value==null)?0:x.value))||5;
    let normalizedData = []
    for(let x of data) {
        var y = {...x};
        if (y.value==null) y.value = maxData*0.5;
        normalizedData.push(y);
    }
    console.log(normalizedData);
    return <ResponsiveContainer width={'100%'} height={'100%'}>
        {
            type == 'line' ? (
                <LineChart data={normalizedData}>
                    <Line type="monotone" dataKey="value" stroke={lowColor} dot={false} strokeWidth={2} />
                </LineChart>
            ) : (
                <BarChart data={normalizedData}>
                    <Bar dataKey="value" fill={lowColor} radius={[5, 5, 0, 0]} >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`}  fill={getColor(data[index]?.value)} />
                        ))}
                    </Bar>
                    <Tooltip content={<CustomTooltip />} />
                </BarChart>
            )
        }

    </ResponsiveContainer>
}
