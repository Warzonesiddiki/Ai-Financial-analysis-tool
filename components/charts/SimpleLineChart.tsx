import React from 'react';
import { ChartDataPoint } from '../../types';

interface SimpleLineChartProps {
  data: ChartDataPoint[];
  currency: string;
}

const COLORS = ['#4f46e5', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#9333ea'];

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ data, currency }) => {
  if (!data || data.length === 0) {
    return <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2.5rem 0' }}>No chart data available.</div>;
  }

  // Group data by series
  const seriesNames = [...new Set(data.map(d => d.series || 'default'))];
  const seriesData: { [key: string]: ChartDataPoint[] } = {};
  seriesNames.forEach(name => seriesData[name] = []);
  data.forEach(d => seriesData[d.series || 'default'].push(d));

  const labels = [...new Set(data.map(d => d.label))];
  const values = data.map(d => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);

  // Add padding to the range
  const range = dataMax - dataMin;
  const minY = dataMin - range * 0.1;
  const maxY = dataMax + range * 0.1;
  const effectiveRange = maxY - minY;

  const yAxisLabelsCount = 5;
  const yAxisLabels = Array.from({ length: yAxisLabelsCount }, (_, i) => {
    const value = minY + (effectiveRange / (yAxisLabelsCount - 1)) * i;
    return value;
  });

  const width = 500;
  const height = 300;
  const padding = { top: 20, bottom: 40, left: 60, right: 20 };

  const xScale = (index: number) => {
    if (labels.length === 1) return (width - padding.left - padding.right) / 2 + padding.left;
    return padding.left + (index / (labels.length - 1)) * (width - padding.left - padding.right);
  }
  
  const yScale = (value: number) => {
    if (effectiveRange === 0) return (height - padding.top - padding.bottom) / 2 + padding.top;
    return (height - padding.bottom) - ((value - minY) / effectiveRange) * (height - padding.top - padding.bottom);
  }
  
  const formatYLabel = (value: number) => {
      if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
      if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
      return value.toFixed(0);
  }

  return (
    <div style={{ color: 'var(--color-text)' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        {/* Y-axis grid lines and labels */}
        {effectiveRange !== 0 && yAxisLabels.map((label, i) => (
          <g key={i} style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            <line
              x1={padding.left}
              y1={yScale(label)}
              x2={width - padding.right}
              y2={yScale(label)}
              stroke="var(--color-border)"
              strokeDasharray="2,3"
              strokeWidth="1"
            />
            <text x={padding.left - 10} y={yScale(label) + 4} textAnchor="end" fill="currentColor">
              {formatYLabel(label)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {labels.map((label, i) => (
          <g key={i} style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
             <text x={xScale(i)} y={height - padding.bottom + 20} textAnchor="middle" fill="currentColor">
              {label}
            </text>
          </g>
        ))}

        {/* Lines and points */}
        {seriesNames.map((seriesName, seriesIndex) => {
          const points = seriesData[seriesName]
            .map(d => {
                const index = labels.indexOf(d.label);
                if(index === -1) return null;
                return `${xScale(index)},${yScale(d.value)}`;
            })
            .filter(Boolean)
            .join(' ');

          const color = COLORS[seriesIndex % COLORS.length];

          return (
            <g key={seriesName}>
              {labels.length > 1 && (
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    points={points}
                />
              )}
              {seriesData[seriesName].map(d => {
                const index = labels.indexOf(d.label);
                if (index === -1) return null;
                return (
                  <circle
                    key={`${seriesName}-${d.label}`}
                    cx={xScale(index)}
                    cy={yScale(d.value)}
                    r="4"
                    fill={color}
                    stroke="var(--color-surface)"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
      {/* Legend */}
       {seriesNames.length > 1 && seriesNames[0] !== 'default' && (
         <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem 1.5rem', marginTop: '1rem', fontSize: '0.875rem' }}>
            {seriesNames.map((seriesName, seriesIndex) => (
              <div key={seriesName} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: COLORS[seriesIndex % COLORS.length] }}
                ></span>
                <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>{seriesName}</span>
              </div>
            ))}
          </div>
       )}
    </div>
  );
};