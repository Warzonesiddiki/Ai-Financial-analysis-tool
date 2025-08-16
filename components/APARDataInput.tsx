
import React, { useState, useCallback } from 'react';
import { APARReportData, InvoiceData, BillData } from '../types';
import { Spinner } from './Spinner';
import { AlertTriangleIcon, TrashIcon } from './icons';
import CollapsibleSection from './CollapsibleSection';
import { demoAPARReportData } from '../demoData';

interface APARDataInputProps {
    reportData: APARReportData;
    setReportData: React.Dispatch<React.SetStateAction<APARReportData>>;
    onGenerate: () => void;
    isLoading: boolean;
    error: string | null;
    onBack: () => void;
}

const APARDataInput: React.FC<APARDataInputProps> = ({ reportData, setReportData, onGenerate, isLoading, error, onBack }) => {
    const activePeriod = reportData.periods[0]; // AP/AR analysis is always single-period

    const handleCompanyChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setReportData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, [setReportData]);

    const handleSummaryChange = (field: keyof APARReportData['periods'][0]['summary'], value: string) => {
        setReportData(prev => {
            const newPeriods = [...prev.periods];
            newPeriods[0].summary[field] = value;
            return { ...prev, periods: newPeriods };
        });
    };
    
    const handleInvoiceChange = (id: string, field: keyof Omit<InvoiceData, 'id'>, value: string) => {
        const newInvoices = activePeriod.invoices.map(i => (i.id === id ? { ...i, [field]: value } : i));
        setReportData(prev => ({ ...prev, periods: [{...prev.periods[0], invoices: newInvoices }]}));
    };

    const addInvoice = () => {
        const newInvoice: InvoiceData = { id: Date.now().toString(), customerName: '', invoiceNumber: '', invoiceDate: '', dueDate: '', amount: '' };
        setReportData(prev => ({ ...prev, periods: [{...prev.periods[0], invoices: [...prev.periods[0].invoices, newInvoice] }]}));
    };

    const removeInvoice = (id: string) => {
        const newInvoices = activePeriod.invoices.filter(i => i.id !== id);
        setReportData(prev => ({ ...prev, periods: [{...prev.periods[0], invoices: newInvoices }]}));
    };

    const handleBillChange = (id: string, field: keyof Omit<BillData, 'id'>, value: string) => {
        const newBills = activePeriod.bills.map(b => (b.id === id ? { ...b, [field]: value } : b));
        setReportData(prev => ({ ...prev, periods: [{...prev.periods[0], bills: newBills }]}));
    };

    const addBill = () => {
        const newBill: BillData = { id: Date.now().toString(), vendorName: '', billNumber: '', billDate: '', dueDate: '', amount: '' };
        setReportData(prev => ({ ...prev, periods: [{...prev.periods[0], bills: [...prev.periods[0].bills, newBill] }]}));
    };

    const removeBill = (id: string) => {
        const newBills = activePeriod.bills.filter(b => b.id !== id);
        setReportData(prev => ({ ...prev, periods: [{...prev.periods[0], bills: newBills }]}));
    };

    const handleLoadDemoData = useCallback(() => {
        setReportData(demoAPARReportData);
    }, [setReportData]);

    return (
        <div style={{maxWidth: '1200px', margin: '0 auto'}}>
             <header style={{marginBottom: '2rem', textAlign: 'center'}}>
                <h2>AP/AR & Working Capital - Data Input</h2>
                <p style={{color: 'var(--color-text-secondary)', marginTop: '0.5rem'}}>Enter open invoices and bills to analyze your working capital cycle.</p>
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
                        <label className="form-label">Analysis As-Of Date</label>
                        <input type="date" name="periodLabel" value={activePeriod.periodLabel} onChange={(e) => setReportData(p => ({...p, periods: [{...p.periods[0], periodLabel: e.target.value}]}))} className="input" />
                    </div>
                </div>
                 <h3>Summary Data (for ratio calculations)</h3>
                 <p style={{fontSize: '0.8rem', color: 'var(--color-text-secondary)'}}>Provide total revenue and COGS for the 30-day period leading up to the "as of" date to calculate DSO and DPO.</p>
                 <div className="grid grid-cols-2">
                    <div className="form-group">
                        <label className="form-label">30-Day Total Revenue</label>
                        <input type="number" value={activePeriod.summary.periodRevenue} onChange={(e) => handleSummaryChange('periodRevenue', e.target.value)} className="input" />
                    </div>
                     <div className="form-group">
                        <label className="form-label">30-Day Total COGS</label>
                        <input type="number" value={activePeriod.summary.periodCogs} onChange={(e) => handleSummaryChange('periodCogs', e.target.value)} className="input" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2" style={{gap: '2rem', alignItems: 'flex-start'}}>
                <div className="card">
                    <h3>Accounts Receivable (Open Invoices)</h3>
                     {activePeriod.invoices.map(invoice => (
                        <CollapsibleSection key={invoice.id} title={`${invoice.customerName || 'New Invoice'} - ${reportData.currency} ${parseFloat(invoice.amount || '0').toLocaleString()}`}>
                            <div className="grid grid-cols-2">
                                <div className="form-group"><label className="form-label">Customer Name</label><input type="text" value={invoice.customerName} onChange={e => handleInvoiceChange(invoice.id, 'customerName', e.target.value)} className="input" /></div>
                                <div className="form-group"><label className="form-label">Invoice #</label><input type="text" value={invoice.invoiceNumber} onChange={e => handleInvoiceChange(invoice.id, 'invoiceNumber', e.target.value)} className="input" /></div>
                                <div className="form-group"><label className="form-label">Invoice Date</label><input type="date" value={invoice.invoiceDate} onChange={e => handleInvoiceChange(invoice.id, 'invoiceDate', e.target.value)} className="input" /></div>
                                <div className="form-group"><label className="form-label">Due Date</label><input type="date" value={invoice.dueDate} onChange={e => handleInvoiceChange(invoice.id, 'dueDate', e.target.value)} className="input" /></div>
                                <div className="form-group" style={{gridColumn: 'span 2'}}><label className="form-label">Amount</label><input type="number" value={invoice.amount} onChange={e => handleInvoiceChange(invoice.id, 'amount', e.target.value)} className="input" /></div>
                            </div>
                            <button onClick={() => removeInvoice(invoice.id)} className="button button-secondary"><TrashIcon /> Remove</button>
                        </CollapsibleSection>
                     ))}
                     <button onClick={addInvoice} className="button button-tertiary" style={{marginTop: '1rem', border: '1px dashed var(--color-border)'}}>+ Add Invoice</button>
                </div>

                <div className="card">
                     <h3>Accounts Payable (Open Bills)</h3>
                     {activePeriod.bills.map(bill => (
                        <CollapsibleSection key={bill.id} title={`${bill.vendorName || 'New Bill'} - ${reportData.currency} ${parseFloat(bill.amount || '0').toLocaleString()}`}>
                            <div className="grid grid-cols-2">
                                <div className="form-group"><label className="form-label">Vendor Name</label><input type="text" value={bill.vendorName} onChange={e => handleBillChange(bill.id, 'vendorName', e.target.value)} className="input" /></div>
                                <div className="form-group"><label className="form-label">Bill #</label><input type="text" value={bill.billNumber} onChange={e => handleBillChange(bill.id, 'billNumber', e.target.value)} className="input" /></div>
                                <div className="form-group"><label className="form-label">Bill Date</label><input type="date" value={bill.billDate} onChange={e => handleBillChange(bill.id, 'billDate', e.target.value)} className="input" /></div>
                                <div className="form-group"><label className="form-label">Due Date</label><input type="date" value={bill.dueDate} onChange={e => handleBillChange(bill.id, 'dueDate', e.target.value)} className="input" /></div>
                                <div className="form-group" style={{gridColumn: 'span 2'}}><label className="form-label">Amount</label><input type="number" value={bill.amount} onChange={e => handleBillChange(bill.id, 'amount', e.target.value)} className="input" /></div>
                            </div>
                            <button onClick={() => removeBill(bill.id)} className="button button-secondary"><TrashIcon /> Remove</button>
                        </CollapsibleSection>
                     ))}
                     <button onClick={addBill} className="button button-tertiary" style={{marginTop: '1rem', border: '1px dashed var(--color-border)'}}>+ Add Bill</button>
                </div>
            </div>
        </div>
    );
};

export default APARDataInput;
