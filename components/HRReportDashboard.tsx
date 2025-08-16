import React, { useState, useMemo } from 'react';
import { HrNarrativeResponse, HrReportData, HrReportSection } from '../types';
import { Spinner } from './Spinner';
import { StatCard } from './StatCard';
import { ArrowLeftIcon, AlertTriangleIcon, CheckCircleIcon, XIcon, MessageSquareIcon } from './icons';
import { HR_SECTIONS } from '../constants';
import { NarrativeDisplay } from './NarrativeDisplay';
import { SimpleBarChart } from './charts/SimpleBarChart';
import { SimplePieChart } from './charts/SimplePieChart';
import { SimpleLineChart } from './charts/SimpleLineChart';

type ProgressState = { [key: string]: 'pending' | 'loading' | 'success' | 'error' };

interface HRReportDashboardProps {
    narrative: HrNarrativeResponse | null;
    reportData: HrReportData;
    isLoading: boolean;
    progress: ProgressState;
    onBackToInput: () => void;
}

const HRReportDashboard: React.FC<HRReportDashboardProps> = ({ narrative, reportData, isLoading, progress, onBackToInput }) => {
    const [activeSectionId, setActiveSectionId] = useState<string>(HR_SECTIONS[0].id);

    const activeSectionData = useMemo(() => {
        return narrative?.sections.find(s => s.id === activeSectionId);
    }, [narrative?.sections, activeSectionId]);

    const renderCharts = (section: HrReportSection | undefined) => {
        if (!section?.analysis?.charts || section.analysis.charts.length === 0) {
            return null;
        }

        return (
            <div className="grid grid-cols-2" style={{gap: '1.5rem'}}>
                {section.analysis.charts.map((chart, index) => (
                    <div key={index} className="card" id={`chart-${section.id}-${index}`}>
                         <h4 style={{marginBottom: '1rem'}}>{chart.title}</h4>
                         {chart.type === 'bar' && <SimpleBarChart data={chart.data} currency={reportData.currency} />}
                         {chart.type === 'pie' && <SimplePieChart data={chart.data} />}
                         {chart.type === 'line' && <SimpleLineChart data={chart.data} currency={reportData.currency} />}
                    </div>
                ))}
            </div>
        );
    }

    const renderSectionContent = () => {
        if (!activeSectionData || !activeSectionData.analysis) {
            return (
                 <div className="card" style={{textAlign: 'center', padding: '4rem'}}>
                    <Spinner />
                    <h3 style={{marginTop: '1rem'}}>Generating Analysis...</h3>
                    <p style={{color: 'var(--color-text-secondary)'}}>The analysis for this section is being prepared.</p>
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
                    <p style={{color: 'var(--color-error)'}}>{analysis.narrative || 'The AI could not generate an analysis for this section.'}</p>
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
                {renderCharts(activeSectionData)}
                <div className="card">
                    <NarrativeDisplay analysis={analysis} />
                </div>
            </div>
        );
    };
    
    return (
        <div id="report-container">
            <header style={{marginBottom: '1.5rem' }}>
                 <button onClick={onBackToInput} className="button button-secondary" style={{marginBottom: '1rem'}}>
                     <ArrowLeftIcon />
                     Back to Data Input
                 </button>
                 <h1 style={{margin: 0}}>{reportData.companyName}</h1>
                 <p style={{color: 'var(--color-text-secondary)', marginTop: '0.25rem', fontSize: '1.1rem'}}>HR & Payroll Analysis</p>
            </header>

             <div className="dashboard">
                <nav className="dashboard-nav">
                     <div className="card" style={{padding: '0.75rem'}}>
                        <h3 style={{padding: '0.5rem 0.5rem 0.75rem 0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.5rem'}}>Report Sections</h3>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                        {HR_SECTIONS.map(section => {
                            const Icon = section.icon;
                            const isActive = activeSectionId === section.id;
                            const status = progress[section.id];
                            
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSectionId(section.id)}
                                    className={`button ${isActive ? 'button-primary' : ''}`}
                                    style={{
                                      justifyContent: 'flex-start',
                                      width: '100%',
                                      backgroundColor: isActive ? '' : 'transparent',
                                      color: isActive ? '' : 'var(--color-text-secondary)',
                                      border: 'none',
                                      fontWeight: 500,
                                    }}
                                >
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

export default HRReportDashboard;