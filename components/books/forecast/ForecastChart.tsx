import React from 'react';
import { CashFlowForecast } from '../../../types';

interface ForecastChartProps {
    forecast: CashFlowForecast;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ forecast }) => {
    const dataPoints = [
        { label: 'Today', value: forecast.startingBalance },
        ...forecast.forecast.map(p => ({ label: p.week, value: p.endingBalance }))
    ];

    const values = dataPoints.map(d => d.value);
    const dataMin = Math.min(...values, 0); // Include 0 in the range
    const dataMax = Math.max(...values);

    const range = dataMax - dataMin;
    const minY = dataMin - range * 0.1;
    const maxY = dataMax + range * 0.1;
    const effectiveRange = maxY - minY;

    const width = 500;
    const height = 300;
    const padding = { top: 20, bottom: 40, left: 60, right: 20 };

    const xScale = (index: number) => padding.left + (index / (dataPoints.length - 1)) * (width - padding.left - padding.right);
    const yScale = (value: number) => (height - padding.bottom) - ((value - minY) / effectiveRange) * (height - padding.top - padding.bottom);
    
    const formatYLabel = (value: number) => {
        if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
        if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
        return value.toFixed(0);
    };

    const yAxisLabelsCount = 5;
    const yAxisLabels = Array.from({ length: yAxisLabelsCount }, (_, i) => minY + (effectiveRange / (yAxisLabelsCount - 1)) * i);
    
    const linePath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(p.value)}`).join(' ');

    // Area below the line
    const areaPath = `${linePath} L${xScale(dataPoints.length - 1)},${yScale(minY)} L${xScale(0)},${yScale(minY)} Z`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', color: 'var(--color-text-secondary)' }}>
            <defs>
                <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Y-axis grid lines and labels */}
            {yAxisLabels.map((label, i) => (
                <g key={i} style={{ fontSize: '12px' }}>
                    <line x1={padding.left} y1={yScale(label)} x2={width - padding.right} y2={yScale(label)} stroke="var(--color-border)" strokeDasharray="2,3" />
                    <text x={padding.left - 8} y={yScale(label) + 4} textAnchor="end" fill="currentColor">{formatYLabel(label)}</text>
                </g>
            ))}
            {/* Zero line */}
            {minY < 0 && (
                 <line x1={padding.left} y1={yScale(0)} x2={width - padding.right} y2={yScale(0)} stroke="var(--color-error)" strokeWidth="1.5" strokeDasharray="3,4" />
            )}
            {/* X-axis labels */}
            {dataPoints.map((point, i) => (
                <text key={i} x={xScale(i)} y={height - padding.bottom + 20} textAnchor="middle" style={{ fontSize: '11px' }} fill="currentColor">
                    {point.label.split(' ')[0]}
                </text>
            ))}
            {/* Area and Line */}
            <path d={areaPath} fill="url(#area-gradient)" />
            <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" />
            {/* Data points */}
            {dataPoints.map((point, i) => (
                <circle key={i} cx={xScale(i)} cy={yScale(point.value)} r="4" fill="var(--color-primary)" />
            ))}
        </svg>
    );
};
