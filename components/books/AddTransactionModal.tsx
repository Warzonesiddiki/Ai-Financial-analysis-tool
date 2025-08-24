import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, ChartOfAccount, CategorizationRule, AccountType } from '../../types';
import { XIcon, PaperclipIcon, SparklesIcon } from '../icons';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Omit<Transaction, 'id' | 'reconciliationStatus' | 'entityId' | 'reviewedBy' | 'confidenceScore' | 'matchedBankTxId'>, idToUpdate?: string) => void;
    initialData?: Partial<Transaction> | null;
    chartOfAccounts: ChartOfAccount[];
    rules: CategorizationRule[];
}

interface AccountNode extends ChartOfAccount {
    children: AccountNode[];
    depth: number;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onSave, initialData, chartOfAccounts, rules }) => {
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(0);
    const [type, setType] = useState('expense');
    const [accountId, setAccountId] = useState('');
    
    const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
    const [attachmentFilename, setAttachmentFilename] = useState<string | null>(null);
    const [isAiPrefilled, setIsAiPrefilled] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setDate(initialData.date || new Date().toISOString().split('T')[0]);
                setDescription(initialData.description || '');
                setAmount(initialData.amount ? Math.abs(initialData.amount) : 0);
                const initialType = (initialData.amount || 0) < 0 ? 'expense' : 'income';
                setType(initialType);
                setAccountId(initialData.accountId || '');
                setAttachmentUrl(initialData.attachmentUrl || null);
                setAttachmentFilename(initialData.attachmentFilename || null);
                
                if (initialData.id) {
                    setEditingId(initialData.id);
                    setIsAiPrefilled(false);
                } else {
                    setEditingId(null);
                    setIsAiPrefilled(!!initialData.attachmentUrl);
                }
            } else {
                // Reset for manual entry
                setDate(new Date().toISOString().split('T')[0]);
                setDescription('');
                setAmount(0);
                setType('expense');
                setAccountId('');
                setAttachmentUrl(null);
                setAttachmentFilename(null);
                setIsAiPrefilled(false);
                setEditingId(null);
            }
        }
    }, [isOpen, initialData]);

    // Apply rules when description changes
    useEffect(() => {
        if (!isAiPrefilled && !editingId) { // Don't override AI receipt scan or existing data
            const applyRules = (desc: string): string | undefined => {
                for (const rule of rules) {
                    if (desc.toLowerCase().includes(rule.keyword.toLowerCase())) {
                        return rule.accountId;
                    }
                }
                return undefined;
            };

            const suggestedAccountId = applyRules(description);
            if (suggestedAccountId) {
                const account = chartOfAccounts.find(a => a.id === suggestedAccountId);
                if (account) {
                    setAccountId(suggestedAccountId);
                    setType(account.type.toLowerCase() as 'income' | 'expense');
                }
            }
        }
    }, [description, rules, chartOfAccounts, isAiPrefilled, editingId]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
        
        const currency = initialData?.currency || 'USD';
        const exchangeRate = initialData?.exchangeRate || 1;
        // Use provided base amount if available (from receipt scan), otherwise calculate
        const baseCurrencyAmount = initialData?.baseCurrencyAmount !== undefined ? initialData.baseCurrencyAmount : (finalAmount * exchangeRate);

        const transactionData = {
            date,
            description,
            amount: finalAmount,
            accountId,
            attachmentUrl: attachmentUrl || undefined,
            attachmentFilename: attachmentFilename || undefined,
            currency,
            exchangeRate,
            baseCurrencyAmount
        };
        
        onSave(transactionData, editingId || undefined);
    };

    const accountOptions = useMemo(() => {
        const relevantTypes: AccountType[] = type === 'expense' ? ['Expense'] : ['Income'];
        
        const createOptions = (type: AccountType) => {
            const filteredAccounts = chartOfAccounts.filter(acc => acc.type === type && !acc.isArchived);
            const tree: AccountNode[] = [];
            const map: { [key: string]: AccountNode } = {};
            
            filteredAccounts.forEach(acc => { map[acc.id] = { ...acc, children: [], depth: 0 }; });
            filteredAccounts.forEach(acc => {
                if (acc.parentId && map[acc.parentId]) {
                    map[acc.parentId].children.push(map[acc.id]);
                } else {
                    tree.push(map[acc.id]);
                }
            });
    
            const setDepth = (nodes: AccountNode[], depth: number) => {
                nodes.forEach(node => {
                    node.depth = depth;
                    setDepth(node.children, depth + 1);
                });
            };
            setDepth(tree, 0);
    
            const options: React.ReactNode[] = [];
            const traverse = (node: AccountNode) => {
                options.push(<option key={node.id} value={node.id}>{'--'.repeat(node.depth)} {node.name}</option>);
                node.children.sort((a, b) => (a.accountNumber || '').localeCompare(b.accountNumber || '')).forEach(traverse);
            };
            tree.sort((a,b) => (a.accountNumber || '').localeCompare(b.accountNumber || '')).forEach(traverse);
            return options;
        }

        return relevantTypes.map(type => (
            <optgroup label={type} key={type}>
                {createOptions(type)}
            </optgroup>
        ));
    }, [type, chartOfAccounts]);


    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, border: 'none' }}>{editingId ? 'Edit Transaction' : 'New Transaction'}</h2>
                    <button onClick={onClose} className="button button-tertiary" style={{ padding: '0.5rem' }}><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
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
                        <label className="form-label">Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                            <span>Description</span>
                            {isAiPrefilled && (
                                <span style={{
                                    backgroundColor: 'var(--color-primary-light)',
                                    color: 'var(--color-primary)',
                                    padding: '2px 8px',
                                    borderRadius: '99px',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <SparklesIcon style={{width: '12px', height: '12px'}} />
                                    AI Extracted
                                </span>
                            )}
                        </label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="input" style={{minHeight: '80px'}} required />
                    </div>
                     <div className="form-group">
                        <label className="form-label">Category</label>
                        <select value={accountId} onChange={e => setAccountId(e.target.value)} className="input" required>
                            <option value="" disabled>Select a category</option>
                            {accountOptions}
                        </select>
                    </div>
                    
                    {attachmentFilename && (
                        <div className="form-group">
                            <label className="form-label">Attachment</label>
                            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '8px'}}>
                                <PaperclipIcon style={{color: 'var(--color-text-secondary)'}}/>
                                <span style={{fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{attachmentFilename}</span>
                                {attachmentUrl && attachmentUrl.startsWith('data:image') && <img src={attachmentUrl} alt="preview" style={{maxHeight: '30px', maxWidth: '50px', marginLeft: 'auto', borderRadius: '4px', objectFit: 'cover'}} />}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" onClick={onClose} className="button button-secondary">Cancel</button>
                        <button type="submit" className="button button-primary">{editingId ? 'Update Transaction' : 'Save Transaction'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};