import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { AINarrativeResponse, ReportData, ChatMessage, SectionAnalysis } from '../types';
import { GenerationState } from '../App';
import { SectionDisplay } from './SectionDisplay';
import { AlertTriangleIcon, ArrowLeftIcon, CheckCircleIcon, XIcon, LayoutGridIcon, ChevronDownIcon, InfoIcon, MessageSquareIcon } from './icons';
import { ExportControls } from './ExportControls';
import { Spinner } from './Spinner';
import DefinitiveView from './DefinitiveView';
import { REPORT_SECTION_BATCHES } from '../constants';
import { AIChat } from './AIChat';
import { generateChatResponseStream } from '../services/geminiService';


interface ReportDashboardProps {
    narrative: AINarrativeResponse | null;
    reportData: ReportData;
    isLoading: boolean;
    generationState: GenerationState;
    onBackToInput: () => void;
    onRetrySection: (sectionId: string) => void;
    activeSectionId: string;
    setActiveSectionId: (id: string) => void;
}

const LiveGenerationStatus: React.FC<{ state: GenerationState, isLoading: boolean }> = ({ state, isLoading }) => {
    const total = Object.keys(state).filter(k => state[k].status !== 'skipped').length;
    const completed = Object.values(state).filter(s => s.status === 'success').length;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    const currentLoadingMessage = useMemo(() => {
        if (!isLoading) return "Analysis Complete";

        const loadingSection = Object.values(state).find(s => s.status === 'loading');
        if (loadingSection?.message.startsWith('Generating:')) {
            return loadingSection.message;
        }
        if (state['definitive_view']?.status === 'loading') {
            return state['definitive_view'].message;
        }
        return 'Analyzing Financials...';
    }, [state, isLoading]);

    return (
        <div className="card" style={{ marginBottom: '2rem' }}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <h3 style={{ margin: 0 }}>{currentLoadingMessage}</h3>
                <span style={{fontWeight: 500, color: 'var(--color-text-secondary)'}}>{completed} / {total} Tasks Complete</span>
            </div>
             <div style={{ backgroundColor: 'var(--color-border)', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--color-primary)', transition: 'width 0.5s ease' }}></div>
            </div>
        </div>
    );
};

const ReportDashboard: React.FC<ReportDashboardProps> = ({ narrative, reportData, isLoading, generationState, onBackToInput, onRetrySection, activeSectionId, setActiveSectionId }) => {
    const [expandedNavGroups, setExpandedNavGroups] = useState<string[]>(['Core Financial Statements']);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    
    useEffect(() => {
        // Find which group the active section belongs to and expand it
        const activeGroup = REPORT_SECTION_BATCHES.find(batch => batch.sections.includes(activeSectionId));
        if (activeGroup && !expandedNavGroups.includes(activeGroup.name)) {
            setExpandedNavGroups(prev => [...prev, activeGroup.name]);
        }
        // Reset chat when section changes
        setChatMessages([]);
    }, [activeSectionId]);
    
    const activeSectionData = useMemo(() => {
        return narrative?.sections.find(s => s.id === activeSectionId);
    }, [narrative?.sections, activeSectionId]);

    const handleSendMessage = useCallback(async (input: string) => {
        const userMessage: ChatMessage = { role: 'user', content: input };
        const currentHistory = [...chatMessages, userMessage];
        setChatMessages(currentHistory);
        setIsChatLoading(true);

        try {
            const stream = await generateChatResponseStream(
                currentHistory,
                activeSectionData?.analysis,
                reportData
            );
            
            let modelResponse = '';
            setChatMessages(prev => [...prev, { role: 'model', content: '' }]);
            
            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setChatMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', content: modelResponse };
                    return newMessages;
                });
            }
        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
             setChatMessages(prev => [...prev, { role: 'model', content: `Sorry, I encountered an error: ${errorMessage}` }]);
        } finally {
            setIsChatLoading(false);
        }
    }, [chatMessages, activeSectionData, reportData]);


    const handleToggleNavGroup = (groupName: string) => {
        setExpandedNavGroups(prev => 
            prev.includes(groupName)
                ? prev.filter(name => name !== groupName)
                : [...prev, groupName]
        );
    };
    
    const getReportTitle = useCallback(() => {
        if (!reportData.periods || reportData.periods.length === 0) return "Financial Report";
        if (reportData.periods.length === 1) return `${reportData.periods[0].periodLabel} Financial Report`;
        return `${reportData.periods[0].periodLabel} - ${reportData.periods[reportData.periods.length - 1].periodLabel} Financial Report`;
    }, [reportData]);

    const renderSectionContent = () => {
        if (activeSectionId === 'definitive_view') {
            if (generationState['definitive_view']?.status === 'loading') return <SkeletonLoader/>;
            return <DefinitiveView fullReport={narrative} currency={reportData.currency} />;
        }

        if (!activeSectionData) {
            return (
                 <div className="card" style={{textAlign: 'center', padding: '4rem'}}>
                    <Spinner />
                    <h3 style={{marginTop: '1rem'}}>Loading Section...</h3>
                 </div>
            );
        }
        
        const status = generationState[activeSectionId]?.status || 'pending';
        return <SectionDisplay section={activeSectionData} reportData={reportData} progressStatus={status} onRetrySection={onRetrySection} />;
    };

    if (isLoading && Object.values(generationState).every(s => s.status === 'pending' || s.status === 'skipped')) {
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
            {(isLoading && Object.values(generationState).some(s=>s.status === 'loading')) && <LiveGenerationStatus state={generationState} isLoading={isLoading} />}
            <header style={{marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap'}}>
                <div style={{display: 'flex', gap: '1.5rem', alignItems: 'flex-start'}}>
                    {reportData.companyLogo && <img src={reportData.companyLogo} alt={`${reportData.companyName} logo`} style={{height: '50px', width: 'auto', maxWidth: '150px', objectFit: 'contain', marginTop: '0.5rem'}} />}
                    <div>
                         <button onClick={onBackToInput} className="button button-secondary" style={{marginBottom: '1rem'}}>
                             <ArrowLeftIcon />
                             Back to Data Input
                         </button>
                         <h1 style={{margin: 0}}>{reportData.companyName}</h1>
                         <p style={{color: 'var(--color-text-secondary)', marginTop: '0.25rem', fontSize: '1.1rem'}}>{getReportTitle()}</p>
                    </div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <ExportControls 
                        narrative={narrative} 
                        reportData={reportData}
                    />
                     <button onClick={() => setIsChatOpen(true)} className="button button-primary">
                        <MessageSquareIcon />
                        Chat with AI
                    </button>
                </div>
            </header>

            <div className="dashboard">
                <nav className="dashboard-nav">
                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                        
                        <button
                            onClick={() => setActiveSectionId('definitive_view')}
                            className={`nav-item ${activeSectionId === 'definitive_view' ? 'active' : ''}`}
                            title={generationState['definitive_view']?.message}
                        >
                            <LayoutGridIcon />
                            <span style={{flexGrow: 1, textAlign: 'left', fontWeight: 600}}>Definitive View</span>
                            {generationState['definitive_view']?.status === 'loading' && <Spinner />}
                            {generationState['definitive_view']?.status === 'success' && <CheckCircleIcon style={{color: 'var(--color-success)'}} />}
                            {generationState['definitive_view']?.status === 'error' && <XIcon style={{color: 'var(--color-error)'}} />}
                            {generationState['definitive_view']?.status === 'skipped' && <InfoIcon style={{color: 'var(--color-text-secondary)'}} />}
                        </button>

                        <hr style={{border: 'none', borderTop: '1px solid var(--color-border)', margin: '0.5rem 0.75rem'}} />
                        
                        {REPORT_SECTION_BATCHES.map(group => (
                            <div key={group.name}>
                                <div className="dashboard-nav-group-header" onClick={() => handleToggleNavGroup(group.name)} data-expanded={expandedNavGroups.includes(group.name)}>
                                    <span>{group.name}</span>
                                    <ChevronDownIcon className="chevron" />
                                </div>
                                {expandedNavGroups.includes(group.name) && (
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                                    {group.sections.map(sectionId => {
                                        const section = narrative.sections.find(s => s.id === sectionId);
                                        if (!section) return null;
                                        const Icon = section.icon;
                                        const isActive = activeSectionId === section.id;
                                        const status = generationState[section.id]?.status || 'pending';
                                        
                                        return (
                                            <button
                                                key={section.id}
                                                onClick={() => setActiveSectionId(section.id)}
                                                className={`sub-nav-item ${isActive ? 'active' : ''}`}
                                                title={generationState[section.id]?.message}
                                            >
                                                <Icon style={{width: '16px', height: '16px', flexShrink: 0}}/>
                                                <span style={{flexGrow: 1, textAlign: 'left'}}>{section.name}</span>
                                                {status === 'loading' && <Spinner />}
                                                {status === 'success' && <CheckCircleIcon style={{color: 'var(--color-success)', width: '16px', height: '16px'}} />}
                                                {status === 'error' && <XIcon style={{color: 'var(--color-error)', width: '16px', height: '16px'}} />}
                                                {status === 'skipped' && <InfoIcon style={{color: 'var(--color-text-secondary)', width: '16px', height: '16px'}} />}
                                            </button>
                                        );
                                    })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </nav>
            
                <div className="dashboard-content" id="report-content" data-active-section={activeSectionId}>
                    {renderSectionContent()}
                </div>
            </div>
            
            <AIChat 
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                isLoading={isChatLoading}
            />
        </div>
    );
};

export default ReportDashboard;

const SkeletonLoader = () => (
    <div className="card" style={{ pageBreakInside: 'avoid' }}>
        <div className="skeleton skeleton-h3" style={{width: '40%'}}></div>
        <div className="skeleton skeleton-text" style={{width: '80%'}}></div>
        <div className="skeleton skeleton-text skeleton-text-short"></div>
        <div className="grid grid-cols-3" style={{gap: '1.5rem', margin: '2rem 0'}}>
            <div className="skeleton skeleton-card"></div>
            <div className="skeleton skeleton-card"></div>
            <div className="skeleton skeleton-card"></div>
            <div className="skeleton skeleton-card"></div>
            <div className="skeleton skeleton-card"></div>
            <div className="skeleton skeleton-card"></div>
        </div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text skeleton-text-short"></div>
    </div>
);
