
import React from 'react';
import { ChartDataPoint } from '../../types';

interface SimpleWaterfallChartProps {
    data: ChartDataPoint[];
    currency: string;
}

export const SimpleWaterfallChart: React.FC<SimpleWaterfallChartProps> = ({ data, currency }) => {
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

    let runningTotal = 0;
    const chartData = data.map(item => {
        const start = runningTotal;
        if (item.type !== 'total') {
            runningTotal += item.value;
        }
        return { ...item, start, end: runningTotal };
    });
    
    // Determine the max value for scaling, considering the start and end points of bars
    const allValues = chartData.flatMap(d => [d.start, d.end, d.value]);
    const maxVal = Math.max(...allValues.map(Math.abs));

    if (maxVal === 0) {
        return <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2.5rem 0' }}>All values are zero.</div>;
    }

    return (
        <div className="waterfall-chart">
            {chartData.map((item, index) => {
                let barLeft = 0;
                let barWidth = 0;
                let barClass = '';
                
                if (item.type === 'total') {
                    barLeft = 0;
                    barWidth = (Math.abs(item.end) / maxVal) * 100;
                    barClass = 'waterfall-bar-total';
                } else {
                    if (item.value > 0) { // positive contribution
                        barLeft = (item.start / maxVal) * 100;
                        barWidth = (item.value / maxVal) * 100;
                        barClass = 'waterfall-bar-positive';
                    } else { // negative contribution
                        barLeft = (item.end / maxVal) * 100;
                        barWidth = (Math.abs(item.value) / maxVal) * 100;
                        barClass = 'waterfall-bar-negative';
                    }
                }

                return (
                    <div className="waterfall-row" key={index}>
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
                        <div className="waterfall-value">{formatValue(item.type === 'total' ? item.end : item.value)}</div>
                    </div>
                );
            })}
        </div>
    );
};