import React, { useState, useCallback, useMemo, useRef } from 'react';
import { ReportData, PeriodData, createInitialPeriod, BalanceSheetData, ScenarioData } from '../types';
import { Spinner } from './Spinner';
import { AlertTriangleIcon, TrashIcon, UploadCloudIcon, XIcon } from './icons';
import IncomeStatementInputs from './IncomeStatementInputs';
import BalanceSheetInputs from './BalanceSheetInputs';
import CashFlowInputs from './CashFlowInputs';
import SegmentInputs from './SegmentInputs';
import EsgInputs from './EsgInputs';
import BudgetInputs from './BudgetInputs';
import { demoReportData } from '../demoData';
import { INDUSTRY_OPTIONS } from '../constants';
import { extractFinancialsFromPdf } from '../services/geminiService';
import { InfoTooltip } from './InfoTooltip';
import { ValidationSummary } from './ValidationSummary';

interface FinancialDataInputProps {
    reportData: ReportData;
    setReportData: React.Dispatch<React.SetStateAction<ReportData>>;
    onGenerate: () => void;
    isLoading: boolean;
    error: string | null;
}

const WIZARD_STEPS = [
    { id: 'setup', name: 'Report Setup' },
    { id: 'financials', name: 'Financials' },
    { id: 'additional', name: 'Additional Data' },
    { id: 'market', name: 'Market & Competitors' },
    { id: 'scenario', name: 'Scenario Analysis' },
];

const FinancialDataInput: React.FC<FinancialDataInputProps> = ({ reportData, setReportData, onGenerate, isLoading, error }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [activePeriodIndex, setActivePeriodIndex] = useState(0);
    const [activeFinancialsTab, setActiveFinancialsTab] = useState<'income' | 'balance' | 'cash'>('income');
    const [isPdfProcessing, setIsPdfProcessing] = useState(false);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCompanyChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setReportData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, [setReportData]);
    
    const handleScenarioChange = useCallback((field: keyof ScenarioData, value: string) => {
        setReportData(prev => ({ ...prev, scenario: { ...prev.scenario, [field]: value } }));
    }, [setReportData]);

    const handleIndustryToggle = (industry: string) => {
        setReportData(prev => ({ ...prev, industries: prev.industries.includes(industry) ? prev.industries.filter(i => i !== industry) : [...prev.industries, industry] }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setReportData(prev => ({ ...prev, companyLogo: reader.result as string }));
            reader.readAsDataURL(file);
        }
    };

    const handlePeriodTypeChange = useCallback((type: 'Monthly' | 'Yearly') => {
        const newPeriod = createInitialPeriod();
        const currentYear = new Date().getFullYear();
        newPeriod.periodLabel = type === 'Yearly' ? currentYear.toString() : `Jan ${currentYear}`;
        setReportData(prev => ({ ...prev, periodType: type, periods: [newPeriod] }));
        setActivePeriodIndex(0);
    }, [setReportData]);

    const getNextPeriodLabel = useCallback((lastLabel: string, periodType: 'Monthly' | 'Yearly'): string => {
        if (periodType === 'Yearly') return `${(parseInt(lastLabel, 10) || new Date().getFullYear()) + 1}`;
        const date = new Date(lastLabel);
        if (isNaN(date.getTime())) {
            const year = new Date().getFullYear();
            const monthIndex = reportData.periods.length % 12;
            const nextDate = new Date(year, monthIndex, 1);
            return `${nextDate.toLocaleString('default', { month: 'short' })} ${nextDate.getFullYear()}`;
        }
        date.setMonth(date.getMonth() + 1);
        return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    }, [reportData.periods.length]);

    const addPeriod = useCallback(() => {
        const newActiveIndex = reportData.periods.length;
        setReportData(prev => {
            const lastPeriod = prev.periods[prev.periods.length - 1];
            const newPeriod = createInitialPeriod();
            newPeriod.periodLabel = getNextPeriodLabel(lastPeriod.periodLabel, prev.periodType);
            newPeriod.sharesOutstanding = lastPeriod.sharesOutstanding;
            return { ...prev, periods: [...prev.periods, newPeriod] };
        });
        setActivePeriodIndex(newActiveIndex);
    }, [setReportData, reportData.periods, getNextPeriodLabel]);

    const removePeriod = useCallback((indexToRemove: number) => {
        if (reportData.periods.length <= 1) return;
        const newActiveIndex = activePeriodIndex >= indexToRemove ? Math.max(0, activePeriodIndex - 1) : activePeriodIndex;
        setReportData(prev => ({ ...prev, periods: prev.periods.filter((_, index) => index !== indexToRemove) }));
        setActivePeriodIndex(newActiveIndex);
    }, [reportData.periods.length, activePeriodIndex, setReportData]);

    const updatePeriodData = useCallback(<K extends keyof PeriodData>(field: K, value: PeriodData[K]) => {
        setReportData(prev => ({ ...prev, periods: prev.periods.map((p, i) => i === activePeriodIndex ? { ...p, [field]: value } : p) }));
    }, [setReportData, activePeriodIndex]);

    const createChanger = useCallback(<S extends 'incomeStatement' | 'balanceSheet' | 'cashFlow' | 'esg' | 'budget'>(statement: S) => 
        <F extends keyof PeriodData[S]>(field: F, value: PeriodData[S][F]) => {
            const updatedStatementData = { ...reportData.periods[activePeriodIndex][statement], [field]: value };
            updatePeriodData(statement, updatedStatementData);
    }, [reportData.periods, activePeriodIndex, updatePeriodData]);
    
    const handleLoadDemoData = useCallback(() => {
        setReportData(demoReportData);
        setActivePeriodIndex(0);
    }, [setReportData]);
    
    const handlePdfImportClick = () => fileInputRef.current?.click();

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsPdfProcessing(true);
        setPdfError(null);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const base64String = (reader.result as string).split(',')[1];
                    const extractedData = await extractFinancialsFromPdf({ inlineData: { data: base64String, mimeType: file.type } });
                    setReportData(prev => ({ ...prev, ...extractedData }));
                    setActivePeriodIndex(0);
                } catch (err) {
                    setPdfError(err instanceof Error ? err.message : "PDF processing error.");
                } finally {
                    setIsPdfProcessing(false);
                }
            };
            reader.onerror = () => { setIsPdfProcessing(false); setPdfError("Failed to read file."); }
        } catch (err) {
            setIsPdfProcessing(false);
            setPdfError(err instanceof Error ? err.message : "Unknown error.");
        }
        if(e.target) e.target.value = '';
    };

    const handleCompetitorChange = (index: number, value: string) => {
        const newCompetitors = [...reportData.competitors];
        newCompetitors[index] = value;
        setReportData(prev => ({ ...prev, competitors: newCompetitors }));
    };
    const addCompetitor = () => setReportData(prev => ({ ...prev, competitors: [...prev.competitors, ''] }));
    const removeCompetitor = (index: number) => setReportData(prev => ({ ...prev, competitors: prev.competitors.filter((_, i) => i !== index) }));

    const activePeriodData = useMemo(() => reportData.periods[activePeriodIndex], [reportData.periods, activePeriodIndex]);

    const onIncomeChange = createChanger('incomeStatement');
    const onBalanceChange = createChanger('balanceSheet');
    const onCashFlowChange = createChanger('cashFlow');
    const onEsgChange = createChanger('esg');
    const onBudgetChange = createChanger('budget');
    const onSegmentsChange = (segments: PeriodData['segments']) => updatePeriodData('segments', segments);
    
    const renderWizardContent = () => {
        switch (activeStep) {
            case 0: // Report Setup
                return (
                    <>
                        <h2>Report Setup</h2>
                        <p className="form-description">Configure the basic details for your analysis.</p>
                        <div className="grid grid-cols-2">
                             <div className="card">
                                 <div className="form-group"><label className="form-label">Company Name</label><input type="text" name="companyName" value={reportData.companyName} onChange={handleCompanyChange} className="input" /></div>
                                <div className="grid grid-cols-2">
                                    <div className="form-group"><label className="form-label">Currency</label><input type="text" name="currency" value={reportData.currency} onChange={handleCompanyChange} className="input" placeholder="e.g., USD" /></div>
                                    <div className="form-group"><label className="form-label">Shares Outstanding <InfoTooltip text="Used to calculate Earnings Per Share (EPS)." /></label><input type="number" value={activePeriodData.sharesOutstanding} onChange={e => updatePeriodData('sharesOutstanding', e.target.value)} className="input" placeholder="e.g., 1000000" /></div>
                                </div>
                                <div className="form-group"><label className="form-label">Company Logo</label><input type="file" onChange={handleLogoChange} accept="image/*" style={{fontSize: '0.8rem'}}/>{reportData.companyLogo && <img src={reportData.companyLogo} alt="logo preview" style={{maxWidth: '100px', maxHeight:'40px', marginTop: '10px', objectFit: 'contain'}}/>}</div>
                             </div>
                             <div className="card">
                                <div className="form-group"><label className="form-label">Primary Industries</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>{INDUSTRY_OPTIONS.map(industry => (<button key={industry} onClick={() => handleIndustryToggle(industry)} className={`button ${reportData.industries.includes(industry) ? 'button-primary' : 'button-secondary'}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>{industry}</button>))}</div></div>
                             </div>
                        </div>
                    </>
                );
            case 1: // Financials
                return (
                    <>
                        <h2>Financials</h2>
                        <p className="form-description">Add reporting periods and input your core financial data. You can import from a PDF to get started quickly.</p>
                        <div style={{display:'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem'}}>
                             <div className="form-group" style={{marginBottom: 0}}><label className="form-label">Period Type</label><div style={{display:'flex', gap: '10px'}}><button onClick={() => handlePeriodTypeChange('Monthly')} className={`button ${reportData.periodType === 'Monthly' ? 'button-primary' : 'button-secondary'}`}>Monthly</button><button onClick={() => handlePeriodTypeChange('Yearly')} className={`button ${reportData.periodType === 'Yearly' ? 'button-primary' : 'button-secondary'}`}>Yearly</button></div></div>
                            <div><input type="file" ref={fileInputRef} onChange={handlePdfUpload} style={{ display: 'none' }} accept="application/pdf" /><button onClick={handlePdfImportClick} disabled={isPdfProcessing} className="button button-secondary">{isPdfProcessing ? <Spinner/> : <UploadCloudIcon/>} <span>Import from PDF</span></button></div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                            {reportData.periods.map((period, index) => (<div key={index} style={{ display: 'flex' }}><button onClick={() => setActivePeriodIndex(index)} className={`button ${activePeriodIndex === index ? 'button-primary' : 'button-secondary'}`} style={{ borderTopRightRadius: reportData.periods.length > 1 ? 0 : '', borderBottomRightRadius: reportData.periods.length > 1 ? 0 : '', gap: '0.5rem' }}>{period.periodLabel || `${reportData.periodType} ${index + 1}`}</button>{reportData.periods.length > 1 && (<button onClick={() => removePeriod(index)} className="button button-secondary" style={{ padding: '0.5rem', borderLeft: 'none', borderRadius: '0 6px 6px 0' }} aria-label={`Remove ${period.periodLabel}`}><TrashIcon width="16" height="16" /></button>)}</div>))}
                            <button onClick={addPeriod} className="button button-tertiary" style={{border: '1px dashed var(--color-border)'}}>+ Add Period</button>
                        </div>
                        <h3 style={{marginBottom: '1rem'}}>Core Financials for {activePeriodData.periodLabel}</h3>
                        <div className="tabs" role="tablist">
                            <button role="tab" aria-selected={activeFinancialsTab === 'income'} onClick={() => setActiveFinancialsTab('income')} className={`tab-button ${activeFinancialsTab === 'income' ? 'active' : ''}`}>Income Statement</button>
                            <button role="tab" aria-selected={activeFinancialsTab === 'balance'} onClick={() => setActiveFinancialsTab('balance')} className={`tab-button ${activeFinancialsTab === 'balance' ? 'active' : ''}`}>Balance Sheet</button>
                            <button role="tab" aria-selected={activeFinancialsTab === 'cash'} onClick={() => setActiveFinancialsTab('cash')} className={`tab-button ${activeFinancialsTab === 'cash' ? 'active' : ''}`}>Cash Flow</button>
                        </div>
                        <div className="tab-content">
                            {activeFinancialsTab === 'income' && <IncomeStatementInputs data={activePeriodData.incomeStatement} onChange={onIncomeChange} />}
                            {activeFinancialsTab === 'balance' && <BalanceSheetInputs data={activePeriodData.balanceSheet} onChange={onBalanceChange} />}
                            {activeFinancialsTab === 'cash' && <CashFlowInputs data={activePeriodData.cashFlow} onChange={onCashFlowChange} />}
                        </div>
                    </>
                );
            case 2: // Additional Data
                return (
                    <>
                        <h2>Additional Data (Optional)</h2>
                        <p className="form-description">Providing this extra data will unlock deeper, more specific analysis in the final report.</p>
                        <h4 style={{marginBottom: '1rem'}}>Data for {activePeriodData.periodLabel}</h4>
                        <SegmentInputs data={activePeriodData.segments} onChange={onSegmentsChange} />
                        <EsgInputs data={activePeriodData.esg} onChange={onEsgChange} />
                        <BudgetInputs data={activePeriodData.budget} onChange={onBudgetChange} />
                    </>
                );
            case 3: // Market & Competitors
                return (
                    <>
                         <h2>Market & Competitors (Optional)</h2>
                         <p className="form-description">This enables direct competitor benchmarking and valuation analysis in the report.</p>
                        <div className="form-group"><label className="form-label">Market Valuation ({reportData.currency})<InfoTooltip text="For public companies, this is share price × shares outstanding. For private companies, use the latest 409A or transaction valuation." /></label><input type="number" name="marketValuation" value={reportData.marketValuation} onChange={handleCompanyChange} className="input" placeholder="e.g., 50000000" /></div>
                        <div className="form-group"><label className="form-label">Key Competitors</label><div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>{reportData.competitors.map((c, i) => (<div key={i} style={{ display: 'flex', gap: '0.5rem' }}><input type="text" value={c} onChange={(e) => handleCompetitorChange(i, e.target.value)} className="input" placeholder="e.g., Apple Inc." /><button onClick={() => removeCompetitor(i)} className="button button-tertiary" style={{ padding: '0.5rem' }}><XIcon style={{ width: '16px', height: '16px', color: 'var(--color-error)' }} /></button></div>))}<button onClick={addCompetitor} className="button button-tertiary" style={{ alignSelf: 'flex-start' }}>+ Add Competitor</button></div></div>
                    </>
                );
            case 4: // Scenario Analysis
                return (
                    <>
                        <h2>Scenario Analysis (Optional)</h2>
                        <p className="form-description">Project future performance based on a few key assumptions. The AI will generate a pro-forma P&L for the next period.</p>
                        <div className="grid grid-cols-3">
                            <div className="form-group"><label className="form-label">Next Period Revenue Growth (%) <InfoTooltip text="The expected percentage increase in total revenue for the next period." /></label><input type="number" value={reportData.scenario.revenueGrowth} onChange={(e) => handleScenarioChange('revenueGrowth', e.target.value)} className="input" placeholder="e.g., 10" /></div>
                            <div className="form-group"><label className="form-label">Next Period COGS (% of Revenue) <InfoTooltip text="The expected Cost of Goods Sold as a percentage of the projected revenue." /></label><input type="number" value={reportData.scenario.cogsPercentage} onChange={(e) => handleScenarioChange('cogsPercentage', e.target.value)} className="input" placeholder="e.g., 45" /></div>
                            <div className="form-group"><label className="form-label">Next Period OpEx Growth (%) <InfoTooltip text="The expected percentage increase in total Operating Expenses (excluding COGS and D&A)." /></label><input type="number" value={reportData.scenario.opexGrowth} onChange={(e) => handleScenarioChange('opexGrowth', e.target.value)} className="input" placeholder="e.g., 5" /></div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Qualitative Assumptions & Internal Information <InfoTooltip text="Provide text-based context the AI can use to enrich its narrative. E.g., new product launches, market expansion plans, competitive threats, key personnel changes." /></label>
                            <textarea
                                value={reportData.scenario.qualitativeAssumptions || ''}
                                onChange={(e) => handleScenarioChange('qualitativeAssumptions', e.target.value)}
                                className="input"
                                placeholder="e.g., We are launching our new 'X1' model in Q2 which is expected to capture 5% market share."
                            />
                        </div>
                    </>
                );
            default: return null;
        }
    }

    if (!activePeriodData) return <div>Error: No active period found. Please refresh.</div>;

    return (
        <div className="card">
            <div className="wizard-layout">
                <nav className="wizard-stepper" aria-label="Data input steps">
                    <ol>
                    {WIZARD_STEPS.map((step, index) => (
                        <li key={step.id}>
                        <button 
                             className={`stepper-item ${activeStep === index ? 'active' : ''}`}
                             onClick={() => setActiveStep(index)}
                             aria-current={activeStep === index ? 'step' : 'false'}
                        >
                            <div className="stepper-number">{index + 1}</div>
                            <span className="stepper-item-label">{step.name}</span>
                        </button>
                        </li>
                    ))}
                    </ol>
                </nav>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2rem', alignItems: 'flex-start' }}>
                    <div className="wizard-content" style={{minWidth: 0}}>
                        {renderWizardContent()}
                    </div>
                    {activeStep === 1 && (
                         <ValidationSummary period={activePeriodData} currency={reportData.currency} />
                    )}
                </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <button onClick={handleLoadDemoData} disabled={isLoading || isPdfProcessing} className="button button-tertiary">Load Demo Data</button>
                </div>
                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                    {activeStep > 0 && <button onClick={() => setActiveStep(s => s - 1)} className="button button-secondary">Previous</button>}
                    {activeStep < WIZARD_STEPS.length - 1 && <button onClick={() => setActiveStep(s => s + 1)} className="button button-secondary">Next</button>}
                    {activeStep === WIZARD_STEPS.length - 1 && (
                        <button onClick={onGenerate} disabled={isLoading || isPdfProcessing} className="button button-primary" style={{ minWidth: '220px' }}>
                            {isLoading ? <Spinner /> : <span>Analyze & Generate Report</span>}
                        </button>
                    )}
                </div>
            </div>

            {(error || pdfError) && (
                <div className="card" style={{ borderColor: 'var(--color-error)', backgroundColor: '#fef2f2', marginTop: '1rem', padding: '1rem' }}>
                    <h4 style={{ color: 'var(--color-error)', margin: 0 }}><AlertTriangleIcon style={{ display: 'inline-block', marginRight: '8px' }} /> Error</h4>
                    <p style={{ color: '#b91c1c', margin: '0.5rem 0 0 0', whiteSpace: 'pre-wrap' }}>{error || pdfError}</p>
                </div>
            )}
        </div>
    );
};

export default FinancialDataInput;
