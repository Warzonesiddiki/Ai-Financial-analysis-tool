

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { ReportData, PeriodData, createInitialPeriod } from '../types';
import { Spinner } from './Spinner';
import { AlertTriangleIcon, TrashIcon, UploadCloudIcon } from './icons';
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


interface FinancialDataInputProps {
    reportData: ReportData;
    setReportData: React.Dispatch<React.SetStateAction<ReportData>>;
    onGenerate: () => void;
    isLoading: boolean;
    error: string | null;
    onBack: () => void;
}

const FinancialDataInput: React.FC<FinancialDataInputProps> = ({ reportData, setReportData, onGenerate, isLoading, error, onBack }) => {
    const [activePeriodIndex, setActivePeriodIndex] = useState(0);
    const [isPdfProcessing, setIsPdfProcessing] = useState(false);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCompanyChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setReportData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
                        }
                    };
                    const extractedData = await extractFinancialsFromPdf(pdfFilePart);

                    setReportData(prev => ({
                        ...prev,
                        companyName: extractedData.companyName || prev.companyName,
                        currency: extractedData.currency || prev.currency,
                        periods: extractedData.periods && extractedData.periods.length > 0 ? extractedData.periods : prev.periods,
                    }));
                    setActivePeriodIndex(0);
                } catch (err) {
                    setPdfError(err instanceof Error ? err.message : 'An unknown error occurred during PDF processing.');
                } finally {
                    setIsPdfProcessing(false);
                    if (e.target) e.target.value = '';
                }
            };
            reader.onerror = () => {
                setPdfError('Failed to read the PDF file.');
                setIsPdfProcessing(false);
            };
        } catch (err) {
            setPdfError(err instanceof Error ? err.message : 'An error occurred preparing the file.');
            setIsPdfProcessing(false);
        }
    };

    const activePeriodData = reportData.periods[activePeriodIndex];

    return (
        <div className="animate-fade-in" style={{maxWidth: '1000px', margin: '0 auto'}}>
             <header style={{marginBottom: '2rem', textAlign: 'center'}}>
                <h2>Comprehensive Financial Analysis - Data Input</h2>
                <p style={{color: 'var(--color-text-secondary)', marginTop: '0.5rem'}}>Provide financial data to generate your report, or load our demo data to get started.</p>
            </header>
            
            <div className="card" style={{marginBottom: '2rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
                    <button onClick={onBack} className="button button-secondary">Back to Selector</button>
                    <div style={{display: 'flex', gap: '1rem'}}>
                        <input type="file" ref={fileInputRef} onChange={handlePdfUpload} accept="application/pdf" style={{ display: 'none' }} />
                        <button onClick={handlePdfImportClick} className="button button-secondary" disabled={isPdfProcessing}>
                            {isPdfProcessing ? <Spinner /> : <UploadCloudIcon />}
                            <span>{isPdfProcessing ? 'Processing...' : 'Import from PDF'}</span>
                        </button>
                        <button onClick={handleLoadDemoData} className="button button-secondary">
                            Load Demo Data
                        </button>
                        <button onClick={onGenerate} disabled={isLoading || isPdfProcessing} className="button button-primary" style={{minWidth: '220px'}}>
                            {isLoading && <Spinner />}
                            <span>{isLoading ? 'Analyzing...' : 'Analyze & Generate Report'}</span>
                        </button>
                    </div>
                </div>
                 {pdfError && (
                    <div className="card" style={{borderColor: 'var(--color-error)', backgroundColor: '#fef2f2', marginTop: '1rem'}}>
                        <h4 style={{color: 'var(--color-error)'}}><AlertTriangleIcon style={{display:'inline-block', marginRight: '8px'}} /> PDF Import Error</h4>
                        <p style={{color: '#b91c1c'}}>{pdfError}</p>
                    </div>
                )}
                 {error && (
                    <div className="card" style={{borderColor: 'var(--color-error)', backgroundColor: '#fef2f2', marginTop: '1rem'}}>
                        <h4 style={{color: 'var(--color-error)'}}><AlertTriangleIcon style={{display:'inline-block', marginRight: '8px'}} /> Generation Error</h4>
                        <p style={{color: '#b91c1c'}}>{error}</p>
                    </div>
                )}
            </div>

            <div className="card" style={{marginBottom: '2rem'}}>
                 <h3>Company & Report Setup</h3>
                <div className="grid grid-cols-2" style={{marginTop: '1.5rem'}}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="companyName">Company Name</label>
                        <input type="text" name="companyName" id="companyName" value={reportData.companyName} onChange={handleCompanyChange} className="input" />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="currency">Currency</label>
                        <input type="text" name="currency" id="currency" value={reportData.currency} onChange={handleCompanyChange} className="input" />
                    </div>
                    <div className="form-group">
                         <label className="form-label">Company Logo</label>
                         <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                            <div style={{width: '64px', height: '64px', border: '1px solid var(--color-border)', borderRadius: '4px', display:'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb'}}>
                                {reportData.companyLogo ? <img src={reportData.companyLogo} alt="Company Logo" style={{height: '100%', width:'100%', objectFit: 'contain', padding: '4px'}} /> : <span style={{fontSize:'12px', color: 'var(--color-text-secondary)'}}>No Logo</span>}
                            </div>
                            <input type="file" onChange={handleLogoChange} accept="image/png, image/jpeg" />
                         </div>
                    </div>
                    <div className="form-group">
                         <label className="form-label">Period Type</label>
                        <div style={{display:'flex', gap: '10px'}}>
                            <button onClick={() => handlePeriodTypeChange('Monthly')} className={`button ${reportData.periodType === 'Monthly' ? 'button-primary' : 'button-secondary'}`}>
                                Monthly
                            </button>
                             <button onClick={() => handlePeriodTypeChange('Yearly')} className={`button ${reportData.periodType === 'Yearly' ? 'button-primary' : 'button-secondary'}`}>
                                Yearly
                            </button>
                        </div>
                    </div>
                     <div className="form-group" style={{gridColumn: 'span 2'}}>
                         <label className="form-label">Primary Industries (Select all that apply)</label>
                         <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                            {INDUSTRY_OPTIONS.map(industry => (
                                <button 
                                    key={industry}
                                    onClick={() => handleIndustryToggle(industry)}
                                    className={`button ${reportData.industries.includes(industry) ? 'button-primary' : 'button-secondary'}`}
                                >
                                    {industry}
                                </button>
                            ))}
                         </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>Report Periods</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                    {reportData.periods.map((period, index) => (
                        <div key={index} style={{ display: 'flex' }}>
                            <button
                                onClick={() => setActivePeriodIndex(index)}
                                className="button"
                                style={{
                                    backgroundColor: activePeriodIndex === index ? 'var(--color-primary)' : 'transparent',
                                    color: activePeriodIndex === index ? 'white' : 'var(--color-text)',
                                    border: '1px solid var(--color-border)',
                                    borderRight: reportData.periods.length > 1 ? 'none' : '1px solid var(--color-border)',
                                    borderRadius: '6px 0 0 6px',
                                }}
                            >
                                {period.periodLabel || `${reportData.periodType} ${index + 1}`}
                            </button>
                            {reportData.periods.length > 1 && (
                                <button
                                    onClick={() => removePeriod(index)}
                                    className="button button-secondary"
                                    style={{ padding: '0.5rem', borderLeft: 'none', borderRadius: '0 6px 6px 0' }}
                                >
                                    <TrashIcon width="16" height="16" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button onClick={addPeriod} className="button button-tertiary" style={{border: '1px dashed var(--color-border)'}}>
                        + Add Period
                    </button>
                </div>


                {activePeriodData && 
                    <div>
                        <h3 style={{marginBottom: '1rem'}}>Financial Data for {activePeriodData.periodLabel}</h3>
                        <CollapsibleSection title="Core Financials" defaultOpen={true}>
                            <IncomeStatementInputs data={activePeriodData.incomeStatement} onChange={createChanger('incomeStatement')} />
                            <BalanceSheetInputs data={activePeriodData.balanceSheet} onChange={createChanger('balanceSheet')} />
                            <CashFlowInputs data={activePeriodData.cashFlow} onChange={createChanger('cashFlow')} />
                        </CollapsibleSection>
                        <CollapsibleSection title="Additional Data for Deeper Analysis">
                            <SegmentInputs data={activePeriodData.segments} onChange={(v) => updatePeriodData('segments', v)} />
                            <EsgInputs data={activePeriodData.esg} onChange={createChanger('esg')} />
                            <BudgetInputs data={activePeriodData.budget} onChange={createChanger('budget')} />
                        </CollapsibleSection>
                    </div>
                }
            </div>
        </div>
    );
};

export default FinancialDataInput;