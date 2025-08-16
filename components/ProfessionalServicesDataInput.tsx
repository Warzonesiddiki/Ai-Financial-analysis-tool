
import React, { useState, useCallback } from 'react';
import { ProfessionalServicesReportData, ProfessionalServicesPeriodData, createInitialProfessionalServicesPeriod, ServiceLineData, ClientData } from '../types';
import { Spinner } from './Spinner';
import { AlertTriangleIcon, TrashIcon } from './icons';
import CollapsibleSection from './CollapsibleSection';
import { demoProfessionalServicesReportData } from '../demoData';
import { INDUSTRY_OPTIONS } from '../constants';

interface ProfessionalServicesDataInputProps {
    reportData: ProfessionalServicesReportData;
    setReportData: React.Dispatch<React.SetStateAction<ProfessionalServicesReportData>>;
    onGenerate: () => void;
    isLoading: boolean;
    error: string | null;
    onBack: () => void;
}

const ProfessionalServicesDataInput: React.FC<ProfessionalServicesDataInputProps> = ({ reportData, setReportData, onGenerate, isLoading, error, onBack }) => {
    const [activePeriodIndex, setActivePeriodIndex] = useState(0);

    const handleCompanyChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setReportData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, [setReportData]);
    
    const handleLoadDemoData = useCallback(() => {
        setReportData(demoProfessionalServicesReportData);
        setActivePeriodIndex(0);
    }, [setReportData]);

    const addPeriod = useCallback(() => {
        const newActiveIndex = reportData.periods.length;
        setReportData(prev => {
            const lastPeriod = prev.periods[prev.periods.length - 1];
            const newPeriod = createInitialProfessionalServicesPeriod();
            newPeriod.periodLabel = (parseInt(lastPeriod.periodLabel, 10) + 1).toString();
            return { ...prev, periods: [...prev.periods, newPeriod] };
        });
        setActivePeriodIndex(newActiveIndex);
    }, [reportData.periods, setReportData]);
    
    const removePeriod = useCallback((indexToRemove: number) => {
        if (reportData.periods.length <= 1) return;
        const newActiveIndex = activePeriodIndex >= indexToRemove ? Math.max(0, activePeriodIndex - 1) : activePeriodIndex;
        setReportData(prev => ({ ...prev, periods: prev.periods.filter((_, index) => index !== indexToRemove) }));
        setActivePeriodIndex(newActiveIndex);
    }, [reportData.periods.length, activePeriodIndex, setReportData]);

    const updatePeriodData = useCallback(<K extends keyof ProfessionalServicesPeriodData>(field: K, value: ProfessionalServicesPeriodData[K]) => {
        setReportData(prev => ({
            ...prev,
            periods: prev.periods.map((period, index) => 
                index === activePeriodIndex ? { ...period, [field]: value } : period
            )
        }));
    }, [setReportData, activePeriodIndex]);

    const createChanger = useCallback(<S extends 'financials' | 'team'>(group: S) => 
        <F extends keyof ProfessionalServicesPeriodData[S]>(field: F, value: ProfessionalServicesPeriodData[S][F]) => {
            const activePeriodData = reportData.periods[activePeriodIndex];
            if (!activePeriodData) return;
            const currentGroupData = activePeriodData[group];
            const updatedGroupData = { ...currentGroupData, [field]: value };
            updatePeriodData(group, updatedGroupData);
    }, [reportData.periods, activePeriodIndex, updatePeriodData]);

    const handleServiceLineChange = (id: string, field: keyof Omit<ServiceLineData, 'id'>, value: string) => {
        const newServiceLines = reportData.periods[activePeriodIndex].serviceLines.map(sl => sl.id === id ? { ...sl, [field]: value } : sl);
        updatePeriodData('serviceLines', newServiceLines);
    };

    const addServiceLine = () => {
        const newServiceLine: ServiceLineData = { id: Date.now().toString(), name: '', revenue: '', directCost: '' };
        updatePeriodData('serviceLines', [...reportData.periods[activePeriodIndex].serviceLines, newServiceLine]);
    };

    const removeServiceLine = (id: string) => {
        updatePeriodData('serviceLines', reportData.periods[activePeriodIndex].serviceLines.filter(sl => sl.id !== id));
    };
    
    const handleClientChange = (id: string, field: keyof Omit<ClientData, 'id'>, value: string) => {
        const newClients = reportData.periods[activePeriodIndex].clients.map(c => c.id === id ? { ...c, [field]: value } : c);
        updatePeriodData('clients', newClients);
    };

    const addClient = () => {
        const newClient: ClientData = { id: Date.now().toString(), name: '', revenue: '' };
        updatePeriodData('clients', [...reportData.periods[activePeriodIndex].clients, newClient]);
    };

    const removeClient = (id: string) => {
        updatePeriodData('clients', reportData.periods[activePeriodIndex].clients.filter(c => c.id !== id));
    };

    const activePeriodData = reportData.periods[activePeriodIndex];

    return (
        <div style={{maxWidth: '1000px', margin: '0 auto'}}>
             <header style={{marginBottom: '2rem', textAlign: 'center'}}>
                <h2>Professional Services Firm - Data Input</h2>
                <p style={{color: 'var(--color-text-secondary)', marginTop: '0.5rem'}}>Provide firm performance data, or load our demo data for a UAE-based advisory firm.</p>
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
                 <h3>Firm & Report Setup</h3>
                <div className="grid grid-cols-2" style={{marginTop: '1.5rem'}}>
                    <div className="form-group">
                        <label className="form-label">Firm Name</label>
                        <input type="text" name="companyName" value={reportData.companyName} onChange={handleCompanyChange} className="input" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Currency</label>
                        <input type="text" name="currency" value={reportData.currency} onChange={handleCompanyChange} className="input" />
                    </div>
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
                        <h3 style={{marginBottom: '1rem'}}>Performance Data for {activePeriodData.periodLabel}</h3>
                        <CollapsibleSection title="Firm-Wide Financials" defaultOpen={true}>
                             <div className="grid grid-cols-3">
                                 <div className="form-group"><label className="form-label">Total Service Revenue</label><input type="number" className="input" value={activePeriodData.financials.serviceRevenue} onChange={e => createChanger('financials')('serviceRevenue', e.target.value)} /></div>
                                 <div className="form-group"><label className="form-label">Total Staff Costs</label><input type="number" className="input" value={activePeriodData.financials.staffCosts} onChange={e => createChanger('financials')('staffCosts', e.target.value)} /></div>
                                 <div className="form-group"><label className="form-label">Other Operating Expenses</label><input type="number" className="input" value={activePeriodData.financials.otherOpex} onChange={e => createChanger('financials')('otherOpex', e.target.value)} /></div>
                             </div>
                        </CollapsibleSection>
                         <CollapsibleSection title="Team & Utilization" defaultOpen={true}>
                             <div className="grid grid-cols-2">
                                <div className="form-group"><label className="form-label">Number of Fee-Earning Staff</label><input type="number" className="input" value={activePeriodData.team.feeEarningStaff} onChange={e => createChanger('team')('feeEarningStaff', e.target.value)} /></div>
                                <div className="form-group"><label className="form-label">Total Billable Hours Recorded</label><input type="number" className="input" value={activePeriodData.team.totalBillableHours} onChange={e => createChanger('team')('totalBillableHours', e.target.value)} /></div>
                            </div>
                        </CollapsibleSection>
                        <CollapsibleSection title="Service Line Performance" defaultOpen={false}>
                             <div className="grid" style={{ gridTemplateColumns: '3fr 2fr 2fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                 <label className="form-label" style={{marginBottom: 0}}>Service Line Name</label>
                                 <label className="form-label" style={{marginBottom: 0}}>Revenue</label>
                                 <label className="form-label" style={{marginBottom: 0}}>Direct Costs</label>
                                 <span></span>
                            </div>
                            {activePeriodData.serviceLines.map(sl => (
                                <div key={sl.id} className="grid" style={{ gridTemplateColumns: '3fr 2fr 2fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                    <input type="text" placeholder="e.g., Audit" value={sl.name} onChange={e => handleServiceLineChange(sl.id, 'name', e.target.value)} className="input"/>
                                    <input type="number" value={sl.revenue} onChange={e => handleServiceLineChange(sl.id, 'revenue', e.target.value)} className="input"/>
                                    <input type="number" value={sl.directCost} onChange={e => handleServiceLineChange(sl.id, 'directCost', e.target.value)} className="input"/>
                                    <button onClick={() => removeServiceLine(sl.id)} className="button button-tertiary" style={{padding: '0.5rem'}}><TrashIcon width="16" height="16" /></button>
                                </div>
                            ))}
                            <button onClick={addServiceLine} className="button button-tertiary" style={{marginTop: '0.5rem'}}>+ Add Service Line</button>
                        </CollapsibleSection>
                        <CollapsibleSection title="Client Portfolio" defaultOpen={false}>
                             <div className="grid" style={{ gridTemplateColumns: '4fr 2fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                 <label className="form-label" style={{marginBottom: 0}}>Client Name</label>
                                 <label className="form-label" style={{marginBottom: 0}}>Revenue</label>
                                 <span></span>
                            </div>
                            {activePeriodData.clients.map(c => (
                                <div key={c.id} className="grid" style={{ gridTemplateColumns: '4fr 2fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                    <input type="text" placeholder="e.g., Major Local Bank" value={c.name} onChange={e => handleClientChange(c.id, 'name', e.target.value)} className="input"/>
                                    <input type="number" value={c.revenue} onChange={e => handleClientChange(c.id, 'revenue', e.target.value)} className="input"/>
                                    <button onClick={() => removeClient(c.id)} className="button button-tertiary" style={{padding: '0.5rem'}}><TrashIcon width="16" height="16" /></button>
                                </div>
                            ))}
                            <button onClick={addClient} className="button button-tertiary" style={{marginTop: '0.5rem'}}>+ Add Client</button>
                        </CollapsibleSection>
                    </div>
                }
            </div>
        </div>
    );
};

export default ProfessionalServicesDataInput;
