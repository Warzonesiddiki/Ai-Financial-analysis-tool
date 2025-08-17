
import React, { useState } from 'react';
import { ChartDataPoint } from '../../types';

interface SimpleBarChartProps {
    data: ChartDataPoint[];
    currency: string;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, currency }) => {
    const [tooltip, setTooltip] = useState<{ content: string, x: number, y: number } | null>(null);

    if (!data || data.length === 0) {
        return <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2.5rem 0' }}>No chart data available.</div>;
    }

    const values = data.map(d => d.value);
    const maxValue = Math.max(...values.map(v => Math.abs(v)));
    
    if (maxValue === 0) {
         return <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2.5rem 0' }}>All values are zero.</div>;
    }

    const formatValue = (value: number, compact: boolean = true) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          notation: compact ? 'compact' : 'standard',
          compactDisplay: 'short'
        }).format(value);
    }

    const handleMouseMove = (e: React.MouseEvent, content: string) => {
        setTooltip({ content, x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    return (
        <div style={{ padding: '0 0.5rem', color: 'var(--color-text)', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
            {tooltip && (
                <div className="chart-tooltip" style={{ left: tooltip.x, top: tooltip.y, opacity: 1, transform: 'translate(-50%, -100%) translateY(-15px)' }}>
                    {tooltip.content}
                </div>
            )}
            {data.map((item, index) => {
                const barWidth = (Math.abs(item.value) / maxValue) * 100;
                const isNegative = item.value < 0;
                const tooltipContent = `${item.label}: ${formatValue(item.value, false)}`;

                return (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', alignItems: 'center', gap: '1rem', fontSize: '0.9rem' }}>
                        <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                             <div 
                                onMouseMove={(e) => handleMouseMove(e, tooltipContent)}
                                onMouseLeave={handleMouseLeave}
                                style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '4px', height: '24px', position: 'relative', cursor: 'pointer' }}
                              >
                                <div
                                    style={{ 
                                        position: 'absolute',
                                        height: '100%', 
                                        borderRadius: '4px',
                                        width: `${barWidth}%`, 
                                        left: `0`,
                                        backgroundColor: isNegative ? 'var(--color-error)' : 'var(--color-primary)',
                                        transition: 'width 0.5s ease-out'
                                    }}
                                ></div>
                            </div>
                             <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', width: '80px', textAlign: 'right', fontWeight: 500 }}>
                                {formatValue(item.value)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};