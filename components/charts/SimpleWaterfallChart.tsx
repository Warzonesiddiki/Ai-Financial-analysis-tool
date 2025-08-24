import React, { useState } from 'react';
import { ChartDataPoint } from '../../types';

interface SimpleWaterfallChartProps {
    data: ChartDataPoint[];
    currency: string;
}

export const SimpleWaterfallChart: React.FC<SimpleWaterfallChartProps> = ({ data, currency }) => {
    const [tooltip, setTooltip] = useState<{ content: string, x: number, y: number } | null>(null);

    if (!data || data.length === 0) {
        return <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2.5rem 0' }}>No chart data available.</div>;
    }

    const formatValue = (value: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          notation: 'compact',
          compactDisplay: 'short'
        }).format(value);
    }
    
    const formatFullValue = (value: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
        }).format(value);
    }

    const handleMouseMove = (e: React.MouseEvent, content: string) => {
        setTooltip({ content, x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    let runningTotal = 0;
    const chartData = data.map(item => {
        const start = runningTotal;
        if (item.type !== 'total') {
            runningTotal += item.value;
        }
        return { ...item, start, end: runningTotal };
    });
    
    const allValues = chartData.flatMap(d => [d.start, d.end, d.value]);
    const maxVal = Math.max(...allValues.map(Math.abs));

    if (maxVal === 0) {
        return <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2.5rem 0' }}>All values are zero.</div>;
    }

    return (
        <div className="waterfall-chart" style={{position: 'relative'}}>
            {tooltip && (
                <div className="chart-tooltip" style={{ left: tooltip.x, top: tooltip.y, opacity: 1, transform: 'translate(-50%, -100%) translateY(-15px)' }}>
                    {tooltip.content}
                </div>
            )}
            {chartData.map((item, index) => {
                let barLeft = 0;
                let barWidth = 0;
                let barClass = '';
                
                if (item.type === 'total') {
                    barLeft = 0;
                    barWidth = (Math.abs(item.end) / maxVal) * 100;
                    barClass = 'waterfall-bar-total';
                } else {
                    if (item.value > 0) {
                        barLeft = (item.start / maxVal) * 100;
                        barWidth = (item.value / maxVal) * 100;
                        barClass = 'waterfall-bar-positive';
                    } else {
                        barLeft = (item.end / maxVal) * 100;
                        barWidth = (Math.abs(item.value) / maxVal) * 100;
                        barClass = 'waterfall-bar-negative';
                    }
                }

                const value = item.type === 'total' ? item.end : item.value;
                const tooltipContent = `${item.label}: ${formatFullValue(value)}`;

                return (
                    <div className="waterfall-row" key={index}
                        onMouseMove={(e) => handleMouseMove(e, tooltipContent)}
                        onMouseLeave={handleMouseLeave}
                        style={{ cursor: 'pointer', borderRadius: '4px', margin: '0 -1rem', padding: '0 1rem', transition: 'background-color 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-light)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <div className="waterfall-label">{item.label}</div>
                        <div className="waterfall-bar-container">
                            <div
                                className={`waterfall-bar ${barClass}`}
                                style={{
                                    left: `${barLeft}%`,
                                    width: `${barWidth}%`,
                                }}
                            ></div>
                        </div>
                        <div className="waterfall-value">{formatValue(value)}</div>
                    </div>
                );
            })}
        </div>
    );
};