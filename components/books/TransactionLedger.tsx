import React, { useState, useRef, useMemo } from 'react';
import { Transaction, ChartOfAccount, CategorizationRule, AccountType } from '../../types';
import { PlusCircleIcon, UploadCloudIcon, AlertTriangleIcon, EditIcon, TrashIcon, SparklesIcon, XIcon, SearchIcon } from '../icons';
import { AddTransactionModal } from './AddTransactionModal';
import { extractTransactionFromImage } from '../../services/geminiService';
import { Spinner } from '../Spinner';

interface TransactionLedgerProps {
    transactions: Transaction[];
    chartOfAccounts: ChartOfAccount[];
    rules: CategorizationRule[];
    onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    onUpdateTransaction: (transaction: Transaction) => void;
    onDeleteTransaction: (id: string) => void;
    onAddRule: (rule: Omit<CategorizationRule, 'id'>) => void;
}

interface AccountNode extends ChartOfAccount {
    children: AccountNode[];
    depth: number;
}

const getDescendantAccountIds = (parentId: string, allAccounts: ChartOfAccount[]): string[] => {
    const descendants = [parentId];
    const children = allAccounts.filter(acc => acc.parentId === parentId);
    children.forEach(child => {
        descendants.push(...getDescendantAccountIds(child.id, allAccounts));
    });
    return descendants;
};


export const TransactionLedger: React.FC<TransactionLedgerProps> = ({ transactions, chartOfAccounts, rules, onAddTransaction, onUpdateTransaction, onDeleteTransaction, onAddRule }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<Partial<Transaction> | null>(null);
    const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
    const [receiptError, setReceiptError] = useState<string | null>(null);
    const [ruleSuggestion, setRuleSuggestion] = useState<{ tx: Transaction, keyword: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredTransactions = useMemo(() => {
        let result = transactions;

        if (searchQuery) {
            result = result.filter(tx => tx.description.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0,0,0,0);
            result = result.filter(tx => new Date(tx.date) >= start);
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            result = result.filter(tx => new Date(tx.date) <= end);
        }
        
        if (selectedAccountId) {
            const accountIdsToFilter = getDescendantAccountIds(selectedAccountId, chartOfAccounts);
            result = result.filter(tx => accountIdsToFilter.includes(tx.accountId));
        }

        return result;
    }, [transactions, searchQuery, startDate, endDate, selectedAccountId, chartOfAccounts]);
    
    const accountOptions = useMemo(() => {
        const activeAccounts = chartOfAccounts.filter(acc => !acc.isArchived);
        const tree: AccountNode[] = [];
        const map: { [key: string]: AccountNode } = {};
        
        activeAccounts.forEach(acc => {
            map[acc.id] = { ...acc, children: [], depth: 0 };
        });

        activeAccounts.forEach(acc => {
            if (acc.parentId && map[acc.parentId]) {
                map[acc.parentId].children.push(map[acc.id]);
            } else {
                tree.push(map[acc.id]);
            }
        });

        const setDepth = (nodes: AccountNode[], depth: number) => {
            nodes.forEach(node => {
                node.depth = depth;
                node.children.sort((a,b) => (a.accountNumber || '').localeCompare(b.accountNumber || ''));
                setDepth(node.children, depth + 1);
            });
        };
        tree.sort((a,b) => (a.accountNumber || '').localeCompare(b.accountNumber || ''));
        setDepth(tree, 0);

        const renderOptions = (nodes: AccountNode[]) => {
            let options: React.ReactNode[] = [];
            nodes.forEach(node => {
                options.push(
                    <option key={node.id} value={node.id}>
                        {'--'.repeat(node.depth)} {node.name}
                    </option>
                );
                options = options.concat(renderOptions(node.children));
            });
            return options;
        };
        
        const groupedByToplevel: { [key: string]: AccountNode[] } = {};
        tree.forEach(node => {
          if (!groupedByToplevel[node.type]) {
            groupedByToplevel[node.type] = [];
          }
          groupedByToplevel[node.type].push(node);
        });

        return (Object.keys(groupedByToplevel) as AccountType[]).map(type => (
          <optgroup label={type} key={type}>
            {renderOptions(groupedByToplevel[type])}
          </optgroup>
        ));
    }, [chartOfAccounts]);

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedAccountId('');
        setStartDate('');
        setEndDate('');
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessingReceipt(true);
        setReceiptError(null);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const base64String = (reader.result as string).split(',')[1];
                    const extractedData = await extractTransactionFromImage({
                        inlineData: { data: base64String, mimeType: file.type }
                    });
                    
                    setModalData({
                        description: extractedData.description,
                        date: extractedData.date,
                        amount: -Math.abs(extractedData.amount), // Assume expense by default
                        accountId: extractedData.accountId,
                        attachmentUrl: reader.result as string,
                        attachmentFilename: file.name,
                    });
                    setIsModalOpen(true);

                } catch (err) {
                    setReceiptError(err instanceof Error ? err.message : "Receipt processing failed.");
                } finally {
                    setIsProcessingReceipt(false);
                }
            };
            reader.onerror = () => {
                setIsProcessingReceipt(false);
                setReceiptError("Failed to read the file.");
            }
        } catch (err) {
            setIsProcessingReceipt(false);
            setReceiptError(err instanceof Error ? err.message : "An unexpected error occurred.");
        }
        
        if (event.target) {
            event.target.value = '';
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleOpenAddModal = () => {
        setModalData(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (transaction: Transaction) => {
        setModalData(transaction);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            onDeleteTransaction(id);
        }
    };

    const getKeywordFromDescription = (description: string): string => {
        const words = description.split(' ').filter(w => !/^\d+$/.test(w));
        if (words.length > 0) {
            if (words[0].length > 3) return words[0];
            if (words.length > 1) return `${words[0]} ${words[1]}`;
            return words[0];
        }
        return description;
    }

    const handleSaveTransaction = (transactionData: Omit<Transaction, 'id'>, idToUpdate?: string) => {
        if (idToUpdate) {
            const originalTx = transactions.find(tx => tx.id === idToUpdate);
            onUpdateTransaction({ id: idToUpdate, ...transactionData });

            if (originalTx && originalTx.accountId !== transactionData.accountId && transactionData.accountId) {
                const keyword = getKeywordFromDescription(transactionData.description);
                if (!rules.some(r => r.keyword.toLowerCase() === keyword.toLowerCase())) {
                    setRuleSuggestion({ tx: { id: idToUpdate, ...transactionData }, keyword });
                }
            }

        } else {
            onAddTransaction(transactionData);
        }
        setIsModalOpen(false);
    };

    const handleCreateRule = () => {
        if (ruleSuggestion) {
            onAddRule({ keyword: ruleSuggestion.keyword, accountId: ruleSuggestion.tx.accountId });
            setRuleSuggestion(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ margin: 0, border: 'none' }}>Transactions</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                    <button onClick={handleUploadClick} className="button button-secondary" disabled={isProcessingReceipt}>
                        {isProcessingReceipt ? <Spinner /> : <UploadCloudIcon />}
                        {isProcessingReceipt ? 'Processing...' : 'Upload Receipt'}
                    </button>
                    <button onClick={handleOpenAddModal} className="button button-primary">
                        <PlusCircleIcon /> Add Transaction
                    </button>
                </div>
            </div>

            {receiptError && (
                <div style={{ 
                    backgroundColor: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '8px', 
                    border: '1px solid #fecaca', marginBottom: '1.5rem', display: 'flex',
                    alignItems: 'center', gap: '0.75rem'
                }}>
                    <AlertTriangleIcon style={{ flexShrink: 0, width: '20px', height: '20px' }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>{receiptError}</p>
                </div>
            )}
            
            <div style={{backgroundColor: 'var(--color-background)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
                <div className="grid grid-cols-4" style={{alignItems: 'flex-end', gap: '1rem'}}>
                    <div className="form-group" style={{gridColumn: 'span 2 / span 2', marginBottom: 0, position: 'relative'}}>
                        <label className="form-label">Search Description</label>
                        <SearchIcon style={{position: 'absolute', left: '10px', top: '38px', width: '16px', height: '16px', color: 'var(--color-text-secondary)'}} />
                        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input" placeholder="e.g. Adobe, Client Payment" style={{paddingLeft: '32px'}}/>
                    </div>
                     <div className="form-group" style={{marginBottom: 0}}>
                        <label className="form-label">Category</label>
                        <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} className="input">
                            <option value="">All Categories</option>
                            {accountOptions}
                        </select>
                    </div>
                     <div className="form-group" style={{marginBottom: 0}}>
                        <label className="form-label">Date Range</label>
                         <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
                            <span>-</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
                        </div>
                    </div>
                </div>
                 <button onClick={handleClearFilters} className="button button-tertiary" style={{marginTop: '1rem'}}>Clear Filters</button>
            </div>

            <div style={{overflowX: 'auto'}}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '700px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Date</th>
                            <th style={{ padding: '0.75rem' }}>Description</th>
                            <th style={{ padding: '0.75rem' }}>Category</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.length === 0 ? (
                            <tr><td colSpan={5} style={{textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)'}}>No transactions match your filters.</td></tr>
                        ) : filteredTransactions.map(tx => {
                            const account = chartOfAccounts.find(acc => acc.id === tx.accountId);
                            return (
                                <React.Fragment key={tx.id}>
                                <tr>
                                    <td style={{ padding: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{tx.date}</td>
                                    <td style={{ padding: '0.75rem', fontWeight: 500 }}>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                            <span>{tx.description}</span>
                                            {tx.reviewedBy === 'ai' && (
                                                <span title={`AI Categorized with ${tx.confidenceScore ? (tx.confidenceScore*100).toFixed(0) : ''}% confidence`} style={{backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600}}>AI</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.75rem', color: 'var(--color-text-secondary)' }}>{account?.name || 'Uncategorized'}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', color: tx.amount < 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                                        {formatCurrency(tx.amount)}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        <div style={{display: 'flex', justifyContent: 'center', gap: '0.5rem'}}>
                                            <button onClick={() => handleEditClick(tx)} className="button button-tertiary" style={{padding: '0.5rem'}} aria-label="Edit transaction"><EditIcon style={{width: '16px', height: '16px'}}/></button>
                                            <button onClick={() => handleDeleteClick(tx.id)} className="button button-tertiary" style={{padding: '0.5rem'}} aria-label="Delete transaction"><TrashIcon style={{width: '16px', height: '16px', color: 'var(--color-error)'}}/></button>
                                        </div>
                                    </td>
                                </tr>
                                {ruleSuggestion?.tx.id === tx.id && (
                                     <tr style={{backgroundColor: 'var(--color-primary-light)'}}>
                                        <td colSpan={5} style={{padding: '0.5rem 1rem', fontSize: '0.85rem'}}>
                                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 500}}>
                                                    <SparklesIcon/>
                                                    <span>AI Suggestion:</span>
                                                    <span style={{color: 'var(--color-text-secondary)', fontWeight: 400}}>
                                                        Create a rule to always categorize transactions with "{ruleSuggestion.keyword}" as "{chartOfAccounts.find(a => a.id === tx.accountId)?.name}"?
                                                    </span>
                                                </div>
                                                <div style={{display: 'flex', gap: '0.5rem'}}>
                                                    <button onClick={handleCreateRule} className="button button-primary" style={{fontSize: '0.8rem', padding: '0.2rem 0.6rem'}}>Create Rule</button>
                                                    <button onClick={() => setRuleSuggestion(null)} className="button button-tertiary" style={{padding: '0.2rem'}}><XIcon style={{width: '14px', height: '14px'}}/></button>
                                                </div>
                                            </div>
                                        </td>
                                     </tr>
                                )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <AddTransactionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveTransaction}
                    initialData={modalData}
                    chartOfAccounts={chartOfAccounts}
                    rules={rules}
                />
            )}
        </div>
    );
};