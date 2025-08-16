
import React, { useState, useCallback, useEffect } from 'react';
import { InventoryReportData, InventoryItemData } from '../types';
import { Spinner } from './Spinner';
import { AlertTriangleIcon, TrashIcon } from './icons';
import CollapsibleSection from './CollapsibleSection';
import { demoInventoryReportData } from '../demoData';

interface InventoryDataInputProps {
    reportData: InventoryReportData;
    setReportData: React.Dispatch<React.SetStateAction<InventoryReportData>>;
    onGenerate: () => void;
    isLoading: boolean;
    error: string | null;
    onBack: () => void;
}

const InventoryDataInput: React.FC<InventoryDataInputProps> = ({ reportData, setReportData, onGenerate, isLoading, error, onBack }) => {
    const activePeriod = reportData.periods[0];

    const handleCompanyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setReportData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, [setReportData]);

    const handleSummaryChange = (field: keyof InventoryReportData['periods'][0]['summary'], value: string) => {
        setReportData(prev => {
            const newPeriods = [...prev.periods];
            newPeriods[0].summary[field] = value;
            return { ...prev, periods: newPeriods };
        });
    };

    const handleItemChange = (id: string, field: keyof Omit<InventoryItemData, 'id'>, value: string) => {
        const newItems = activePeriod.inventoryItems.map(i => (i.id === id ? { ...i, [field]: value } : i));
        setReportData(prev => ({ ...prev, periods: [{...prev.periods[0], inventoryItems: newItems }]}));
    };

    const addItem = () => {
        const newItem: InventoryItemData = { id: Date.now().toString(), sku: '', description: '', quantity: '', unitCost: '', last30DaysSales: '' };
        setReportData(prev => ({ ...prev, periods: [{...prev.periods[0], inventoryItems: [...prev.periods[0].inventoryItems, newItem] }]}));
    };

    const removeItem = (id: string) => {
        const newItems = activePeriod.inventoryItems.filter(i => i.id !== id);
        setReportData(prev => ({ ...prev, periods: [{...prev.periods[0], inventoryItems: newItems }]}));
    };
    
    useEffect(() => {
        const totalValue = activePeriod.inventoryItems.reduce((sum, item) => {
            return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0);
        }, 0);
        handleSummaryChange('totalInventoryValue', totalValue.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePeriod.inventoryItems]);

    const handleLoadDemoData = useCallback(() => {
        setReportData(demoInventoryReportData);
    }, [setReportData]);

    return (
        <div style={{maxWidth: '1200px', margin: '0 auto'}}>
             <header style={{marginBottom: '2rem', textAlign: 'center'}}>
                <h2>Inventory Management - Data Input</h2>
                <p style={{color: 'var(--color-text-secondary)', marginTop: '0.5rem'}}>Enter your SKU list to perform ABC analysis, calculate turnover, and identify obsolete stock.</p>
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
                    <div className="form-group"><label className="form-label">Analysis As-Of Date</label><input type="date" name="periodLabel" value={activePeriod.periodLabel} onChange={(e) => setReportData(p => ({...p, periods: [{...p.periods[0], periodLabel: e.target.value}]}))} className="input" /></div>
                </div>
                 <h3>Summary Data (for ratio calculations)</h3>
                 <div className="grid grid-cols-2">
                    <div className="form-group"><label className="form-label">Cost of Goods Sold (Last 12 Months)</label><input type="number" placeholder="For annual turnover calculation" value={activePeriod.summary.periodCogs} onChange={(e) => handleSummaryChange('periodCogs', e.target.value)} className="input" /></div>
                    <div className="form-group"><label className="form-label">Total Inventory Value</label><input type="number" value={activePeriod.summary.totalInventoryValue} onChange={(e) => handleSummaryChange('totalInventoryValue', e.target.value)} className="input" disabled /></div>
                </div>
            </div>

            <div className="card">
                <h3>Inventory Item List</h3>
                 <div style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr auto', gap: '0.5rem', padding: '0.5rem 0', fontWeight: 500, fontSize: '0.8rem', minWidth: '900px' }}>
                        <span>SKU</span>
                        <span>Description</span>
                        <span>Quantity</span>
                        <span>Unit Cost</span>
                        <span>30-Day Sales</span>
                        <span></span>
                    </div>
                    {activePeriod.inventoryItems.map(item => (
                        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', minWidth: '900px' }}>
                            <input type="text" placeholder="SKU-123" className="input" value={item.sku} onChange={e => handleItemChange(item.id, 'sku', e.target.value)} />
                            <input type="text" placeholder="Item Description" className="input" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} />
                            <input type="number" placeholder="0" className="input" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', e.target.value)} />
                            <input type="number" placeholder="0.00" className="input" value={item.unitCost} onChange={e => handleItemChange(item.id, 'unitCost', e.target.value)} />
                            <input type="number" placeholder="0" className="input" value={item.last30DaysSales} onChange={e => handleItemChange(item.id, 'last30DaysSales', e.target.value)} />
                            <button onClick={() => removeItem(item.id)} className="button button-secondary" style={{ padding: '0.5rem' }}><TrashIcon width="16" height="16" /></button>
                        </div>
                    ))}
                </div>
                <button onClick={addItem} className="button button-tertiary" style={{marginTop: '1rem', border: '1px dashed var(--color-border)'}}>+ Add SKU</button>
            </div>
        </div>
    );
};

export default InventoryDataInput;
