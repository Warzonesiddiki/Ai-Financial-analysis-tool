import React, { useState, useMemo } from 'react';
import { Bill, Vendor, PaymentRun } from '../../../types';
import { CreditCardIcon } from '../../icons';
import { Spinner } from '../../Spinner';

interface APPaymentsHubProps {
    bills: Bill[];
    vendors: Vendor[];
    paymentRuns: PaymentRun[];
    onAddPaymentRun: (billIds: string[], paymentDate: string) => void;
    onProcessPaymentRun: (paymentRunId: string) => void;
}

export const APPaymentsHub: React.FC<APPaymentsHubProps> = ({ bills, vendors, paymentRuns, onAddPaymentRun, onProcessPaymentRun }) => {
    
    const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    const billsAwaitingPayment = useMemo(() => {
        return bills.filter(b => b.status === 'Awaiting Payment' || b.status === 'Overdue');
    }, [bills]);

    const handleSelectBill = (billId: string) => {
        setSelectedBillIds(prev => 
            prev.includes(billId) ? prev.filter(id => id !== billId) : [...prev, billId]
        );
    };

    const handleCreatePaymentRun = () => {
        if (selectedBillIds.length > 0) {
            onAddPaymentRun(selectedBillIds, paymentDate);
            setSelectedBillIds([]);
        }
    };
    
    const selectedBillsTotal = useMemo(() => {
        return bills
            .filter(b => selectedBillIds.includes(b.id))
            .reduce((sum, b) => sum + b.baseCurrencyAmount, 0);
    }, [bills, selectedBillIds]);
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <div className="card">
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <CreditCardIcon style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
                <h2 style={{ margin: 0, border: 'none' }}>Bill Payments Hub</h2>
            </div>
            
            <div className="ap-payments-layout">
                <div>
                    <h4>Bills Awaiting Payment</h4>
                     <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{width: '20px'}}></th>
                                    <th>Due Date</th>
                                    <th>Vendor</th>
                                    <th style={{textAlign: 'right'}}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {billsAwaitingPayment.length === 0 ? (
                                    <tr><td colSpan={4} style={{textAlign: 'center', padding: '2rem'}}>No bills are currently awaiting payment.</td></tr>
                                ) : billsAwaitingPayment.map(bill => {
                                    const vendor = vendors.find(v => v.id === bill.vendorId);
                                    const total = bill.lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
                                    return (
                                        <tr key={bill.id}>
                                            <td><input type="checkbox" checked={selectedBillIds.includes(bill.id)} onChange={() => handleSelectBill(bill.id)} /></td>
                                            <td>{bill.dueDate}</td>
                                            <td>{vendor?.name}</td>
                                            <td style={{textAlign: 'right', fontFamily: 'monospace'}}>{formatCurrency(total)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card" style={{position: 'sticky', top: '1.5rem'}}>
                    <h4 style={{marginTop: 0}}>Create Payment Run</h4>
                     <div className="form-group">
                        <label className="form-label">Payment Date</label>
                        <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="input"/>
                    </div>
                    <div style={{borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1rem'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                            <span style={{fontWeight: 500}}>Bills Selected:</span>
                            <span style={{fontWeight: 500}}>{selectedBillIds.length}</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <span style={{fontWeight: 500}}>Total Amount:</span>
                            <span style={{fontWeight: 500, fontFamily: 'monospace'}}>{formatCurrency(selectedBillsTotal)}</span>
                        </div>
                    </div>
                    <button onClick={handleCreatePaymentRun} disabled={selectedBillIds.length === 0} className="button button-primary" style={{width: '100%', marginTop: '1.5rem'}}>
                        Create Payment Run
                    </button>
                </div>
            </div>

             <div style={{marginTop: '2.5rem'}}>
                <h3 style={{borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem'}}>Payment Runs</h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
                    {paymentRuns.length === 0 ? <p>No payment runs created yet.</p> : paymentRuns.map(run => (
                        <div key={run.id} className={`card payment-run-card`}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <div>
                                    <h4 style={{margin: 0}}>{run.id}</h4>
                                    <p style={{margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)'}}>
                                        Scheduled for {run.paymentDate} - {run.billIds.length} bills
                                    </p>
                                </div>
                                <div>
                                    {run.status === 'Pending' && <button onClick={() => onProcessPaymentRun(run.id)} className="button button-secondary">Process Payment</button>}
                                    {run.status === 'Completed' && <span style={{fontWeight: 600, color: 'var(--color-success)'}}>Completed</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}