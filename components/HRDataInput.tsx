
import React, { useState, useCallback } from 'react';
import { HrReportData, HrPeriodData, HeadcountData, createInitialHrPeriod } from '../types';
import { Spinner } from './Spinner';
import { AlertTriangleIcon, TrashIcon } from './icons';
import CollapsibleSection from './CollapsibleSection';
import { demoHrReportData } from '../demoData';

interface HRDataInputProps {
    reportData: HrReportData;
    setReportData: React.Dispatch<React.SetStateAction<HrReportData>>;
    onGenerate: () => void;
    isLoading: boolean;
    error: string | null;
    onBack: () => void;
}

const HRDataInput: React.FC<HRDataInputProps> = ({ reportData, setReportData, onGenerate, isLoading, error, onBack }) => {
    const [activePeriodIndex, setActivePeriodIndex] = useState(0);

    const handleCompanyChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setReportData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, [setReportData]);

    const handleLoadDemoData = useCallback(() => {
        setReportData(demoHrReportData);
        setActivePeriodIndex(0);
    }, [setReportData]);

    const getNextPeriodLabel = (lastLabel: string, periodType: 'Monthly' | 'Quarterly'): string => {
        if (periodType === 'Quarterly') {
            const parts = lastLabel.split(' ');
            let q = parseInt(parts[0].substring(1));
            let year = parseInt(parts[1]);
            if (q === 4) { q = 1; year++; } else { q++; }
            return `Q${q} ${year}`;
        } else {
            const date = new Date(lastLabel);
            date.setMonth(date.getMonth() + 1);
            return date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();
        }
    };

    const addPeriod = useCallback(() => {
        const newActiveIndex = reportData.periods.length;
        setReportData(prev => {
            const lastPeriod = prev.periods[prev.periods.length - 1];
            const newPeriod = createInitialHrPeriod();
            newPeriod.periodLabel = getNextPeriodLabel(lastPeriod.periodLabel, prev.periodType);
            return { ...prev, periods: [...prev.periods, newPeriod] };
        });
        setActivePeriodIndex(newActiveIndex);
    }, [reportData.periods, setReportData, getNextPeriodLabel]);
    
    const removePeriod = useCallback((indexToRemove: number) => {
        if (reportData.periods.length <= 1) return;
        const newActiveIndex = activePeriodIndex >= indexToRemove ? Math.max(0, activePeriodIndex - 1) : activePeriodIndex;
        setReportData(prev => ({ ...prev, periods: prev.periods.filter((_, index) => index !== indexToRemove) }));
        setActivePeriodIndex(newActiveIndex);
    }, [reportData.periods.length, activePeriodIndex, setReportData]);

    const updatePeriodData = <K extends keyof HrPeriodData>(field: K, value: HrPeriodData[K]) => {
        setReportData(prev => ({
            ...prev,
            periods: prev.periods.map((period, index) =>
                index === activePeriodIndex ? { ...period, [field]: value } : period
            )
        }));
    };

    const handleHeadcountDetailChange = (id: string, field: keyof Omit<HeadcountData, 'id'>, value: string) => {
        const activePeriod = reportData.periods[activePeriodIndex];
        const newByDepartment = activePeriod.headcount.byDepartment.map(d => (d.id === id ? { ...d, [field]: value } : d));
        const newTotal = newByDepartment.reduce((sum, d) => sum + (parseInt(d.count, 10) || 0), 0).toString();
        const newHeadcount = { ...activePeriod.headcount, byDepartment: newByDepartment, total: newTotal };
        updatePeriodData('headcount', newHeadcount);
    };

    const addDepartment = () => {
        const newDept: HeadcountData = { id: Date.now().toString(), department: '', count: '' };
        const activePeriod = reportData.periods[activePeriodIndex];
        const newHeadcount = { ...activePeriod.headcount, byDepartment: [...activePeriod.headcount.byDepartment, newDept] };
        updatePeriodData('headcount', newHeadcount);
    };
    
    const removeDepartment = (id: string) => {
        const activePeriod = reportData.periods[activePeriodIndex];
        const newByDepartment = activePeriod.headcount.byDepartment.filter(d => d.id !== id);
        const newTotal = newByDepartment.reduce((sum, d) => sum + (parseInt(d.count, 10) || 0), 0).toString();
        const newHeadcount = { ...activePeriod.headcount, byDepartment: newByDepartment, total: newTotal };
        updatePeriodData('headcount', newHeadcount);
    };

    const createChanger = <S extends 'headcount' | 'payroll' | 'engagement'>(group: S) =>
        <F extends keyof HrPeriodData[S]>(field: F, value: any) => {
            const activePeriod = reportData.periods[activePeriodIndex];
            const newGroupData = { ...activePeriod[group], [field]: value };
            updatePeriodData(group, newGroupData);
        };
        
    const activePeriodData = reportData.periods[activePeriodIndex];

    return (
        <div style={{maxWidth: '1000px', margin: '0 auto'}}>
             <header style={{marginBottom: '2rem', textAlign: 'center'}}>
                <h2>HR & Payroll Analysis - Data Input</h2>
                <p style={{color: 'var(--color-text-secondary)', marginTop: '0.5rem'}}>Enter workforce data to analyze headcount, turnover, and productivity.</p>
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
                    <div className="form-group"><label className="form-label">Company Name</label><input type="text" name="companyName" value={reportData.companyName} onChange={handleCompanyChange} className="input" /></div>
                    <div className="form-group"><label className="form-label">Currency</label><input type="text" name="currency" value={reportData.currency} onChange={handleCompanyChange} className="input" /></div>
                </div>
            </div>

            <div className="card">
                <h3>Report Periods</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                    {reportData.periods.map((period, index) => (
                        <div key={index} style={{ display: 'flex' }}>
                            <button onClick={() => setActivePeriodIndex(index)} className="button" style={{backgroundColor: activePeriodIndex === index ? 'var(--color-primary)' : 'transparent', color: activePeriodIndex === index ? 'white' : 'var(--color-text)', border: '1px solid var(--color-border)', borderRight: 'none', borderRadius: '6px 0 0 6px'}}>
                                {period.periodLabel}
                            </button>
                            {reportData.periods.length > 1 && (
                                <button onClick={() => removePeriod(index)} className="button button-secondary" style={{ padding: '0.5rem', borderLeft: 'none', borderRadius: '0 6px 6px 0' }}><TrashIcon width="16" height="16" /></button>
                            )}
                        </div>
                    ))}
                    <button onClick={addPeriod} className="button button-tertiary" style={{border: '1px dashed var(--color-border)'}}>+ Add Period</button>
                </div>

                {activePeriodData && 
                    <div>
                        <h3 style={{marginBottom: '1rem'}}>HR Data for {activePeriodData.periodLabel}</h3>
                        <CollapsibleSection title="Workforce & Payroll" defaultOpen>
                            <div className="grid grid-cols-3">
                                <div className="form-group"><label className="form-label">Total Revenue</label><input type="number" placeholder="For Revenue/Employee" value={activePeriodData.totalRevenue} onChange={e => updatePeriodData('totalRevenue', e.target.value)} className="input"/></div>
                                <div className="form-group"><label className="form-label">Total Payroll Cost</label><input type="number" value={activePeriodData.payroll.totalCost} onChange={e => createChanger('payroll')('totalCost', e.target.value)} className="input"/></div>
                                <div className="form-group"><label className="form-label">Employee NPS (eNPS)</label><input type="number" value={activePeriodData.engagement.eNPS} onChange={e => createChanger('engagement')('eNPS', e.target.value)} className="input" placeholder="e.g., 50"/></div>
                            </div>
                        </CollapsibleSection>
                        <CollapsibleSection title="Headcount & Movement" defaultOpen>
                            <div className="grid grid-cols-3">
                                <div className="form-group"><label className="form-label">New Hires</label><input type="number" value={activePeriodData.headcount.newHires} onChange={e => createChanger('headcount')('newHires', e.target.value)} className="input"/></div>
                                <div className="form-group"><label className="form-label">Terminations</label><input type="number" value={activePeriodData.headcount.terminations} onChange={e => createChanger('headcount')('terminations', e.target.value)} className="input"/></div>
                                <div className="form-group"><label className="form-label">Total Headcount (EOP)</label><input type="number" value={activePeriodData.headcount.total} onChange={e => createChanger('headcount')('total', e.target.value)} className="input" disabled/></div>
                            </div>
                            <div style={{backgroundColor: 'var(--color-background)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--color-border)', marginTop: '1rem'}}>
                                <h4 style={{marginTop: 0, color: 'var(--color-text-secondary)'}}>Headcount by Department</h4>
                                {activePeriodData.headcount.byDepartment.map(d => (
                                    <div key={d.id} className="grid" style={{gridTemplateColumns: '3fr 1fr auto', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem'}}>
                                        <input type="text" placeholder="Department Name" value={d.department} onChange={e => handleHeadcountDetailChange(d.id, 'department', e.target.value)} className="input" />
                                        <input type="number" placeholder="Count" value={d.count} onChange={e => handleHeadcountDetailChange(d.id, 'count', e.target.value)} className="input" />
                                        <button onClick={() => removeDepartment(d.id)} className="button button-tertiary" style={{padding: '0.5rem'}}><TrashIcon width="16" height="16" /></button>
                                    </div>
                                ))}
                                <button onClick={addDepartment} className="button button-tertiary" style={{marginTop: '0.5rem'}}>+ Add Department</button>
                            </div>
                        </CollapsibleSection>
                    </div>
                }
            </div>
        </div>
    );
};

export default HRDataInput;
