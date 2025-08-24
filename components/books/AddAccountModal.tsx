
import React, { useState, useEffect } from 'react';
import { ChartOfAccount, AccountType } from '../../types';
import { XIcon } from '../icons';

interface AddAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (account: Omit<ChartOfAccount, 'id' | 'isArchived'>, idToUpdate?: string) => void;
    existingAccount?: ChartOfAccount | null;
    allAccounts: ChartOfAccount[];
    prefilledParentId?: string;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onSave, existingAccount, allAccounts, prefilledParentId }) => {
    const [accountNumber, setAccountNumber] = useState('');
    const [name, setName] = useState('');
    const [type, setType] = useState<AccountType>('Expense');
    const [description, setDescription] = useState('');
    const [parentId, setParentId] = useState<string | undefined>(undefined);
    
    const isEditing = !!existingAccount;

    useEffect(() => {
        if (isOpen) {
            if (existingAccount) {
                setAccountNumber(existingAccount.accountNumber || '');
                setName(existingAccount.name);
                setType(existingAccount.type);
                setDescription(existingAccount.description);
                setParentId(existingAccount.parentId);
            } else {
                setAccountNumber('');
                setName('');
                const parentType = allAccounts.find(acc => acc.id === prefilledParentId)?.type || 'Expense';
                setType(parentType);
                setDescription('');
                setParentId(prefilledParentId);
            }
        }
    }, [existingAccount, isOpen, prefilledParentId, allAccounts]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ accountNumber, name, type, description, parentId }, existingAccount?.id);
    };

    const potentialParents = allAccounts.filter(acc => 
        acc.type === type && // Must be same type
        !acc.isArchived &&   // Cannot be a child of an archived account
        acc.id !== existingAccount?.id // Cannot be its own parent
    );

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, border: 'none' }}>{existingAccount ? 'Edit Account' : 'New Account'}</h2>
                    <button onClick={onClose} className="button button-tertiary" style={{ padding: '0.5rem' }}><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2">
                        <div className="form-group">
                            <label className="form-label">Account Type</label>
                            <select value={type} onChange={e => { setType(e.target.value as AccountType); setParentId(undefined); }} className="input" required>
                                <option value="Income">Income</option>
                                <option value="Expense">Expense</option>
                                <option value="Asset">Asset</option>
                                <option value="Liability">Liability</option>
                                <option value="Equity">Equity</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Account Number</label>
                            <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="input" placeholder="e.g. 6010" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Account Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Sub-account of</label>
                        <select value={parentId || ''} onChange={e => setParentId(e.target.value || undefined)} className="input">
                            <option value="">None (Top-level account)</option>
                            {potentialParents.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="input" style={{ minHeight: '80px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" onClick={onClose} className="button button-secondary">Cancel</button>
                        <button type="submit" className="button button-primary">{existingAccount ? 'Update Account' : 'Save Account'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
