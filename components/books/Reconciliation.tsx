
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BankTransaction, Transaction, ChartOfAccount, MatchSuggestion, AccountType, AIBankFeedInsight } from '../../types';
import { suggestTransactionMatch, analyzeBankFeed } from '../../services/geminiService';
import { Spinner } from '../Spinner';
import { SparklesIcon, LinkIcon, CheckCircleIcon, PlusCircleIcon, SearchIcon, ArrowLeftIcon } from '../icons';
import { AIAnalysisTab } from './banking/AIAnalysisTab';

interface ReconciliationProps {
    bankAccountId: string;
    allBankTransactions: BankTransaction[];
    allBookTransactions: Transaction[];
    chartOfAccounts: ChartOfAccount[];
    onMatch: (bankTxId: string, bookTxId: string) => void;
    onCreateAndMatch: (bankTx: BankTransaction, newBookTxData: Omit<Transaction, 'id' | 'reconciliationStatus' | 'matchedBankTxId'>) => void;
    onBackToDashboard: () => void;
}

type WorkspaceTab = 'review' | 'analysis';

export const Reconciliation: React.FC<ReconciliationProps> = (props) => {
    const { bankAccountId, allBankTransactions, allBookTransactions, chartOfAccounts, onMatch, onCreateAndMatch, onBackToDashboard } = props;
    
    const [suggestions, setSuggestions] = useState<Record<string, MatchSuggestion | null>>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedBankTxId, setSelectedBankTxId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<WorkspaceTab>('review');
    
    const relevantBankTxs = useMemo(() => allBankTransactions.filter(btx => btx.bankAccountId === bankAccountId), [allBankTransactions, bankAccountId]);
    const unreconciledBankTxs = useMemo(() => relevantBankTxs.filter(btx => btx.status !== 'reconciled'), [relevantBankTxs]);
    const reconciledCount = useMemo(() => relevantBankTxs.length - unreconciledBankTxs.length, [relevantBankTxs, unreconciledBankTxs]);
    const progress = relevantBankTxs.length > 0 ? (reconciledCount / relevantBankTxs.length) * 100 : 100;

    const unreconciledBookTxs = useMemo(() => allBookTransactions.filter(tx => tx.reconciliationStatus !== 'reconciled'), [allBookTransactions]);
    
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (unreconciledBankTxs.length === 0) {
                setIsLoading(false);
                return;
            };
            setIsLoading(true);
            const newSuggestions: Record<string, MatchSuggestion | null> = {};
            const txsToFetch = unreconciledBankTxs.filter(btx => suggestions[btx.id] === undefined);

            const promises = txsToFetch.map(btx => 
                suggestTransactionMatch(btx, unreconciledBookTxs).then(suggestion => ({ id: btx.id, suggestion }))
            );

            const results = await Promise.all(promises);
            results.forEach(res => newSuggestions[res.id] = res.suggestion);

            setSuggestions(prev => ({...prev, ...newSuggestions}));
            setIsLoading(false);
        };
        fetchSuggestions();
    }, [bankAccountId, allBankTransactions, allBookTransactions]);
    
    const handleMatchAndSelectNext = (bankTxId: string, bookTxId: string) => {
        onMatch(bankTxId, bookTxId);
    };

    const handleCreateAndSelectNext = (bankTx: BankTransaction, newTxData: Omit<Transaction, 'id' | 'reconciliationStatus' | 'matchedBankTxId'>) => {
        onCreateAndMatch(bankTx, newTxData);
    };
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    
    const selectedBankTx = useMemo(() => unreconciledBankTxs.find(tx => tx.id === selectedBankTxId), [selectedBankTxId, unreconciledBankTxs]);

    const handleAcceptAll = () => {
        unreconciledBankTxs.forEach(btx => {
            const suggestion = suggestions[btx.id];
            if (suggestion?.type === 'match') {
                onMatch(btx.id, suggestion.bookTransactionId);
            }
        });
    };
    
    const accountName = useMemo(() => chartOfAccounts.find(a => a.id === bankAccountId)?.name, [chartOfAccounts, bankAccountId]);

    return (
        <div className="card">
            <button onClick={onBackToDashboard} className="button button-secondary" style={{marginBottom: '1.5rem'}}>
                <ArrowLeftIcon />
                Back to Banking Dashboard
            </button>
            <h2 style={{margin: 0, border: 'none'}}>{accountName} Reconciliation</h2>

            <div className="reconciliation-progress" style={{margin: '1.5rem 0'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                    <h3 style={{ margin: 0 }}>Reconciliation Progress</h3>
                    <span style={{fontWeight: 500, color: 'var(--color-text-secondary)'}}>{reconciledCount} / {relevantBankTxs.length} Reconciled</span>
                </div>
                <div style={{ backgroundColor: 'var(--color-border)', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--color-success)', transition: 'width 0.5s ease' }}></div>
                </div>
            </div>

            <div className="tabs" style={{marginBottom: 0}}>
                <button onClick={() => setActiveTab('review')} className={`tab-button ${activeTab === 'review' ? 'active' : ''}`}>For Review ({unreconciledBankTxs.length})</button>
                <button onClick={() => setActiveTab('analysis')} className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}>AI Analysis</button>
            </div>
            
            <div className="tab-content" style={{paddingTop: 0}}>
                {activeTab === 'review' && (
                    <div className="reconciliation-for-review-list">
                        <div style={{padding: '0.75rem 1rem', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--color-border)'}}>
                            <button onClick={handleAcceptAll} className="button button-primary" disabled={isLoading}>
                                <CheckCircleIcon /> Accept All Suggestions
                            </button>
                        </div>
                        {isLoading && unreconciledBankTxs.length > 0 && <div style={{padding: '2rem', textAlign: 'center'}}><Spinner /></div>}
                        {!isLoading && unreconciledBankTxs.length === 0 && <div style={{textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)'}}>All transactions are reconciled!</div>}
                        {unreconciledBankTxs.map(btx => {
                            const suggestion = suggestions[btx.id];
                            const matchedTx = suggestion?.type === 'match' ? allBookTransactions.find(t => t.id === suggestion.bookTransactionId) : null;
                            const isAmountMatch = matchedTx && Math.abs(matchedTx.amount) === Math.abs(btx.amount);

                            return (
                                <div key={btx.id} className="for-review-item">
                                    <div className="for-review-item-details">
                                        <div style={{fontWeight: 500}}>{btx.description}</div>
                                        <div style={{fontSize: '0.8rem', color: 'var(--color-text-secondary)'}}>{btx.date}</div>
                                    </div>
                                    <div className="for-review-item-suggestion">
                                        {suggestion?.type === 'match' && matchedTx && (
                                            <>
                                                <LinkIcon style={{width: '14px'}}/>
                                                <span>Match: {matchedTx.description}</span>
                                            </>
                                        )}
                                        {suggestion?.type === 'create' && (
                                             <>
                                                <PlusCircleIcon style={{width: '14px'}}/>
                                                <span>Create in: {chartOfAccounts.find(a => a.id === suggestion.suggestedAccountId)?.name}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="for-review-item-actions" style={{display: 'flex', gap: '0.5rem', justifyContent: 'flex-end'}}>
                                        {suggestion?.type === 'match' && matchedTx && isAmountMatch ? (
                                            <button onClick={() => onMatch(btx.id, matchedTx.id)} className="button button-secondary">Match</button>
                                        ) : (
                                             <button onClick={() => {}} className="button button-secondary">Review</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                {activeTab === 'analysis' && <AIAnalysisTab unreconciledTxs={unreconciledBankTxs} chartOfAccounts={chartOfAccounts} />}
            </div>
        </div>
    );
};
