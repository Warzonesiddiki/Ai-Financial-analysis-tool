import React from 'react';
import { ReportSection, ReportData, Chart } from '../types';
import { StatCard } from './StatCard';
import { SimpleBarChart } from './charts/SimpleBarChart';
import { SimplePieChart } from './charts/SimplePieChart';
import { SimpleLineChart } from './charts/SimpleLineChart';
import { NarrativeDisplay } from './NarrativeDisplay';
import { AlertTriangleIcon } from './icons';
import { Spinner } from './Spinner';

interface SectionDisplayProps {
    section: ReportSection;
    reportData: ReportData;
    progressStatus: 'pending' | 'loading' | 'success' | 'error';
}

const renderChart = (chart: Chart, sectionId: string, index: number, currency: string) => {
    return (
        <div key={index} className="card" id={`chart-${sectionId}-${index}`} style={{ gridColumn: 'span 1', pageBreakInside: 'avoid' }}>
             <h4 style={{marginBottom: '1rem'}}>{chart.title}</h4>
             {chart.type === 'bar' && <SimpleBarChart data={chart.data} currency={currency} />}
             {chart.type === 'pie' && <SimplePieChart data={chart.data} />}
             {chart.type === 'line' && <SimpleLineChart data={chart.data} currency={currency} />}
        </div>
    );
};

export const SectionDisplay: React.FC<SectionDisplayProps> = ({ section, reportData, progressStatus }) => {
    
    if (progressStatus === 'loading' || !section.analysis) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '4rem', margin: '2rem 0', pageBreakInside: 'avoid' }}>
                <Spinner />
                <h3 style={{ marginTop: '1rem' }}>Generating Analysis for {section.name}...</h3>
            </div>
        );
    }

    if (progressStatus === 'error') {
        return (
            <div className="card" style={{ borderColor: 'var(--color-error)', backgroundColor: 'rgba(220, 38, 38, 0.05)', margin: '2rem 0', pageBreakInside: 'avoid' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--color-error)' }}>
                    <AlertTriangleIcon style={{ width: '24px', height: '24px' }} />
                    <h3 style={{ margin: 0 }}>Analysis Failed for {section.name}</h3>
                </div>
                <p style={{ color: '#b91c1c' }}>{section.analysis.narrative || 'The AI was unable to generate an analysis for this section.'}</p>
            </div>
        );
    }
    
    const { analysis } = section;
    const hasCharts = analysis.charts && analysis.charts.length > 0;
    const hasMetrics = analysis.keyMetrics && analysis.keyMetrics.length > 0;
    const chartLayout = !hasCharts ? '' : analysis.charts.length === 1 ? 'grid-cols-1' : 'grid-cols-2';
    const metricLayout = !hasMetrics ? '' : analysis.keyMetrics.length > 2 ? 'grid-cols-4' : 'grid-cols-2';


    return (
        <div style={{ pageBreakInside: 'avoid', marginBottom: '3rem', borderTop: '2px solid var(--color-border)', paddingTop: '2rem' }}>
            <h2 style={{color: 'var(--color-primary)', fontSize: '1.75rem'}}>{section.name}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ margin: 0, fontStyle: 'italic', fontWeight: 600, color: 'var(--color-text)' }}>{analysis.headline}</h3>
                
                {hasMetrics && (
                    <div className={`grid ${metricLayout}`} style={{gap: '1rem'}}>
                        {analysis.keyMetrics.map((metric, index) => (
                            <StatCard key={index} metric={metric} />
                        ))}
                    </div>
                )}
                
                {hasCharts && (
                    <div className={`grid ${chartLayout}`} style={{gap: '1.5rem'}}>
                        {analysis.charts!.map((chart, index) => renderChart(chart, section.id, index, reportData.currency))}
                    </div>
                )}
                
                <div className="card">
                    <NarrativeDisplay analysis={analysis} />
                </div>
            </div>
        </div>
    );
};
