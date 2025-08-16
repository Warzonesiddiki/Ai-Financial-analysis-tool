
import React from 'react';
import { ChartDataPoint } from '../../types';

interface SimplePieChartProps {
  data: ChartDataPoint[];
}

const COLORS = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6610f2', '#6f42c1', '#20c997'];

export const SimplePieChart: React.FC<SimplePieChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2.5rem 0' }}>No chart data available.</div>;
  }

  const total = data.reduce((sum, item) => sum + Math.abs(item.value), 0);
  if (total === 0) {
      return <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2.5rem 0' }}>All values are zero.</div>;
  }

  let cumulativePercent = 0;
  const paths = data.map((item, index) => {
    const percent = (Math.abs(item.value) / total);
    const startAngle = cumulativePercent * 2 * Math.PI - Math.PI / 2; // Start from top
    cumulativePercent += percent;
    const endAngle = cumulativePercent * 2 * Math.PI - Math.PI / 2;

    const largeArcFlag = percent > 0.5 ? 1 : 0;

    const x1 = 50 + 40 * Math.cos(startAngle);
    const y1 = 50 + 40 * Math.sin(startAngle);
    const x2 = 50 + 40 * Math.cos(endAngle);
    const y2 = 50 + 40 * Math.sin(endAngle);

    return (
      <path
        key={index}
        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
        fill={COLORS[index % COLORS.length]}
      />
    );
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--color-text)' }}>
      <svg viewBox="0 0 100 100" style={{ width: '160px', height: '160px', flexShrink: 0 }}>
        {paths}
      </svg>
      <div style={{ width: '100%' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' }}>
          {data.map((item, index) => (
            <li key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                <span
                  style={{ width: '12px', height: '12px', borderRadius: '999px', display: 'inline-block', flexShrink: 0, backgroundColor: COLORS[index % COLORS.length] }}
                ></span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{item.label}</span>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                {((Math.abs(item.value) / total) * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};