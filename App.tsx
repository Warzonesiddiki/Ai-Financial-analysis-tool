
import React, { useState, useCallback } from 'react';
import { GoogleAuthProvider, useGoogleAuth } from './components/GoogleAuthProvider';
import { LoginModal } from './components/LoginModal';
import { UserProfile } from './components/UserProfile';
import { initializeAI } from './services/geminiService';
import { 
    ChatMessage,
    ReportData, AINarrativeResponse, initialReportData,
    SaaSReportData, SaaSNarrativeResponse, createInitialSaaSPeriod,
    UaeProjectReportData, UaeConstructionNarrativeResponse, createInitialProject,
    ProfessionalServicesReportData, ProfessionalServicesNarrativeResponse, createInitialProfessionalServicesPeriod,
    APARReportData, APARNarrativeResponse, createInitialAPARPeriod,
    InventoryReportData, InventoryNarrativeResponse, createInitialInventoryPeriod,
    HrReportData, HrNarrativeResponse, createInitialHrPeriod,
    CashFlowForecastReportData, CashFlowForecastNarrativeResponse, createInitialCashFlowForecastPeriod,
    SectionAnalysis
} from './types';
import { 
    generateSectionAnalysis, generateChatResponse
} from './services/geminiService';

import ModeSelector from './components/ModeSelector';
import FinancialDataInput from './components/FinancialDataInput';
import ReportDashboard from './components/ReportDashboard';
import SaaSDataInput from './components/SaaSDataInput';
import SaaSReportDashboard from './components/SaaSReportDashboard';
import UaeConstructionDataInput from './components/UaeConstructionDataInput';
import UaeConstructionReportDashboard from './components/UaeConstructionReportDashboard';
import ProfessionalServicesDataInput from './components/ProfessionalServicesDataInput';
import ProfessionalServicesReportDashboard from './components/ProfessionalServicesReportDashboard';
import APARDataInput from './components/APARDataInput';
import APARReportDashboard from './components/APARReportDashboard';
import InventoryDataInput from './components/InventoryDataInput';
import InventoryReportDashboard from './components/InventoryReportDashboard';
import HRDataInput from './components/HRDataInput';
import HRReportDashboard from './components/HRReportDashboard';
import CashFlowForecastDataInput from './components/CashFlowForecastDataInput';
import CashFlowForecastReportDashboard from './components/CashFlowForecastReportDashboard';

import { 
    REPORT_SECTIONS, SAAS_REPORT_SECTIONS, UAE_CONSTRUCTION_SECTIONS, PROFESSIONAL_SERVICES_SECTIONS,
    AP_AR_SECTIONS, INVENTORY_SECTIONS, HR_SECTIONS, CASH_FLOW_FORECAST_SECTIONS
} from './constants';
import { SparklesIcon, MessageSquareIcon } from './components/icons';
import { AIChat } from './components/AIChat';

const AppContent: React.FC = () => {
    const { isAuthenticated, signIn, apiKey } = useGoogleAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Initialize AI when user is authenticated
    React.useEffect(() => {
        if (isAuthenticated && apiKey) {
            initializeAI(apiKey);
        }
    }, [isAuthenticated, apiKey]);

type AnalysisMode = 'financial' | 'construction' | 'saas' | 'services' | 'apar' | 'inventory' | 'hr' | 'cash_flow_forecast';
type AppView = 'input' | 'report';
type ProgressState = { [key: string]: 'pending' | 'loading' | 'success' | 'error' };

const App: React.FC = () => {
    // === GLOBAL STATE ===
    const [analysisMode, setAnalysisMode] = useState<AnalysisMode | null>(null);
    const [activeView, setActiveView] = useState<AppView>('input');
    const [globalError, setGlobalError] = useState<string | null>(null);
    
    // === CHAT STATE ===
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);

    // === MODULE-SPECIFIC STATE ===
    // Comprehensive Financial
    const [reportData, setReportData] = useState<ReportData>(initialReportData);
    const [narrative, setNarrative] = useState<AINarrativeResponse | null>(null);
    const [progress, setProgress] = useState<ProgressState>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // SaaS
    const [saasData, setSaaSData] = useState<SaaSReportData>({ companyName: 'SaaS Co.', currency: 'USD', periodType: 'Quarterly', periods: [createInitialSaaSPeriod()], industries: ['SaaS'], averageContractLengthMonths: '12', grossMarginPercentage: '80' });
    const [saasNarrative, setSaaSNarrative] = useState<SaaSNarrativeResponse | null>(null);
    const [saasProgress, setSaaSProgress] = useState<ProgressState>({});
    const [isSaaSLoading, setIsSaaSLoading] = useState(false);

    // UAE Construction
    const [uaeData, setUaeData] = useState<UaeProjectReportData>({ companyName: 'Arabian Builders', currency: 'AED', projects: [createInitialProject()], forecastAssumptions: { forecastEnabled: true, revenueGrowthRate: '15', expectedMargin: '18' }});
    const [uaeNarrative, setUaeNarrative] = useState<UaeConstructionNarrativeResponse | null>(null);
    const [uaeProgress, setUaeProgress] = useState<ProgressState>({});
    const [isUaeLoading, setIsUaeLoading] = useState(false);
    
    // Professional Services
    const [psData, setPsData] = useState<ProfessionalServicesReportData>({ companyName: 'MENA Advisors', currency: 'AED', periods: [createInitialProfessionalServicesPeriod()] });
    const [psNarrative, setPsNarrative] = useState<ProfessionalServicesNarrativeResponse | null>(null);
    const [psProgress, setPsProgress] = useState<ProgressState>({});
    const [isPsLoading, setIsPsLoading] = useState(false);

    // AP/AR
    const [aparData, setAparData] = useState<APARReportData>({ companyName: 'Trading LLC', currency: 'USD', periods: [createInitialAPARPeriod()]});
    const [aparNarrative, setAparNarrative] = useState<APARNarrativeResponse | null>(null);
    const [aparProgress, setAparProgress] = useState<ProgressState>({});
    const [isAparLoading, setIsAparLoading] = useState(false);

    // Inventory
    const [inventoryData, setInventoryData] = useState<InventoryReportData>({ companyName: 'Retail Co.', currency: 'USD', periods: [createInitialInventoryPeriod()]});
    const [inventoryNarrative, setInventoryNarrative] = useState<InventoryNarrativeResponse | null>(null);
    const [inventoryProgress, setInventoryProgress] = useState<ProgressState>({});
    const [isInventoryLoading, setIsInventoryLoading] = useState(false);

    // HR
    const [hrData, setHrData] = useState<HrReportData>({ companyName: 'Global Corp.', currency: 'USD', periodType: 'Quarterly', periods: [createInitialHrPeriod()]});
    const [hrNarrative, setHrNarrative] = useState<HrNarrativeResponse | null>(null);
    const [hrProgress, setHrProgress] = useState<ProgressState>({});
    const [isHrLoading, setIsHrLoading] = useState(false);

    // Cash Flow Forecast
    const [cffData, setCffData] = useState<CashFlowForecastReportData>({ companyName: 'Solutions Inc.', currency: 'USD', periods: [createInitialCashFlowForecastPeriod()]});
    const [cffNarrative, setCffNarrative] = useState<CashFlowForecastNarrativeResponse | null>(null);
    const [cffProgress, setCffProgress] = useState<ProgressState>({});
    const [isCffLoading, setIsCffLoading] = useState(false);
    
    // === UNIVERSAL REPORT GENERATION LOGIC ===
    const handleGenerateReport = useCallback(async <T, U>(
        reportData: T,
        sections: { id: string; name: string; icon: any }[],
        analysisFn: (data: T, sectionId: string) => Promise<SectionAnalysis>,
        setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
        setProgress: React.Dispatch<React.SetStateAction<ProgressState>>,
        setNarrative: React.Dispatch<React.SetStateAction<U | null>>,
        isLoading: boolean
    ) => {
        if (isLoading) return;
        setIsLoading(true);
        setGlobalError(null);
        
        const initialProgress = sections.reduce((acc, s) => ({ ...acc, [s.id]: 'pending' }), {});
        setProgress(initialProgress);
        
        const initialNarrative: any = {
            sections: sections.map(s => ({...s, analysis: { headline: 'Pending...', takeaways: [], narrative: '' } })),
        };
        setNarrative(initialNarrative);
        setActiveView('report');
        
        setChatMessages([{ role: 'model', content: "Hello! I'm your AI analyst. Ask me anything about this report." }]);

        for (const section of sections) {
            setProgress(prev => ({ ...prev, [section.id]: 'loading' }));
            
            try {
                const analysis = await analysisFn(reportData, section.id);
                setNarrative(prev => {
                    if (!prev) return null;
                    const typedPrev = prev as any;
                    const newSections = typedPrev.sections.map((s: any) => 
                        s.id === section.id ? { ...s, analysis } : s
                    );
                    return { ...typedPrev, sections: newSections } as U;
                });
                setProgress(prev => ({ ...prev, [section.id]: 'success' }));
            } catch (error) {
                console.error(`Error processing section ${section.id}:`, error);
                const failedAnalysis: SectionAnalysis = {
                    headline: `Failed to generate analysis`,
                    takeaways: [],
                    narrative: error instanceof Error ? error.message : 'An unknown error occurred.'
                };
                setNarrative(prev => {
                    if (!prev) return null;
                    const typedPrev = prev as any;
                    return {
                        ...typedPrev,
                        sections: typedPrev.sections.map((s: any) => 
                            s.id === section.id 
                            ? { ...s, analysis: failedAnalysis } 
                            : s
                        )
                    } as U;
                });
                setProgress(prev => ({ ...prev, [section.id]: 'error' }));
            }
        }

        setIsLoading(false);
    }, []);

    // === CHAT FUNCTIONALITY ===
    const handleSendChatMessage = async (message: string) => {
        // This needs to be adapted for different modules
        if(!narrative) return;
        
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }

        setIsChatLoading(true);
        const newUserMessage: ChatMessage = { role: 'user', content: message };
        setChatMessages(prev => [...prev, newUserMessage]);

        try {
            // This context part would need to be generalized if chat is used across all modules
            const response = await generateChatResponse(chatMessages, undefined, reportData);
            const modelMessage: ChatMessage = { role: 'model', content: response };
            setChatMessages(prev => [...prev, modelMessage]);
        } catch (err) {
            const errorMessage: ChatMessage = { role: 'model', content: "Sorry, I couldn't process that request." };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsChatLoading(false);
        }
    };
    
    const handleBackToSelector = () => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }
        setAnalysisMode(null);
        setActiveView('input');
        setNarrative(null);
        setSaaSNarrative(null);
        setUaeNarrative(null);
        setPsNarrative(null);
        setAparNarrative(null);
        setInventoryNarrative(null);
        setHrNarrative(null);
        setCffNarrative(null);
    };

    const renderContent = () => {
        if (!isAuthenticated) {
            return (
                <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
                    <div className="card">
                        <h2>Welcome to Definitive</h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                            Sign in with your Google account to access AI-powered financial analysis tools.
                        </p>
                        <button onClick={() => setShowLoginModal(true)} className="button button-primary">
                            Get Started
                        </button>
                    </div>
                </div>
            );
        }

        if (!analysisMode) {
            return <ModeSelector onSelect={(mode) => {
                setAnalysisMode(mode);
                setActiveView('input');
            }} />;
        }
        
        switch (analysisMode) {
            case 'financial':
                return activeView === 'input' ? 
                    <FinancialDataInput reportData={reportData} setReportData={setReportData} onGenerate={() => handleGenerateReport(reportData, REPORT_SECTIONS, generateSectionAnalysis, setIsLoading, setProgress, setNarrative, isLoading)} isLoading={isLoading} error={globalError} onBack={handleBackToSelector} /> :
                    <ReportDashboard narrative={narrative} reportData={reportData} isLoading={isLoading} progress={progress} onBackToInput={() => setActiveView('input')} />;
            
            case 'saas':
                 return activeView === 'input' ?
                    <SaaSDataInput reportData={saasData} setReportData={setSaaSData} onGenerate={() => handleGenerateReport(saasData, SAAS_REPORT_SECTIONS, generateSectionAnalysis, setIsSaaSLoading, setSaaSProgress, setSaaSNarrative, isSaaSLoading)} isLoading={isSaaSLoading} error={globalError} onBack={handleBackToSelector} /> :
                    <SaaSReportDashboard narrative={saasNarrative} reportData={saasData} isLoading={isSaaSLoading} progress={saasProgress} onBackToInput={() => setActiveView('input')} />;

            case 'construction':
                return activeView === 'input' ?
                    <UaeConstructionDataInput reportData={uaeData} setReportData={setUaeData} onGenerate={() => handleGenerateReport(uaeData, UAE_CONSTRUCTION_SECTIONS, generateSectionAnalysis, setIsUaeLoading, setUaeProgress, setUaeNarrative, isUaeLoading)} isLoading={isUaeLoading} error={globalError} onBack={handleBackToSelector} /> :
                    <UaeConstructionReportDashboard narrative={uaeNarrative} reportData={uaeData} isLoading={isUaeLoading} progress={uaeProgress} onBackToInput={() => setActiveView('input')} />;
            
            case 'services':
                 return activeView === 'input' ?
                    <ProfessionalServicesDataInput reportData={psData} setReportData={setPsData} onGenerate={() => handleGenerateReport(psData, PROFESSIONAL_SERVICES_SECTIONS, generateSectionAnalysis, setIsPsLoading, setPsProgress, setPsNarrative, isPsLoading)} isLoading={isPsLoading} error={globalError} onBack={handleBackToSelector} /> :
                    <ProfessionalServicesReportDashboard narrative={psNarrative} reportData={psData} isLoading={isPsLoading} progress={psProgress} onBackToInput={() => setActiveView('input')} />;
            
             case 'apar':
                return activeView === 'input' ?
                    <APARDataInput reportData={aparData} setReportData={setAparData} onGenerate={() => handleGenerateReport(aparData, AP_AR_SECTIONS, generateSectionAnalysis, setIsAparLoading, setAparProgress, setAparNarrative, isAparLoading)} isLoading={isAparLoading} error={globalError} onBack={handleBackToSelector} /> :
                    <APARReportDashboard narrative={aparNarrative} reportData={aparData} isLoading={isAparLoading} progress={aparProgress} onBackToInput={() => setActiveView('input')} />;
            
            case 'inventory':
                 return activeView === 'input' ?
                    <InventoryDataInput reportData={inventoryData} setReportData={setInventoryData} onGenerate={() => handleGenerateReport(inventoryData, INVENTORY_SECTIONS, generateSectionAnalysis, setIsInventoryLoading, setInventoryProgress, setInventoryNarrative, isInventoryLoading)} isLoading={isInventoryLoading} error={globalError} onBack={handleBackToSelector} /> :
                    <InventoryReportDashboard narrative={inventoryNarrative} reportData={inventoryData} isLoading={isInventoryLoading} progress={inventoryProgress} onBackToInput={() => setActiveView('input')} />;

            case 'hr':
                 return activeView === 'input' ?
                    <HRDataInput reportData={hrData} setReportData={setHrData} onGenerate={() => handleGenerateReport(hrData, HR_SECTIONS, generateSectionAnalysis, setIsHrLoading, setHrProgress, setHrNarrative, isHrLoading)} isLoading={isHrLoading} error={globalError} onBack={handleBackToSelector} /> :
                    <HRReportDashboard narrative={hrNarrative} reportData={hrData} isLoading={isHrLoading} progress={hrProgress} onBackToInput={() => setActiveView('input')} />;

            case 'cash_flow_forecast':
                 return activeView === 'input' ?
                    <CashFlowForecastDataInput reportData={cffData} setReportData={setCffData} onGenerate={() => handleGenerateReport(cffData, CASH_FLOW_FORECAST_SECTIONS, generateSectionAnalysis, setIsCffLoading, setCffProgress, setCffNarrative, isCffLoading)} isLoading={isCffLoading} error={globalError} onBack={handleBackToSelector} /> :
                    <CashFlowForecastReportDashboard narrative={cffNarrative} reportData={cffData} isLoading={isCffLoading} progress={cffProgress} onBackToInput={() => setActiveView('input')} />;

            default:
                return <ModeSelector onSelect={setAnalysisMode} />;
        }
    };
    
    return (
        <div>
            <header style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem' }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                    <SparklesIcon style={{ color: 'var(--color-primary)', width: '32px', height: '32px' }} />
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Definitive</h1>
                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem'}}>AI Financial Analysis Suite</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {activeView.endsWith('report') && analysisMode === 'financial' && (
                        <button onClick={() => setIsChatOpen(prev => !prev)} className="button button-secondary">
                            <MessageSquareIcon />
                            Chat with AI
                        </button>
                    )}
                    <UserProfile />
                </div>
            </header>

            <main className="main-content">
                {renderContent()}
            </main>

            {analysisMode === 'financial' && activeView === 'report' && narrative && (
                <AIChat
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    messages={chatMessages}
                    onSendMessage={handleSendChatMessage}
                    isLoading={isChatLoading}
                />
            )}
            
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSignIn={signIn}
            />
        </div>
    );
};

