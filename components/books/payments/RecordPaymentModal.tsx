import React, { useState, useEffect, useMemo } from 'react';
import { Invoice } from '../../../types';
import { XIcon, CreditCardIcon } from '../../icons';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (invoiceId: string, paymentAmount: number, paymentDate: string) => void;
    invoice: Invoice;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, onSave, invoice }) => {
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    const { invoiceTotal, amountPaid, amountDue } = useMemo(() => {
        const invoiceTotal = invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const amountPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const amountDue = invoiceTotal - amountPaid;
        return { invoiceTotal, amountPaid, amountDue };
    }, [invoice]);

    useEffect(() => {
        if (isOpen) {
            setPaymentAmount(amountDue);
            setPaymentDate(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen, amountDue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (paymentAmount > 0 && paymentAmount <= amountDue) {
            onSave(invoice.id, paymentAmount, paymentDate);
        } else {
            alert(`Payment amount must be between 0 and the amount due (${formatCurrency(amountDue)}).`);
        }
    };
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0, border: 'none' }}>Record Payment for Invoice {invoice.id}</h2>
                    <button onClick={onClose} className="button button-tertiary" style={{ padding: '0.5rem' }}><XIcon /></button>
                </div>

                <div style={{backgroundColor: 'var(--color-background)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Invoice Total:</span> <span>{formatCurrency(invoiceTotal)}</span></div>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}><span>Amount Paid:</span> <span>{formatCurrency(amountPaid)}</span></div>
                    <hr style={{margin: '0.5rem 0', border: 'none', borderTop: '1px solid var(--color-border)'}} />
                    <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 600}}><span>Amount Due:</span> <span>{formatCurrency(amountDue)}</span></div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2">
                        <div className="form-group">
                            <label className="form-label">Payment Amount</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                value={paymentAmount} 
                                onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)} 
                                className="input" 
                                required 
                                max={amountDue}
                            />
                        </div>
                         <div className="form-group">
                            <label className="form-label">Payment Date</label>
                            <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="input" required />
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" onClick={onClose} className="button button-secondary">Cancel</button>
                        <button type="submit" className="button button-primary">
                            <CreditCardIcon /> Record Payment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};