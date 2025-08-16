import React, { useState, useMemo } from 'react';
import { CashFlowForecastNarrativeResponse, CashFlowForecastReportData, CashFlowForecastReportSection, ForecastWeek } from '../types';
import { Spinner } from './Spinner';
import { StatCard } from './StatCard';
import { ArrowLeftIcon, AlertTriangleIcon, CheckCircleIcon, XIcon } from './icons';
import { CASH_FLOW_FORECAST_SECTIONS } from '../constants';
import { NarrativeDisplay } from './NarrativeDisplay';
import { SimpleLineChart } from './charts/SimpleLineChart';

type ProgressState = { [key: string]: 'pending' | 'loading' | 'success' | 'error' };

interface CashFlowForecastReportDashboardProps {
    narrative: CashFlowForecastNarrativeResponse | null;
    reportData: CashFlowForecastReportData;
    isLoading: boolean;
    progress: ProgressState;
    onBackToInput: () => void;
}

const ForecastTable: React.FC<{ data: ForecastWeek[], currency: string }> = ({ data, currency }) => (
    <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>13-Week Cash Flow Summary</h3>
        <div style={{overflowX: 'auto'}}>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Week</th>
                        <th>Date Range</th>
                        <th>Opening Balance</th>
                        <th>Inflows</th>
                        <th>Outflows</th>
                        <th>Net Cash Flow</th>
                        <th>Closing Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((week) => (
                        <tr key={week.week}>
                            <td style={{ fontWeight: 600 }}>Week {week.week}</td>
                            <td>{week.startDate} - {week.endDate}</td>
                            <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(week.openingBalance)}</td>
                            <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(week.inflows)}</td>
                            <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(week.outflows)}</td>
                            <td style={{color: week.netCashFlow < 0 ? 'var(--color-error)' : 'var(--color-success)'}}>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(week.netCashFlow)}</td>
                            <td style={{fontWeight: 600}}>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(week.closingBalance)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);


const CashFlowForecastReportDashboard: React.FC<CashFlowForecastReportDashboardProps> = ({ narrative, reportData, isLoading, progress, onBackToInput }) => {
    const [activeSectionId, setActiveSectionId] = useState<string>(CASH_FLOW_FORECAST_SECTIONS[0].id);

    const activeSectionData = useMemo(() => {
        return narrative?.sections.find(s => s.id === activeSectionId);
    }, [narrative?.sections, activeSectionId]);

    const renderSectionContent = () => {
        if (!activeSectionData || !activeSectionData.analysis) {
            return (
                 <div className="card" style={{textAlign: 'center', padding: '4rem'}}>
                    <Spinner /> <h3 style={{marginTop: '1rem'}}>Generating Forecast...</h3>
                 </div>
            );
        }
        
        const { analysis } = activeSectionData;

        if (progress[activeSectionId] === 'error') {
             return (
                <div className="card" style={{borderColor: 'var(--color-error)', backgroundColor: 'rgba(220, 38, 38, 0.05)'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--color-error)'}}>
                         <AlertTriangleIcon style={{width: '24px', height: '24px'}}/>
                         <h3 style={{ margin: 0 }}>Analysis Failed</h3>
                    </div>
                    <p style={{color: 'var(--color-error)'}}>{analysis.narrative || 'The AI did not return a valid analysis for this section.'}</p>
                </div>
            );
        }
        
        return (
            <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}} data-active-section={activeSectionId}>
                 <h2 style={{margin: 0}}>{analysis.headline}</h2>
                 <div className="grid grid-cols-2 lg:grid-cols-4" style={{gap: '1rem'}}>
                    {analysis.keyMetrics?.map((metric, index) => (
                        <StatCard key={index} metric={metric} />
                    ))}
                </div>
                
                {analysis.charts?.[0] && (
                    <div className="card" id={`chart-${activeSectionData.id}-0`}>
                        <h4 style={{marginBottom: '1rem'}}>{analysis.charts[0].title}</h4>
                        <SimpleLineChart data={analysis.charts[0].data} currency={reportData.currency} />
                    </div>
                )}

                {analysis.weeklyForecast && <ForecastTable data={analysis.weeklyForecast} currency={reportData.currency} />}

                <div className="card">
                    <NarrativeDisplay analysis={analysis} />
                </div>
            </div>
        )
    };

    return (
        <div id="report-container">
            <header style={{marginBottom: '1.5rem' }}>
                 <button onClick={onBackToInput} className="button button-secondary" style={{marginBottom: '1rem'}}>
                     <ArrowLeftIcon /> Back to Data Input
                 </button>
                 <h1 style={{margin: 0}}>{reportData.companyName}</h1>
                 <p style={{color: 'var(--color-text-secondary)', marginTop: '0.25rem', fontSize: '1.1rem'}}>13-Week Cash Flow Forecast</p>
            </header>

             <div className="dashboard">
                <nav className="dashboard-nav">
                     <div className="card" style={{padding: '0.75rem'}}>
                        <h3 style={{padding: '0.5rem 0.5rem 0.75rem 0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.5rem'}}>Forecast Sections</h3>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                        {CASH_FLOW_FORECAST_SECTIONS.map(section => {
                            const Icon = section.icon;
                            const isActive = activeSectionId === section.id;
                            const status = progress[section.id];
                            
                            return (
                                <button key={section.id} onClick={() => setActiveSectionId(section.id)} className={`button ${isActive ? 'button-primary' : ''}`}
                                    style={{ justifyContent: 'flex-start', width: '100%', backgroundColor: isActive ? '' : 'transparent', color: isActive ? '' : 'var(--color-text-secondary)', border: 'none', fontWeight: 500 }}>
                                    <Icon style={{width: '18px', height: '18px'}}/>
                                    <span style={{flexGrow: 1, textAlign: 'left'}}>{section.name}</span>
                                    {status === 'loading' && <Spinner />}
                                    {status === 'success' && <CheckCircleIcon style={{color: 'var(--color-success)', width: '18px', height: '18px'}} />}
                                    {status === 'error' && <XIcon style={{color: 'var(--color-error)', width: '18px', height: '18px'}} />}
                                </button>
                            );
                        })}
                        </div>
                    </div>
                </nav>
            
                <div className="dashboard-content" id="report-content">
                    {renderSectionContent()}
                </div>
            </div>
        </div>
    );
};

export default CashFlowForecastReportDashboard;