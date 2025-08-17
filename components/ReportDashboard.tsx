
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { AINarrativeResponse, ReportData, KeyMetric } from '../types';
import { GenerationState } from '../App';
import { SectionDisplay } from './SectionDisplay';
import { AlertTriangleIcon, ArrowLeftIcon, CheckCircleIcon, XIcon } from './icons';
import { ExportControls } from './ExportControls';
import { Spinner } from './Spinner';
import { StatCard } from './StatCard';


interface ReportDashboardProps {
    narrative: AINarrativeResponse | null;
    reportData: ReportData;
    isLoading: boolean;
    generationState: GenerationState;
    onBackToInput: () => void;
    activeSectionId: string;
    setActiveSectionId: (id: string) => void;
}

const LiveGenerationStatus: React.FC<{ state: GenerationState }> = ({ state }) => {
    const total = Object.keys(state).length;
    const completed = Object.values(state).filter(s => s.status === 'success' && s.pass === 2).length;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    return (
        <div className="card" style={{ marginBottom: '2rem' }}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <h3 style={{ margin: 0 }}>Live Generation Status</h3>
                <span style={{fontWeight: 500, color: 'var(--color-text-secondary)'}}>{completed} / {total} Sections Complete</span>
            </div>
             <div style={{ backgroundColor: 'var(--color-border)', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--color-primary)', transition: 'width 0.5s ease' }}></div>
            </div>
        </div>
    );
};

const ReportHighlights: React.FC<{ narrative: AINarrativeResponse | null }> = ({ narrative }) => {
    const [highlights, setHighlights] = useState<KeyMetric[]>([]);

    useEffect(() => {
        if (narrative) {
            const execSummary = narrative.sections.find(s => s.id === 'executive_summary');
            if (execSummary?.analysis.quantitativeData?.keyMetrics) {
                 setHighlights(execSummary.analysis.quantitativeData.keyMetrics.slice(0, 4));
            }
        }
    }, [narrative]);

    if (highlights.length === 0) return null;

    return (
        <div style={{marginBottom: '2rem'}}>
            <h2 style={{fontSize: '1.5rem'}}>Report Highlights</h2>
            <div className="grid grid-cols-4">
                {highlights.map((metric, index) => (
                    <StatCard key={index} metric={metric} />
                ))}
            </div>
        </div>
    );
};

const ReportDashboard: React.FC<ReportDashboardProps> = ({ narrative, reportData, isLoading, generationState, onBackToInput, activeSectionId, setActiveSectionId }) => {

    const activeSectionData = useMemo(() => {
        return narrative?.sections.find(s => s.id === activeSectionId);
    }, [narrative?.sections, activeSectionId]);
    
    const getReportTitle = useCallback(() => {
        if (reportData.periods.length === 0) return "Financial Report";
        if (reportData.periods.length === 1) return `${reportData.periods[0].periodLabel} Financial Report`;
        return `${reportData.periods[0].periodLabel} - ${reportData.periods[reportData.periods.length - 1].periodLabel} Financial Report`;
    }, [reportData]);

    const renderSectionContent = () => {
        if (!activeSectionData) {
            return (
                 <div className="card" style={{textAlign: 'center', padding: '4rem'}}>
                    <Spinner />
                    <h3 style={{marginTop: '1rem'}}>Loading Section...</h3>
                 </div>
            );
        }
        
        const status = generationState[activeSectionId]?.status || 'pending';
        return <SectionDisplay section={activeSectionData} reportData={reportData} progressStatus={status} />;
    };

    if (isLoading && Object.values(generationState).every(s => s.status === 'loading' && s.pass === 1)) {
        return (
            <div className="card" style={{textAlign: 'center', padding: '4rem', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                <Spinner />
                <h3 style={{marginTop: '1rem'}}>Preparing Analysis...</h3>
                <p style={{color: 'var(--color-text-secondary)'}}>This may take a moment.</p>
            </div>
        );
    }
    
    if (!narrative) {
         return (
             <div className="card" style={{textAlign: 'center', padding: '4rem'}}>
                <AlertTriangleIcon style={{width: '48px', height: '48px', color: 'var(--color-error)'}}/>
                <h3 style={{marginTop: '1rem'}}>Report Generation Failed</h3>
                <p style={{color: 'var(--color-text-secondary)'}}>Something went wrong. Please go back and try again.</p>
                 <button onClick={onBackToInput} className="button button-secondary" style={{marginTop: '1rem'}}>
                     <ArrowLeftIcon />
                     Back to Data Input
                 </button>
             </div>
        );
    }

    return (
        <div id="report-container">
            {isLoading && <LiveGenerationStatus state={generationState} />}
            <header style={{marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap'}}>
                <div>
                     <button onClick={onBackToInput} className="button button-secondary" style={{marginBottom: '1rem'}}>
                         <ArrowLeftIcon />
                         Back to Data Input
                     </button>
                     <h1 style={{margin: 0}}>{reportData.companyName}</h1>
                     <p style={{color: 'var(--color-text-secondary)', marginTop: '0.25rem', fontSize: '1.1rem'}}>{getReportTitle()}</p>
                </div>
                <ExportControls 
                    narrative={narrative} 
                    reportData={reportData}
                />
            </header>
            
            {!isLoading && <ReportHighlights narrative={narrative} />}

            <div className="dashboard">
                <nav className="dashboard-nav">
                     <div className="card" style={{padding: '0.75rem'}}>
                        <h3 style={{padding: '0.5rem 0.5rem 0.75rem 0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.5rem'}}>Report Sections</h3>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                        {narrative.sections.map(section => {
                            const Icon = section.icon;
                            const isActive = activeSectionId === section.id;
                            const status = generationState[section.id]?.status || 'pending';
                            
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSectionId(section.id)}
                                    className={`button dashboard-nav-item ${isActive ? 'active' : ''}`}
                                    style={{ justifyContent: 'flex-start', width: '100%', backgroundColor: 'transparent', border: 'none' }}
                                >
                                    <div className="pill"></div>
                                    <div style={{display: 'flex', alignItems: 'center', width: '100%'}}>
                                        <Icon style={{width: '18px', height: '18px', color: 'var(--color-primary)', marginRight: '0.75rem', flexShrink: 0}}/>
                                        <span style={{flexGrow: 1, textAlign: 'left'}}>{section.name}</span>
                                        {status === 'loading' && <Spinner />}
                                        {status === 'success' && <CheckCircleIcon style={{color: 'var(--color-success)', width: '18px', height: '18px'}} />}
                                        {status === 'error' && <XIcon style={{color: 'var(--color-error)', width: '18px', height: '18px'}} />}
                                    </div>
                                </button>
                            );
                        })}
                        </div>
                    </div>
                </nav>
            
                <div className="dashboard-content" id="report-content" data-active-section={activeSectionId}>
                    {renderSectionContent()}
                </div>
            </div>
        </div>
    );
};

export default ReportDashboard;