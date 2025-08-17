
import React, { useState, useCallback } from 'react';
import { 
    ChatMessage,
    ReportData, initialReportData,
    AINarrativeResponse,
    QuantitativeData,
} from './types';
import { 
    generateQuantitativeData, generateNarrative, generateChatResponseStream
} from './services/geminiService';

import FinancialDataInput from './components/FinancialDataInput';
import ReportDashboard from './components/ReportDashboard';

import { REPORT_SECTIONS } from './constants';
import { SparklesIcon, MessageSquareIcon } from './components/icons';
import { AIChat } from './components/AIChat';

type AppView = 'input' | 'report';
export type GenerationStatus = {
    pass: 1 | 2;
    status: 'pending' | 'loading' | 'success' | 'error';
    message: string;
    persona?: string;
};
export type GenerationState = { [key: string]: GenerationStatus };

const EXPERT_MODEL_ASSIGNMENT: { [key: string]: string } = {
    'executive_summary': 'claude-3-sonnet',
    'financial_risks': 'claude-3-sonnet',
    'common_size_analysis': 'claude-3-sonnet',
    'report_methodology': 'claude-3-sonnet',
    'key_ratios': 'gpt-4o',
    'dupont_analysis': 'gpt-4o',
    'scenario_analysis': 'gpt-4o',
    'cost_and_margin_analysis': 'gpt-4o',
    'valuation_multiples': 'gpt-4o',
    'competitor_benchmarking': 'gemini-2.5-flash',
    'default': 'gemini-2.5-flash',
};

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<AppView>('input');
    const [globalError, setGlobalError] = useState<string | null>(null);
    
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);

    const [reportData, setReportData] = useState<ReportData>(initialReportData);
    const [narrative, setNarrative] = useState<AINarrativeResponse | null>(null);
    const [generationState, setGenerationState] = useState<GenerationState>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [activeSectionId, setActiveSectionId] = useState<string>(REPORT_SECTIONS[0].id);

    const handleGenerateReport = useCallback(async () => {
        if (isLoading) return;

        setIsLoading(true);
        setGlobalError(null);
        
        const sections = REPORT_SECTIONS;
        const data = reportData;
        
        const initialGenState: GenerationState = sections.reduce((acc, s) => ({ ...acc, [s.id]: { pass: 1, status: 'loading', message: `Pass 1: Analyzing quantitative data...` } }), {});
        setGenerationState(initialGenState);
        
        const initialNarrative: AINarrativeResponse = {
            sections: sections.map(s => ({...s, analysis: { headline: 'Loading analysis...', takeaways: [], narrative: '', quantitativeData: { keyMetrics:[], charts:[] } } })),
        };
        setNarrative(initialNarrative);
        setActiveSectionId(REPORT_SECTIONS[0].id);
        setActiveView('report');
        
        setChatMessages([{ role: 'model', content: "Hello! I'm your AI analyst. Ask me anything about this report." }]);

        // --- PASS 1: QUANTITATIVE ANALYSIS ---
        const quantPromises = sections.map(section => generateQuantitativeData(data, section.id));
        const quantResults = await Promise.allSettled(quantPromises);

        let pass1Data: { [key: string]: QuantitativeData | null } = {};
        quantResults.forEach((result, index) => {
            const sectionId = sections[index].id;
            if (result.status === 'fulfilled') {
                pass1Data[sectionId] = result.value;
                setGenerationState(prev => ({ ...prev, [sectionId]: { ...prev[sectionId], status: 'success', message: `✓ Pass 1: Quantitative analysis complete.` } }));
            } else {
                pass1Data[sectionId] = null;
                setGenerationState(prev => ({ ...prev, [sectionId]: { ...prev[sectionId], status: 'error', message: `✗ Pass 1 Failed: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}` } }));
            }
        });
        
        // --- PASS 2: NARRATIVE SYNTHESIS ---
        setGenerationState(prev => {
            const newState = { ...prev };
            sections.forEach(s => {
                if (newState[s.id]?.status === 'success') {
                    const persona = EXPERT_MODEL_ASSIGNMENT[s.id] || EXPERT_MODEL_ASSIGNMENT['default'];
                    newState[s.id] = { pass: 2, status: 'loading', message: `Pass 2: Synthesizing narrative...`, persona };
                }
            });
            return newState;
        });

        const narrativePromises = sections.map(section => {
            const quantData = pass1Data[section.id];
            if (quantData) {
                const persona = EXPERT_MODEL_ASSIGNMENT[section.id] || EXPERT_MODEL_ASSIGNMENT['default'];
                return generateNarrative(quantData, data, section.id, persona);
            }
            return Promise.reject(new Error("Quantitative data not available."));
        });

        const narrativeResults = await Promise.allSettled(narrativePromises);

        let finalNarrative = initialNarrative;
        narrativeResults.forEach((result, index) => {
            const sectionId = sections[index].id;
            const quantDataForSection = pass1Data[sectionId] || { keyMetrics: [], charts: [] };

            if (result.status === 'fulfilled') {
                const narrativeAnalysis = result.value;
                finalNarrative.sections = finalNarrative.sections.map(s => 
                    s.id === sectionId ? { ...s, analysis: { ...narrativeAnalysis, quantitativeData: quantDataForSection } } : s
                );
                 setGenerationState(prev => ({ ...prev, [sectionId]: { ...prev[sectionId], status: 'success', message: `✓ Analysis complete.` } }));
            } else {
                 finalNarrative.sections = finalNarrative.sections.map(s => 
                    s.id === sectionId ? { ...s, analysis: { headline: 'Narrative Failed', takeaways: [], narrative: result.reason instanceof Error ? result.reason.message : 'Unknown error', quantitativeData: quantDataForSection } } : s
                );
                 setGenerationState(prev => ({ ...prev, [sectionId]: { ...prev[sectionId], status: 'error', message: `✗ Pass 2 Failed: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}` } }));
            }
        });

        setNarrative(finalNarrative);
        setIsLoading(false);
    }, [isLoading, reportData]);

    const handleSendChatMessage = useCallback(async (message: string) => {
        if (!narrative) return;

        setIsChatLoading(true);
        const newUserMessage: ChatMessage = { role: 'user', content: message };
        const updatedMessages = [...chatMessages, newUserMessage];
        setChatMessages(updatedMessages);

        try {
            const activeSectionData = narrative?.sections.find(s => s.id === activeSectionId);
            const stream = await generateChatResponseStream(
                updatedMessages,
                activeSectionData?.analysis,
                reportData
            );
            
            setChatMessages(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                setChatMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'model') {
                        lastMessage.content += chunkText;
                    }
                    return newMessages;
                });
            }
        } catch (err) {
            const errorMessage: ChatMessage = { role: 'model', content: "Sorry, I couldn't process that request." };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsChatLoading(false);
        }
    }, [narrative, reportData, activeSectionId, chatMessages]);
    
    const renderContent = () => {
        if (activeView === 'report') {
            return <ReportDashboard 
                        narrative={narrative} 
                        reportData={reportData} 
                        isLoading={isLoading} 
                        generationState={generationState}
                        onBackToInput={() => setActiveView('input')} 
                        activeSectionId={activeSectionId}
                        setActiveSectionId={setActiveSectionId}
                    />;
        } else { // activeView === 'input'
            return <FinancialDataInput reportData={reportData} setReportData={setReportData} onGenerate={handleGenerateReport} isLoading={isLoading} error={globalError} />;
        }
    };
    
    return (
        <div>
            <header className="app-header">
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <div style={{backgroundColor: 'var(--color-primary)', padding: '10px', borderRadius: '8px', display: 'flex'}}>
                        <SparklesIcon style={{ color: 'white', width: '24px', height: '24px' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>Definitive AI</h1>
                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem'}}>Financial Analysis Suite</p>
                    </div>
                </div>
                 {activeView.endsWith('report') && (
                    <button onClick={() => setIsChatOpen(prev => !prev)} className="button button-secondary">
                        <MessageSquareIcon />
                        Chat with AI
                    </button>
                 )}
            </header>

            <main className="main-content">
                {renderContent()}
            </main>

            {activeView === 'report' && narrative && (
                <AIChat
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    messages={chatMessages}
                    onSendMessage={handleSendChatMessage}
                    isLoading={isChatLoading}
                />
            )}
        </div>
    );
};

export default App;