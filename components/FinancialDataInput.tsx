
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { ReportData, PeriodData, createInitialPeriod, BalanceSheetData, ScenarioData } from '../types';
import { Spinner } from './Spinner';
import { AlertTriangleIcon, TrashIcon, UploadCloudIcon, ArrowLeftIcon, CheckCircleIcon, XIcon } from './icons';
import CollapsibleSection from './CollapsibleSection';
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


interface FinancialDataInputProps {
    reportData: ReportData;
    setReportData: React.Dispatch<React.SetStateAction<ReportData>>;
    onGenerate: () => void;
    isLoading: boolean;
    error: string | null;
}

const safeParse = (value: string | number): number => {
    if (typeof value === 'number') return value;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
};

const validateBalanceSheet = (bs: BalanceSheetData): { status: 'balanced' | 'unbalanced', diff: number } => {
    const totalCurrentAssets = ['cashAndBankBalances', 'accountsReceivable', 'inventory', 'prepayments', 'otherCurrentAssets'].reduce((sum, key) => sum + safeParse(bs[key as keyof BalanceSheetData] as string), 0);
    const totalNonCurrentAssets = ['propertyPlantEquipmentNet', 'intangibleAssets', 'investmentProperties', 'longTermInvestments'].reduce((sum, key) => sum + safeParse(bs[key as keyof BalanceSheetData] as string), 0);
    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

    const totalCurrentLiabilities = ['accountsPayable', 'accruedExpenses', 'shortTermLoans', 'currentPortionOfLTDebt'].reduce((sum, key) => sum + safeParse(bs[key as keyof BalanceSheetData] as string), 0);
    const totalNonCurrentLiabilities = ['longTermLoans', 'leaseLiabilities', 'deferredTaxLiability'].reduce((sum, key) => sum + safeParse(bs[key as keyof BalanceSheetData] as string), 0);
    const totalEquity = ['shareCapital', 'retainedEarnings', 'otherReserves'].reduce((sum, key) => sum + safeParse(bs[key as keyof BalanceSheetData] as string), 0);
    const totalLiabilitiesAndEquity = totalCurrentLiabilities + totalNonCurrentLiabilities + totalEquity;

    const difference = totalAssets - totalLiabilitiesAndEquity;
    return {
        status: Math.abs(difference) < 1 ? 'balanced' : 'unbalanced',
        diff: difference
    };
};


const WizardStep: React.FC<{ currentStep: number, stepNumber: number, label: string }> = ({ currentStep, stepNumber, label }) => {
    const isActive = currentStep === stepNumber;
    const isCompleted = currentStep > stepNumber;
    const stepClass = isActive ? 'active' : isCompleted ? 'completed' : '';

    return (
        <div className={`step ${stepClass}`}>
            <div className="step-indicator">{isCompleted ? '✓' : stepNumber}</div>
            <div className="step-label">{label}</div>
        </div>
    );
};

const FinancialDataInput: React.FC<FinancialDataInputProps> = ({ reportData, setReportData, onGenerate, isLoading, error }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [activePeriodIndex, setActivePeriodIndex] = useState(0);
    const [activeCoreTab, setActiveCoreTab] = useState('income');
    const [isPdfProcessing, setIsPdfProcessing] = useState(false);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCompanyChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setReportData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, [setReportData]);
    
    const handleScenarioChange = useCallback((field: keyof ScenarioData, value: string) => {
        setReportData(prev => ({
            ...prev,
            scenario: {
                ...prev.scenario,
                [field]: value
            }
        }));
    }, [setReportData]);

    const handleIndustryToggle = (industry: string) => {
        setReportData(prev => {
            const newIndustries = prev.industries.includes(industry)
                ? prev.industries.filter(i => i !== industry)
                : [...prev.industries, industry];
            return { ...prev, industries: newIndustries };
        });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReportData(prev => ({ ...prev, companyLogo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePeriodTypeChange = useCallback((type: 'Monthly' | 'Yearly') => {
        const newPeriod = createInitialPeriod();
        const currentYear = new Date().getFullYear();
        newPeriod.periodLabel = type === 'Yearly' ? currentYear.toString() : `Jan ${currentYear}`;
        
        setReportData(prev => ({
            ...prev,
            periodType: type,
            periods: [newPeriod],
        }));
        setActivePeriodIndex(0);
    }, [setReportData]);

    const getNextPeriodLabel = useCallback((lastLabel: string, periodType: 'Monthly' | 'Yearly'): string => {
        if (periodType === 'Yearly') {
            const lastYear = parseInt(lastLabel, 10);
            return isNaN(lastYear) ? `${new Date().getFullYear() + 1}` : `${lastYear + 1}`;
        } else {
            const date = new Date(lastLabel);
            if (isNaN(date.getTime())) {
                const year = new Date().getFullYear();
                const monthIndex = reportData.periods.length % 12;
                const nextDate = new Date(year, monthIndex, 1);
                return nextDate.toLocaleString('default', { month: 'short' }) + ' ' + nextDate.getFullYear();
            }
            date.setMonth(date.getMonth() + 1);
            return date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();
        }
    }, [reportData.periods.length]);

    const addPeriod = useCallback(() => {
        const newActiveIndex = reportData.periods.length;
        setReportData(prev => {
            const lastPeriod = prev.periods[prev.periods.length - 1];
            const newPeriodLabel = getNextPeriodLabel(lastPeriod.periodLabel, prev.periodType);
            
            const newPeriod = createInitialPeriod();
            newPeriod.periodLabel = newPeriodLabel;
            newPeriod.sharesOutstanding = lastPeriod.sharesOutstanding; // Carry over shares outstanding

            const newPeriods = [...prev.periods, newPeriod];
            return { ...prev, periods: newPeriods };
        });
        setActivePeriodIndex(newActiveIndex);
    }, [setReportData, reportData.periods, getNextPeriodLabel]);

    const removePeriod = useCallback((indexToRemove: number) => {
        if (reportData.periods.length <= 1) return;
        
        const newActiveIndex = activePeriodIndex >= indexToRemove 
            ? Math.max(0, activePeriodIndex - 1) 
            : activePeriodIndex;
        
        setReportData(prev => ({
            ...prev,
            periods: prev.periods.filter((_, index) => index !== indexToRemove)
        }));
        setActivePeriodIndex(newActiveIndex);
    }, [reportData.periods.length, activePeriodIndex, setReportData]);

    const updatePeriodData = useCallback(<K extends keyof PeriodData>(field: K, value: PeriodData[K]) => {
        setReportData(prev => ({
            ...prev,
            periods: prev.periods.map((period, index) => 
                index === activePeriodIndex ? { ...period, [field]: value } : period
            )
        }));
    }, [setReportData, activePeriodIndex]);

    const createChanger = useCallback(<S extends 'incomeStatement' | 'balanceSheet' | 'cashFlow' | 'esg' | 'budget'>(statement: S) => 
        <F extends keyof PeriodData[S]>(field: F, value: PeriodData[S][F]) => {
            const activePeriodData = reportData.periods[activePeriodIndex];
            if (!activePeriodData) return;
            const currentStatementData = activePeriodData[statement];
            const updatedStatementData = { ...currentStatementData, [field]: value };
            updatePeriodData(statement, updatedStatementData);
    }, [reportData.periods, activePeriodIndex, updatePeriodData]);
    
    const handleLoadDemoData = useCallback(() => {
        setReportData(demoReportData);
        setActivePeriodIndex(0);
    }, [setReportData]);
    
    const handlePdfImportClick = () => {
        fileInputRef.current?.click();
    };

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
                    const pdfFilePart = {
                        inlineData: {
                            data: base64String,
                            mimeType: file.type,
                        },
                    };
                    const extractedData = await extractFinancialsFromPdf(pdfFilePart);
                    setReportData(prev => ({
                        ...prev,
                        ...extractedData,
                    }));
                    setActivePeriodIndex(0);
                } catch (err) {
                    setPdfError(err instanceof Error ? err.message : "An unknown error occurred during PDF processing.");
                } finally {
                    setIsPdfProcessing(false);
                }
            };
            reader.onerror = () => {
                 setPdfError("Failed to read the file.");
                 setIsPdfProcessing(false);
            }
        } catch (err) {
            setPdfError(err instanceof Error ? err.message : "An unknown error occurred.");
            setIsPdfProcessing(false);
        }
        
        if(e.target) e.target.value = '';
    };

    const handleCompetitorChange = (index: number, value: string) => {
        const newCompetitors = [...reportData.competitors];
        newCompetitors[index] = value;
        setReportData(prev => ({ ...prev, competitors: newCompetitors }));
    };

    const addCompetitor = () => {
        setReportData(prev => ({ ...prev, competitors: [...prev.competitors, ''] }));
    };

    const removeCompetitor = (index: number) => {
        setReportData(prev => ({ ...prev, competitors: prev.competitors.filter((_, i) => i !== index) }));
    };

    const activePeriodData = useMemo(() => reportData.periods[activePeriodIndex], [reportData.periods, activePeriodIndex]);
    const CoreTabButton: React.FC<{tabId: string, label: string}> = ({tabId, label}) => (
        <button
            onClick={() => setActiveCoreTab(tabId)}
            className={`button ${activeCoreTab === tabId ? 'button-primary' : 'button-secondary'}`}
            style={{flex: 1}}
        >{label}</button>
    );

    if (!activePeriodData) return <div>Error: No active period found. Please refresh.</div>;
    
    const onIncomeChange = createChanger('incomeStatement');
    const onBalanceChange = createChanger('balanceSheet');
    const onCashFlowChange = createChanger('cashFlow');
    const onEsgChange = createChanger('esg');
    const onBudgetChange = createChanger('budget');
    const onSegmentsChange = (segments: PeriodData['segments']) => updatePeriodData('segments', segments);
    
    const BalanceSheetStatus: React.FC<{balanceSheet: BalanceSheetData, currency: string}> = ({balanceSheet, currency}) => {
        const { status, diff } = validateBalanceSheet(balanceSheet);
        if (status === 'balanced') {
            return <span title="Balanced" style={{display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)'}}><CheckCircleIcon style={{width: '14px', height: '14px'}}/></span>
        }
        return <span title={`Unbalanced by ${diff.toLocaleString(undefined, {style: 'currency', currency})}`} style={{display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-error)'}}><XIcon style={{width: '14px', height: '14px'}}/></span>
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div className="card">
                <div className="stepper">
                    <WizardStep currentStep={currentStep} stepNumber={1} label="Report Setup" />
                    <WizardStep currentStep={currentStep} stepNumber={2} label="Financials" />
                    <WizardStep currentStep={currentStep} stepNumber={3} label="Additional Data" />
                    <WizardStep currentStep={currentStep} stepNumber={4} label="Market & Competitors" />
                    <WizardStep currentStep={currentStep} stepNumber={5} label="Scenario Analysis" />
                </div>

                <div className="main-content">
                    {currentStep === 1 && (
                         <div>
                            <h2>Step 1: Report Setup</h2>
                            <p style={{color: 'var(--color-text-secondary)', marginTop: '-1rem', marginBottom: '2rem'}}>
                                Configure the basic details for your analysis.
                            </p>
                             <div className="grid grid-cols-2">
                                 <div>
                                    <div className="form-group">
                                        <label className="form-label">Company Name</label>
                                        <input type="text" name="companyName" value={reportData.companyName} onChange={handleCompanyChange} className="input" />
                                    </div>
                                    <div className="grid grid-cols-2">
                                        <div className="form-group">
                                            <label className="form-label">Currency</label>
                                            <input type="text" name="currency" value={reportData.currency} onChange={handleCompanyChange} className="input" placeholder="e.g., USD, EUR" />
                                        </div>
                                         <div className="form-group">
                                            <label className="form-label">Shares Outstanding
                                                <InfoTooltip text="The total number of shares held by all shareholders. Used to calculate Earnings Per Share (EPS)." />
                                            </label>
                                            <input type="number" value={activePeriodData.sharesOutstanding} onChange={e => updatePeriodData('sharesOutstanding', e.target.value)} className="input" placeholder="e.g., 1000000" />
                                        </div>
                                         <div className="form-group" style={{gridColumn: 'span 2'}}>
                                            <label className="form-label">Company Logo</label>
                                            <input type="file" onChange={handleLogoChange} accept="image/png, image/jpeg" style={{fontSize: '0.8rem'}}/>
                                             {reportData.companyLogo && <img src={reportData.companyLogo} alt="logo preview" style={{maxWidth: '100px', maxHeight:'40px', marginTop: '10px', objectFit: 'contain'}}/>}
                                        </div>
                                    </div>
                                 </div>
                                 <div>
                                     <div className="form-group">
                                        <label className="form-label">Primary Industries</label>
                                         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                                            {INDUSTRY_OPTIONS.map(industry => (
                                                <button key={industry} onClick={() => handleIndustryToggle(industry)} className={`button ${reportData.industries.includes(industry) ? 'button-primary' : 'button-secondary'}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>{industry}</button>
                                            ))}
                                        </div>
                                    </div>
                                 </div>
                            </div>
                        </div>
                    )}
                    {currentStep === 2 && (
                         <div>
                            <h2>Step 2: Financials</h2>
                            <p style={{color: 'var(--color-text-secondary)', marginTop: '-1rem', marginBottom: '2rem'}}>
                                Add one or more reporting periods and input your core financial data. You can import from a PDF to get started quickly.
                            </p>
                            <div style={{display:'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem'}}>
                                 <div className="form-group" style={{marginBottom: 0}}>
                                    <label className="form-label" style={{marginBottom: '0.5rem'}}>Period Type</label>
                                    <div style={{display:'flex', gap: '10px'}}>
                                        <button onClick={() => handlePeriodTypeChange('Monthly')} className={`button ${reportData.periodType === 'Monthly' ? 'button-primary' : 'button-secondary'}`}>Monthly</button>
                                        <button onClick={() => handlePeriodTypeChange('Yearly')} className={`button ${reportData.periodType === 'Yearly' ? 'button-primary' : 'button-secondary'}`}>Yearly</button>
                                    </div>
                                </div>
                                <div>
                                    <input type="file" ref={fileInputRef} onChange={handlePdfUpload} style={{ display: 'none' }} accept="application/pdf" />
                                     <button onClick={handlePdfImportClick} disabled={isPdfProcessing} className="button button-secondary">
                                        {isPdfProcessing ? <Spinner/> : <UploadCloudIcon/>} <span>Import from PDF</span>
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                                {reportData.periods.map((period, index) => (
                                    <div key={index} style={{ display: 'flex' }}>
                                        <button onClick={() => setActivePeriodIndex(index)} className={`button ${activePeriodIndex === index ? 'button-primary' : 'button-secondary'}`} style={{ borderTopRightRadius: reportData.periods.length > 1 ? 0 : '', borderBottomRightRadius: reportData.periods.length > 1 ? 0 : '', gap: '0.5rem' }}>
                                            {period.periodLabel || `${reportData.periodType} ${index + 1}`}
                                            <BalanceSheetStatus balanceSheet={period.balanceSheet} currency={reportData.currency}/>
                                        </button>
                                        {reportData.periods.length > 1 && (
                                            <button onClick={() => removePeriod(index)} className="button button-secondary" style={{ padding: '0.5rem', borderLeft: 'none', borderRadius: '0 6px 6px 0' }}>
                                                <TrashIcon width="16" height="16" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button onClick={addPeriod} className="button button-tertiary" style={{border: '1px dashed var(--color-border)'}}>+ Add Period</button>
                            </div>
                             <h3 style={{marginBottom: '1rem'}}>Core Financials for {activePeriodData.periodLabel}</h3>
                             <div style={{display: 'flex', gap: '0.5rem', marginBottom: '1.5rem'}}>
                                <CoreTabButton tabId="income" label="Income Statement" />
                                <CoreTabButton tabId="balance" label="Balance Sheet" />
                                <CoreTabButton tabId="cashflow" label="Cash Flow" />
                             </div>
                             {activeCoreTab === 'income' && <IncomeStatementInputs data={activePeriodData.incomeStatement} onChange={onIncomeChange} />}
                             {activeCoreTab === 'balance' && <BalanceSheetInputs data={activePeriodData.balanceSheet} onChange={onBalanceChange} />}
                             {activeCoreTab === 'cashflow' && <CashFlowInputs data={activePeriodData.cashFlow} onChange={onCashFlowChange} />}
                        </div>
                    )}
                    {currentStep === 3 && (
                         <div>
                             <h2>Step 3: Additional Data (Optional)</h2>
                             <p style={{color: 'var(--color-text-secondary)', marginTop: '-1rem', marginBottom: '2rem'}}>
                                Providing this extra data will unlock deeper, more specific analysis in the final report.
                            </p>
                             <h3 style={{marginBottom: '1rem'}}>Data for {activePeriodData.periodLabel}</h3>
                            <SegmentInputs data={activePeriodData.segments} onChange={onSegmentsChange} />
                            <EsgInputs data={activePeriodData.esg} onChange={onEsgChange} />
                            <BudgetInputs data={activePeriodData.budget} onChange={onBudgetChange} />
                         </div>
                    )}
                    {currentStep === 4 && (
                        <div>
                            <h2>Step 4: Market & Competitors (Optional)</h2>
                             <p style={{color: 'var(--color-text-secondary)', marginTop: '-1rem', marginBottom: '2rem'}}>
                                This enables direct competitor benchmarking and valuation analysis in the report.
                            </p>
                            <div className="form-group">
                                <label className="form-label">
                                    Market Valuation ({reportData.currency})
                                    <InfoTooltip text="The total market value of the company's equity. For public companies, this is the share price multiplied by shares outstanding. For private companies, use the latest 409A or transaction valuation." />
                                </label>
                                <input type="number" name="marketValuation" value={reportData.marketValuation} onChange={handleCompanyChange} className="input" placeholder="e.g., 50000000" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Key Competitors</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {reportData.competitors.map((competitor, index) => (
                                        <div key={index} style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input type="text" value={competitor} onChange={(e) => handleCompetitorChange(index, e.target.value)} className="input" placeholder="e.g., Apple Inc." />
                                            <button onClick={() => removeCompetitor(index)} className="button button-tertiary" style={{ padding: '0.5rem' }}><XIcon style={{ width: '16px', height: '16px', color: 'var(--color-error)' }} /></button>
                                        </div>
                                    ))}
                                    <button onClick={addCompetitor} className="button button-tertiary" style={{ alignSelf: 'flex-start' }}>+ Add Competitor</button>
                                </div>
                            </div>
                        </div>
                    )}
                     {currentStep === 5 && (
                         <div>
                             <h2>Step 5: Scenario Analysis (Optional)</h2>
                             <p style={{color: 'var(--color-text-secondary)', marginTop: '-1rem', marginBottom: '2rem'}}>
                                Project future performance based on a few key assumptions. The AI will generate a pro-forma P&L for the next period.
                            </p>
                             <div className="grid grid-cols-3">
                                <div className="form-group">
                                    <label className="form-label">
                                        Next Period Revenue Growth (%)
                                        <InfoTooltip text="The expected percentage increase in total revenue for the next period." />
                                    </label>
                                    <input type="number" value={reportData.scenario.revenueGrowth} onChange={(e) => handleScenarioChange('revenueGrowth', e.target.value)} className="input" placeholder="e.g., 10" />
                                </div>
                                 <div className="form-group">
                                    <label className="form-label">
                                        Next Period COGS (% of Revenue)
                                        <InfoTooltip text="The expected Cost of Goods Sold as a percentage of the projected revenue." />
                                    </label>
                                    <input type="number" value={reportData.scenario.cogsPercentage} onChange={(e) => handleScenarioChange('cogsPercentage', e.target.value)} className="input" placeholder="e.g., 45" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Next Period OpEx Growth (%)
                                        <InfoTooltip text="The expected percentage increase in total Operating Expenses (excluding COGS and D&A)." />
                                    </label>
                                    <input type="number" value={reportData.scenario.opexGrowth} onChange={(e) => handleScenarioChange('opexGrowth', e.target.value)} className="input" placeholder="e.g., 5" />
                                </div>
                             </div>
                         </div>
                    )}
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                        <button onClick={handleLoadDemoData} disabled={isLoading || isPdfProcessing} className="button button-tertiary">Load Demo Data</button>
                    </div>
                    <div style={{display: 'flex', gap: '1rem'}}>
                        {currentStep > 1 && (
                            <button onClick={() => setCurrentStep(s => s - 1)} className="button button-secondary">
                                <ArrowLeftIcon /> Back
                            </button>
                        )}
                        {currentStep < 5 ? (
                             <button onClick={() => setCurrentStep(s => s + 1)} className="button button-primary">Next</button>
                        ) : (
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
        </div>
    );
};

export default FinancialDataInput;