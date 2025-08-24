

import React, { useState, useEffect } from 'react';
import { RecurringTransaction, ChartOfAccount, Frequency } from '../../types';
import { XIcon } from '../icons';

interface AddRecurringModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Omit<RecurringTransaction, 'id' | 'nextDueDate' | 'entityId'>) => void;
    onUpdate: (transaction: RecurringTransaction) => void;
    existingData?: RecurringTransaction | null;
    chartOfAccounts: ChartOfAccount[];
}

export const AddRecurringModal: React.FC<AddRecurringModalProps> = ({ isOpen, onClose, onSave, onUpdate, existingData, chartOfAccounts }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(0);
    const [type, setType] = useState('expense');
    const [accountId, setAccountId] = useState('');
    const [frequency, setFrequency] = useState<Frequency>('monthly');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const isEditing = !!existingData;

    useEffect(() => {
        if (isOpen) {
            if (existingData) {
                setDescription(existingData.description);
                setAmount(Math.abs(existingData.amount));
                setType(existingData.amount < 0 ? 'expense' : 'income');
                setAccountId(existingData.accountId);
                setFrequency(existingData.frequency);
                setStartDate(existingData.startDate);
                setEndDate(existingData.endDate || '');
            } else {
                // Reset for new entry
                setDescription('');
                setAmount(0);
                setType('expense');
                setAccountId('');
                setFrequency('monthly');
                setStartDate(new Date().toISOString().split('T')[0]);
                setEndDate('');
            }
        }
    }, [isOpen, existingData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
        
        const data = {
            description,
            amount: finalAmount,
            accountId,
            frequency,
            startDate,
            endDate: endDate || undefined,
        };

        if (isEditing && existingData) {
            onUpdate({ ...existingData, ...data });
        } else {
            onSave(data);
        }
        onClose();
    };

    const filteredAccounts = chartOfAccounts.filter(acc => 
        type === 'expense' ? acc.type === 'Expense' : acc.type === 'Income'
    );

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '550px', maxWidth: '90%', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, border: 'none' }}>{isEditing ? 'Edit Recurring Transaction' : 'New Recurring Transaction'}</h2>
                    <button onClick={onClose} className="button button-tertiary" style={{ padding: '0.5rem' }}><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="input" required />
                    </div>
                    <div className="grid grid-cols-2">
                         <div className="form-group">
                            <label className="form-label">Type</label>
                            <select value={type} onChange={e => setType(e.target.value)} className="input">
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Amount</label>
                            <input type="number" step="0.01" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} className="input" required />
                        </div>
                    </div>
                     <div className="form-group">
                        <label className="form-label">Category</label>
                        <select value={accountId} onChange={e => setAccountId(e.target.value)} className="input" required>
                            <option value="" disabled>Select a category</option>
                            {filteredAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2">
                        <div className="form-group">
                            <label className="form-label">Frequency</label>
                            <select value={frequency} onChange={e => setFrequency(e.target.value as Frequency)} className="input">
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Start Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" required />
                        </div>
                    </div>
                     <div className="form-group">
                        <label className="form-label">End Date (Optional)</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" onClick={onClose} className="button button-secondary">Cancel</button>
                        <button type="submit" className="button button-primary">{isEditing ? 'Update Template' : 'Save Template'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};