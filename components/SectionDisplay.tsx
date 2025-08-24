



import React from 'react';
import { ReportSection, ReportData, Chart } from '../types';
import { StatCard } from './StatCard';
import { SimpleBarChart } from './charts/SimpleBarChart';
import { SimplePieChart } from './charts/SimplePieChart';
import { SimpleLineChart } from './charts/SimpleLineChart';
import { SimpleWaterfallChart } from './charts/SimpleWaterfallChart';
import { NarrativeDisplay } from './NarrativeDisplay';
import { AlertTriangleIcon, InfoIcon, RefreshCwIcon } from './icons';
import InteractiveScenario from './InteractiveScenario';

interface SectionDisplayProps {
    section: ReportSection;
    reportData: ReportData;
    progressStatus: 'pending' | 'loading' | 'success' | 'error' | 'skipped';
    onRetrySection: (sectionId: string) => void;
}

const SkeletonLoader = () => (
    <div className="card" style={{ pageBreakInside: 'avoid', margin: '2rem 0' }}>
        <div className="skeleton skeleton-h3"></div>
        <div className="grid grid-cols-4" style={{gap: '1rem', marginBottom: '2rem'}}>
            <div className="skeleton skeleton-card"></div>
            <div className="skeleton skeleton-card"></div>
            <div className="skeleton skeleton-card"></div>
            <div className="skeleton skeleton-card"></div>
        </div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text skeleton-text-short"></div>
        <div className="skeleton skeleton-text" style={{marginTop: '1rem'}}></div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text skeleton-text-short"></div>
    </div>
);


const renderChart = (chart: Chart, sectionId: string, index: number, currency: string) => {
    return (
        <div key={index} className="card" id={`chart-${sectionId}-${index}`} style={{ gridColumn: 'span 1', pageBreakInside: 'avoid' }}>
             <h3 style={{marginBottom: '1.5rem'}}>{chart.title}</h3>
             {chart.type === 'bar' && <SimpleBarChart data={chart.data} currency={currency} />}
             {chart.type === 'pie' && <SimplePieChart data={chart.data} currency={currency} />}
             {chart.type === 'line' && <SimpleLineChart data={chart.data} currency={currency} />}
             {chart.type === 'waterfall' && <SimpleWaterfallChart data={chart.data} currency={currency} />}
        </div>
    );
};

export const SectionDisplay: React.FC<SectionDisplayProps> = ({ section, reportData, progressStatus, onRetrySection }) => {
    
    if (progressStatus === 'loading' || !section.analysis) {
        return <SkeletonLoader />;
    }

    if (progressStatus === 'error' || progressStatus === 'skipped') {
        const isError = progressStatus === 'error';
        const color = isError ? 'var(--color-error)' : 'var(--color-text-secondary)';
        const bgColor = isError ? 'rgba(220, 38, 38, 0.05)' : 'rgba(107, 114, 128, 0.05)';
        const Icon = isError ? AlertTriangleIcon : InfoIcon;

        return (
            <div className="card" style={{ borderColor: color, backgroundColor: bgColor, margin: '2rem 0', pageBreakInside: 'avoid' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: color }}>
                    <Icon style={{ width: '24px', height: '24px' }} />
                    <h3 style={{ margin: 0 }}>{isError ? `Analysis Failed for ${section.name}`: 'Analysis Skipped'}</h3>
                </div>
                <p style={{ color: isError ? '#b91c1c' : 'var(--color-text-secondary)' }}>{section.analysis.narrative || 'The AI was unable to generate an analysis for this section.'}</p>
                {isError && (
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={() => onRetrySection(section.id)} className="button button-secondary"><RefreshCwIcon /> Retry Analysis</button>
                    </div>
                )}
            </div>
        );
    }
    
    const { analysis } = section;
    const { quantitativeData } = analysis;

    const hasCharts = quantitativeData.charts && quantitativeData.charts.length > 0;
    const hasMetrics = quantitativeData.keyMetrics && quantitativeData.keyMetrics.length > 0;
    const chartLayout = !hasCharts ? '' : quantitativeData.charts.length === 1 ? 'grid-cols-1' : 'grid-cols-2';
    const metricLayout = !hasMetrics ? '' : quantitativeData.keyMetrics.length > 2 ? 'grid-cols-3' : 'grid-cols-4';


    return (
        <div style={{ pageBreakInside: 'avoid', marginBottom: '3rem' }}>
             <header style={{borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '2rem'}}>
                <h1 style={{color: 'var(--color-primary)', fontSize: '2.25rem'}}>{section.name}</h1>
                <h3 style={{ margin: 0, fontStyle: 'italic', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{analysis.headline}</h3>
             </header>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {hasMetrics && (
                    <div className={`grid ${metricLayout}`} style={{gap: '1rem'}}>
                        {quantitativeData.keyMetrics.map((metric, index) => (
                            <StatCard key={index} metric={metric} />
                        ))}
                    </div>
                )}
                
                {section.id === 'scenario_analysis' && (
                    <InteractiveScenario
                        initialAnalysis={analysis}
                        latestPeriod={reportData.periods[reportData.periods.length - 1]}
                        currency={reportData.currency}
                    />
                )}
                
                {hasCharts && (
                    <div className={`grid ${chartLayout}`} style={{gap: '1.5rem'}}>
                        {quantitativeData.charts!.map((chart, index) => renderChart(chart, section.id, index, reportData.currency))}
                    </div>
                )}
                
                <div className="card">
                    <NarrativeDisplay analysis={analysis} />
                </div>
            </div>
        </div>
    );
};