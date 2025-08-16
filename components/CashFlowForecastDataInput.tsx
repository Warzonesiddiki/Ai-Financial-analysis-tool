
import React, { useState, useCallback } from 'react';
import { CashFlowForecastReportData, CashInflowItem, CashOutflowItem, OneTimeCashEvent } from '../types';
import { Spinner } from './Spinner';
import { AlertTriangleIcon, TrashIcon, XIcon } from './icons';
import CollapsibleSection from './CollapsibleSection';
import { demoCashFlowForecastReportData } from '../demoData';

interface CashFlowForecastDataInputProps {
    reportData: CashFlowForecastReportData;
    setReportData: React.Dispatch<React.SetStateAction<CashFlowForecastReportData>>;
    onGenerate: () => void;
    isLoading: boolean;
    error: string | null;
    onBack: () => void;
}

const CashFlowForecastDataInput: React.FC<CashFlowForecastDataInputProps> = ({ reportData, setReportData, onGenerate, isLoading, error, onBack }) => {
    const activePeriod = reportData.periods[0];

    const handleCompanyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setReportData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, [setReportData]);

    const updatePeriodData = <K extends keyof (typeof activePeriod)>(field: K, value: (typeof activePeriod)[K]) => {
        setReportData(prev => ({ ...prev, periods: [{ ...prev.periods[0], [field]: value }] }));
    };

    const handleLoadDemoData = useCallback(() => {
        setReportData(demoCashFlowForecastReportData);
    }, [setReportData]);

    // Handlers for Recurring Inflows
    const handleInflowChange = (id: string, field: keyof Omit<CashInflowItem, 'id'>, value: string) => {
        const newItems = activePeriod.recurringInflows.map(i => i.id === id ? { ...i, [field]: value } : i);
        updatePeriodData('recurringInflows', newItems);
    };
    const addInflow = () => updatePeriodData('recurringInflows', [...activePeriod.recurringInflows, { id: Date.now().toString(), name: '', amount: '', frequency: 'Monthly' }]);
    const removeInflow = (id: string) => updatePeriodData('recurringInflows', activePeriod.recurringInflows.filter(i => i.id !== id));

    // Handlers for Recurring Outflows
    const handleOutflowChange = (id: string, field: keyof Omit<CashOutflowItem, 'id'>, value: string) => {
        const newItems = activePeriod.recurringOutflows.map(i => i.id === id ? { ...i, [field]: value } : i);
        updatePeriodData('recurringOutflows', newItems);
    };
    const addOutflow = () => updatePeriodData('recurringOutflows', [...activePeriod.recurringOutflows, { id: Date.now().toString(), name: '', amount: '', frequency: 'Monthly' }]);
    const removeOutflow = (id: string) => updatePeriodData('recurringOutflows', activePeriod.recurringOutflows.filter(i => i.id !== id));
    
    // Handlers for One-Time Events
    const handleEventChange = (id: string, field: keyof Omit<OneTimeCashEvent, 'id'>, value: string) => {
        const newItems = activePeriod.oneTimeEvents.map(i => i.id === id ? { ...i, [field]: value } : i);
        updatePeriodData('oneTimeEvents', newItems);
    };
    const addEvent = () => updatePeriodData('oneTimeEvents', [...activePeriod.oneTimeEvents, { id: Date.now().toString(), name: '', amount: '', date: '' }]);
    const removeEvent = (id: string) => updatePeriodData('oneTimeEvents', activePeriod.oneTimeEvents.filter(i => i.id !== id));

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h2>Short-Term Cash Flow Forecast - Data Input</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Enter your cash position and expected movements to generate a 13-week forecast.</p>
            </header>
            
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={onBack} className="button button-secondary">Back to Selector</button>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={handleLoadDemoData} className="button button-secondary">Load Demo Data</button>
                        <button onClick={onGenerate} disabled={isLoading} className="button button-primary" style={{ minWidth: '220px' }}>
                            {isLoading ? <Spinner /> : <span>Analyze & Generate Forecast</span>}
                        </button>
                    </div>
                </div>
                {error && (
                    <div className="card" style={{ borderColor: 'var(--color-error)', backgroundColor: '#fef2f2', marginTop: '1rem' }}>
                        <h4 style={{ color: 'var(--color-error)' }}><AlertTriangleIcon style={{ display: 'inline-block', marginRight: '8px' }} /> Error</h4>
                        <p style={{ color: '#b91c1c' }}>{error}</p>
                    </div>
                )}
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3>Forecast Setup</h3>
                <div className="grid grid-cols-3" style={{ marginTop: '1.5rem' }}>
                    <div className="form-group"><label className="form-label">Company Name</label><input type="text" name="companyName" value={reportData.companyName} onChange={handleCompanyChange} className="input" /></div>
                    <div className="form-group"><label className="form-label">Currency</label><input type="text" name="currency" value={reportData.currency} onChange={handleCompanyChange} className="input" /></div>
                    <div className="form-group"><label className="form-label">Starting Cash Balance</label><input type="number" value={activePeriod.startingBalance} onChange={e => updatePeriodData('startingBalance', e.target.value)} className="input" /></div>
                </div>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '2rem', alignItems: 'flex-start' }}>
                <div className="card">
                    <h3 style={{marginBottom: '1rem'}}>Recurring Cash Inflows</h3>
                    {activePeriod.recurringInflows.map(item => (
                        <div key={item.id} className="grid" style={{gridTemplateColumns: '3fr 2fr 2fr auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem'}}>
                            <input type="text" placeholder="e.g., Client Payments" value={item.name} onChange={e => handleInflowChange(item.id, 'name', e.target.value)} className="input" />
                            <input type="number" placeholder="Amount" value={item.amount} onChange={e => handleInflowChange(item.id, 'amount', e.target.value)} className="input" />
                            <select value={item.frequency} onChange={e => handleInflowChange(item.id, 'frequency', e.target.value as any)} className="input">
                                <option value="Weekly">Weekly</option><option value="Bi-Weekly">Bi-Weekly</option><option value="Monthly">Monthly</option>
                            </select>
                            <button onClick={() => removeInflow(item.id)} className="button button-tertiary" style={{padding: '0.25rem'}}><XIcon width="14" height="14"/></button>
                        </div>
                    ))}
                    <button onClick={addInflow} className="button button-tertiary" style={{ marginTop: '0.5rem' }}>+ Add Inflow</button>
                </div>

                <div className="card">
                    <h3 style={{marginBottom: '1rem'}}>Recurring Cash Outflows</h3>
                    {activePeriod.recurringOutflows.map(item => (
                        <div key={item.id} className="grid" style={{gridTemplateColumns: '3fr 2fr 2fr auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem'}}>
                            <input type="text" placeholder="e.g., Payroll" value={item.name} onChange={e => handleOutflowChange(item.id, 'name', e.target.value)} className="input" />
                            <input type="number" placeholder="Amount" value={item.amount} onChange={e => handleOutflowChange(item.id, 'amount', e.target.value)} className="input" />
                            <select value={item.frequency} onChange={e => handleOutflowChange(item.id, 'frequency', e.target.value as any)} className="input">
                                <option value="Weekly">Weekly</option><option value="Bi-Weekly">Bi-Weekly</option><option value="Monthly">Monthly</option>
                            </select>
                             <button onClick={() => removeOutflow(item.id)} className="button button-tertiary" style={{padding: '0.25rem'}}><XIcon width="14" height="14"/></button>
                        </div>
                    ))}
                    <button onClick={addOutflow} className="button button-tertiary" style={{ marginTop: '0.5rem' }}>+ Add Outflow</button>
                </div>
            </div>
            
            <div className="card" style={{marginTop: '2rem'}}>
                <h3 style={{marginBottom: '1rem'}}>Scheduled One-Time Cash Events</h3>
                 {activePeriod.oneTimeEvents.map(item => (
                    <div key={item.id} className="grid" style={{gridTemplateColumns: '3fr 2fr 2fr auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem'}}>
                        <input type="text" placeholder="e.g., Asset Purchase" value={item.name} onChange={e => handleEventChange(item.id, 'name', e.target.value)} className="input" />
                        <input type="number" placeholder="Amount (use - for outflow)" value={item.amount} onChange={e => handleEventChange(item.id, 'amount', e.target.value)} className="input" />
                        <input type="date" value={item.date} onChange={e => handleEventChange(item.id, 'date', e.target.value)} className="input" />
                        <button onClick={() => removeEvent(item.id)} className="button button-tertiary" style={{padding: '0.25rem'}}><XIcon width="14" height="14"/></button>
                    </div>
                ))}
                <button onClick={addEvent} className="button button-tertiary" style={{ marginTop: '0.5rem' }}>+ Add Event</button>
            </div>
        </div>
    );
};

export default CashFlowForecastDataInput;
