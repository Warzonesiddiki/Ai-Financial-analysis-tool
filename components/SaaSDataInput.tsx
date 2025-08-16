
import React, { useState, useCallback } from 'react';
import { SaaSReportData, SaaSPeriodData, createInitialSaaSPeriod } from '../types';
import { Spinner } from './Spinner';
import { AlertTriangleIcon, TrashIcon } from './icons';
import CollapsibleSection from './CollapsibleSection';
import { demoSaaSReportData } from '../demoData';
import { INDUSTRY_OPTIONS } from '../constants';

interface InputFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    prefix?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, prefix }) => (
    <div className="form-group">
        <label className="form-label">{label}</label>
        <div style={{ position: 'relative' }}>
            {prefix && <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }}>{prefix}</span>}
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="input"
                placeholder="0"
                style={{ paddingLeft: prefix ? '2.5rem' : '0.75rem' }}
            />
        </div>
    </div>
);

interface SaaSDataInputProps {
    reportData: SaaSReportData;
    setReportData: React.Dispatch<React.SetStateAction<SaaSReportData>>;
    onGenerate: () => void;
    isLoading: boolean;
    error: string | null;
    onBack: () => void;
}

const SaaSDataInput: React.FC<SaaSDataInputProps> = ({ reportData, setReportData, onGenerate, isLoading, error, onBack }) => {
    const [activePeriodIndex, setActivePeriodIndex] = useState(0);

    const handleCompanyChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setReportData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, [setReportData]);

    const handlePeriodTypeChange = useCallback((type: 'Monthly' | 'Quarterly') => {
        const newPeriod = createInitialSaaSPeriod();
        const year = new Date().getFullYear();
        newPeriod.periodLabel = type === 'Quarterly' ? `Q1 ${year}` : `Jan ${year}`;
        
        setReportData(prev => ({ ...prev, periodType: type, periods: [newPeriod] }));
        setActivePeriodIndex(0);
    }, [setReportData]);

    const getNextPeriodLabel = useCallback((lastLabel: string, periodType: 'Monthly' | 'Quarterly'): string => {
        if (periodType === 'Quarterly') {
            const parts = lastLabel.split(' ');
            let q = parseInt(parts[0].substring(1));
            let year = parseInt(parts[1]);
            if (q === 4) {
                q = 1;
                year++;
            } else {
                q++;
            }
            return `Q${q} ${year}`;
        } else { // Monthly
            const date = new Date(lastLabel);
            date.setMonth(date.getMonth() + 1);
            return date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();
        }
    }, []);

    const addPeriod = useCallback(() => {
        const newActiveIndex = reportData.periods.length;
        setReportData(prev => {
            const lastPeriod = prev.periods[prev.periods.length - 1];
            const newPeriodLabel = getNextPeriodLabel(lastPeriod.periodLabel, prev.periodType);
            const newPeriod = createInitialSaaSPeriod();
            newPeriod.periodLabel = newPeriodLabel;
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

    const createChanger = useCallback(<S extends 'mrr' | 'customers' | 'cac'>(group: S) => 
        <F extends keyof SaaSPeriodData[S]>(field: F, value: SaaSPeriodData[S][F]) => {
            setReportData(prev => {
                const newPeriods = [...prev.periods];
                const activePeriod = { ...newPeriods[activePeriodIndex] };
                activePeriod[group] = { ...activePeriod[group], [field]: value };
                newPeriods[activePeriodIndex] = activePeriod;
                return { ...prev, periods: newPeriods };
            });
    }, [setReportData, activePeriodIndex]);

    const handleLoadDemoData = useCallback(() => {
        setReportData(demoSaaSReportData);
        setActivePeriodIndex(0);
    }, [setReportData]);

    const activePeriodData = reportData.periods[activePeriodIndex];

    return (
        <div style={{maxWidth: '1000px', margin: '0 auto'}}>
            <header style={{marginBottom: '2rem', textAlign: 'center'}}>
                <h2>SaaS & Subscription - Data Input</h2>
                <p style={{color: 'var(--color-text-secondary)', marginTop: '0.5rem'}}>Provide key SaaS metrics to generate your report, or load demo data.</p>
            </header>
            
            <div className="card" style={{marginBottom: '2rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <button onClick={onBack} className="button button-secondary">Back to Selector</button>
                    <div style={{display: 'flex', gap: '1rem'}}>
                        <button onClick={handleLoadDemoData} className="button button-secondary">Load Demo Data</button>
                        <button onClick={onGenerate} disabled={isLoading} className="button button-primary" style={{minWidth: '220px'}}>
                            {isLoading ? <Spinner /> : <span>Analyze & Generate Report</span>}
                        </button>
                    </div>
                </div>
                 {error && (
                    <div className="card" style={{borderColor: 'var(--color-error)', backgroundColor: '#fef2f2', marginTop: '1rem'}}>
                        <h4 style={{color: 'var(--color-error)'}}><AlertTriangleIcon style={{display:'inline-block', marginRight: '8px'}} /> Error</h4>
                        <p style={{color: '#b91c1c'}}>{error}</p>
                    </div>
                )}
            </div>

            <div className="card" style={{marginBottom: '2rem'}}>
                <h3>Company & Report Setup</h3>
                <div className="grid grid-cols-2" style={{marginTop: '1.5rem'}}>
                    <div className="form-group">
                        <label className="form-label">Company Name</label>
                        <input type="text" name="companyName" value={reportData.companyName} onChange={handleCompanyChange} className="input" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Currency</label>
                        <input type="text" name="currency" value={reportData.currency} onChange={handleCompanyChange} className="input" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Period Type</label>
                        <div style={{display:'flex', gap: '10px'}}>
                            <button onClick={() => handlePeriodTypeChange('Monthly')} className={`button ${reportData.periodType === 'Monthly' ? 'button-primary' : 'button-secondary'}`}>Monthly</button>
                            <button onClick={() => handlePeriodTypeChange('Quarterly')} className={`button ${reportData.periodType === 'Quarterly' ? 'button-primary' : 'button-secondary'}`}>Quarterly</button>
                        </div>
                    </div>
                     <div className="form-group">
                        <label className="form-label">Industry</label>
                        <input type="text" name="industries" value={reportData.industries.join(', ')} onChange={(e) => setReportData(prev => ({ ...prev, industries: e.target.value.split(',').map(s => s.trim())}))} className="input" />
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>Report Periods</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                    {reportData.periods.map((period, index) => (
                        <div key={index} style={{ display: 'flex' }}>
                            <button onClick={() => setActivePeriodIndex(index)} className="button" style={{backgroundColor: activePeriodIndex === index ? 'var(--color-primary)' : 'transparent', color: activePeriodIndex === index ? 'white' : 'var(--color-text)', border: '1px solid var(--color-border)', borderRight: 'none', borderRadius: '6px 0 0 6px'}}>
                                {period.periodLabel || `${reportData.periodType} ${index + 1}`}
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

                {activePeriodData && 
                    <div>
                        <h3 style={{marginBottom: '1rem'}}>SaaS Metrics for {activePeriodData.periodLabel}</h3>
                        <CollapsibleSection title="Monthly Recurring Revenue (MRR)" defaultOpen={true}>
                             <div className="grid grid-cols-2">
                                 <InputField label="New MRR" value={activePeriodData.mrr.new} onChange={v => createChanger('mrr')('new', v)} prefix={reportData.currency} />
                                 <InputField label="Expansion MRR" value={activePeriodData.mrr.expansion} onChange={v => createChanger('mrr')('expansion', v)} prefix={reportData.currency} />
                                 <InputField label="Contraction MRR" value={activePeriodData.mrr.contraction} onChange={v => createChanger('mrr')('contraction', v)} prefix={reportData.currency} />
                                 <InputField label="Churned MRR" value={activePeriodData.mrr.churn} onChange={v => createChanger('mrr')('churn', v)} prefix={reportData.currency} />
                             </div>
                        </CollapsibleSection>
                         <CollapsibleSection title="Customers & Acquisition Cost (CAC)" defaultOpen={true}>
                             <div className="grid grid-cols-2">
                                <InputField label="New Customers Acquired" value={activePeriodData.customers.new} onChange={v => createChanger('customers')('new', v)} />
                                <InputField label="Total Active Customers (End of Period)" value={activePeriodData.customers.total} onChange={v => createChanger('customers')('total', v)} />
                                <InputField label="Total Marketing Spend" value={activePeriodData.cac.marketingSpend} onChange={v => createChanger('cac')('marketingSpend', v)} prefix={reportData.currency} />
                                <InputField label="Total Sales Spend" value={activePeriodData.cac.salesSpend} onChange={v => createChanger('cac')('salesSpend', v)} prefix={reportData.currency} />
                            </div>
                        </CollapsibleSection>
                        <CollapsibleSection title="Global Assumptions (for LTV calculation)" defaultOpen={false}>
                             <p style={{fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem'}}>These values are applied across all periods to calculate unit economics like LTV.</p>
                            <div className="grid grid-cols-2">
                                <div className="form-group">
                                    <label className="form-label">Average Customer Contract Length (Months)</label>
                                    <input type="number" name="averageContractLengthMonths" value={reportData.averageContractLengthMonths} onChange={handleCompanyChange} className="input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Blended Gross Margin (%)</label>
                                    <input type="number" name="grossMarginPercentage" value={reportData.grossMarginPercentage} onChange={handleCompanyChange} className="input" />
                                </div>
                            </div>
                        </CollapsibleSection>
                    </div>
                }
            </div>
        </div>
    );
};

export default SaaSDataInput;
