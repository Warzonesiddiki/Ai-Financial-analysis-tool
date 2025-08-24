import React, { useMemo } from 'react';
import { AINarrativeResponse, KeyMetric, ChartDataPoint, PeriodData } from '../types';
import { StatCard } from './StatCard';
import { SimpleLineChart } from './charts/SimpleLineChart';
import { SparklesIcon } from './icons';

interface DefinitiveViewProps {
    fullReport: AINarrativeResponse | null;
    currency: string;
}

const safeParse = (value: string | number): number => {
    if (typeof value === 'number') return value;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
};

const findMetric = (report: AINarrativeResponse, sectionId: string, metricLabelContains: string): KeyMetric | null => {
    const section = report.sections.find(s => s.id === sectionId);
    if (!section?.analysis?.quantitativeData?.keyMetrics) return null;
    return section.analysis.quantitativeData.keyMetrics.find(m => m.label.includes(metricLabelContains)) || null;
}

const DefinitiveView: React.FC<DefinitiveViewProps> = ({ fullReport, currency }) => {
    
    const keyMetrics: (KeyMetric | null)[] = useMemo(() => {
        if (!fullReport) return Array(6).fill(null);
        return [
            findMetric(fullReport, 'profit_or_loss', 'Total Revenue'),
            findMetric(fullReport, 'profit_or_loss', 'Net Income'),
            findMetric(fullReport, 'cash_flows', 'Operating Cash Flow'),
            findMetric(fullReport, 'key_ratios', 'Return on Equity'),
            findMetric(fullReport, 'key_ratios', 'Debt-to-Equity'),
            findMetric(fullReport, 'profit_or_loss', 'Gross Profit Margin'),
        ];
    }, [fullReport]);

    const masterTrendData: ChartDataPoint[] = useMemo(() => {
        if (!fullReport?.sections[0]?.analysis) return [];
        
        // Prefer the specific chart from 'executive_summary' if available
        const execSummarySection = fullReport.sections.find(s => s.id === 'executive_summary');
        if (execSummarySection?.analysis.quantitativeData.charts?.[0]?.data) {
            return execSummarySection.analysis.quantitativeData.charts[0].data;
        }

        // Fallback to assembling it
        const profitSection = fullReport.sections.find(s => s.id === 'profit_or_loss');
        const cashFlowSection = fullReport.sections.find(s => s.id === 'cash_flows');
        
        const revenueChartData = profitSection?.analysis.quantitativeData.charts?.[0]?.data.filter(d => d.series === 'Total Revenue') || [];
        const netIncomeChartData = profitSection?.analysis.quantitativeData.charts?.[0]?.data.filter(d => d.series === 'Net Income') || [];
        const cfoChartData = cashFlowSection?.analysis.quantitativeData.charts?.[0]?.data.filter(d => d.series === 'Operating') || [];

        return [...revenueChartData, ...netIncomeChartData, ...cfoChartData];

    }, [fullReport]);

    if (!fullReport?.dashboardAnalysis) {
        return <div className="card">Loading Definitive View...</div>;
    }

    const { cfoBriefing, strategicRecommendations } = fullReport.dashboardAnalysis;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card">
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-primary)', marginBottom: '1rem'}}>
                    <SparklesIcon style={{width: '28px', height: '28px'}} />
                    <h2 style={{margin: 0, border: 'none', color: 'inherit'}}>CFO's Briefing</h2>
                </div>
                <p style={{marginTop: 0, color: 'var(--color-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap'}}>{cfoBriefing}</p>
            </div>
            
            <div className="grid grid-cols-3">
                {keyMetrics.map((metric, index) => (
                    metric ? <StatCard key={index} metric={metric} /> : <div key={index} className="stat-card skeleton"></div>
                ))}
            </div>
            
             <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
                <div className="card">
                     <h3 style={{ marginBottom: '1.5rem' }}>Strategic Recommendations</h3>
                    <ul className="takeaways-list">
                        {strategicRecommendations.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>

                {masterTrendData.length > 0 && (
                    <div className="card">
                         <h3 style={{marginBottom: '1.5rem'}}>Key Financial Trends</h3>
                         <SimpleLineChart data={masterTrendData} currency={currency} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DefinitiveView;
