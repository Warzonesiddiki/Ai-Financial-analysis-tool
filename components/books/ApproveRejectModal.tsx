

import React, { useState, useMemo } from 'react';
import { Bill, PurchaseOrder, BillLineItem, PurchaseOrderLineItem } from '../../types';
import { XIcon, CheckCircleIcon } from '../icons';

interface ApproveRejectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (itemId: string, decision: 'Approved' | 'Rejected', notes?: string) => void;
    item: Bill | PurchaseOrder;
}

export const ApproveRejectModal: React.FC<ApproveRejectModalProps> = ({ isOpen, onClose, onSave, item }) => {
    const [notes, setNotes] = useState('');
    
    const totalAmount = useMemo(() => {
        return (item.lineItems as (BillLineItem | PurchaseOrderLineItem)[]).reduce((sum: number, lineItem) => sum + (Number(lineItem.quantity) || 0) * (Number(lineItem.unitPrice) || 0), 0);
    }, [item]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const handleSave = (decision: 'Approved' | 'Rejected') => {
        onSave(item.id, decision, notes);
    };
    
    if (!isOpen) return null;

    const isPO = 'poDate' in item;
    const title = isPO ? `Review Purchase Order ${item.id}` : `Review Bill ${item.id}`;
    const dueDate = isPO ? item.deliveryDate : item.dueDate;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, border: 'none' }}>{title}</h2>
                    <button onClick={onClose} className="button button-tertiary" style={{ padding: '0.5rem' }}><XIcon /></button>
                </div>
                
                <div style={{marginBottom: '1.5rem'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                        <span style={{color: 'var(--color-text-secondary)'}}>Amount</span>
                        <span style={{fontWeight: 700, fontSize: '1.2rem'}}>{formatCurrency(totalAmount)}</span>
                    </div>
                     <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span style={{color: 'var(--color-text-secondary)'}}>{isPO ? 'Delivery Date' : 'Due Date'}</span>
                        <span style={{fontWeight: 500}}>{dueDate}</span>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Notes (Optional)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input" style={{ minHeight: '80px' }} placeholder="e.g., Approved, cost is within budget." />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                    <button onClick={() => handleSave('Rejected')} className="button button-secondary" style={{borderColor: 'var(--color-error)', color: 'var(--color-error)'}}>
                        <XIcon /> Reject
                    </button>
                    <button onClick={() => handleSave('Approved')} className="button button-primary" style={{backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)'}}>
                       <CheckCircleIcon /> Approve
                    </button>
                </div>
            </div>
        </div>
    );
};