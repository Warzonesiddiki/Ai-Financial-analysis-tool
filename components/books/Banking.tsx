import React, { useState, useMemo } from 'react';
import { BankTransaction, Transaction, ChartOfAccount } from '../../types';
import { Reconciliation } from './Reconciliation';
import { LandmarkIcon } from '../icons';

interface BankingProps {
    bankTransactions: BankTransaction[];
    allBookTransactions: Transaction[];
    chartOfAccounts: ChartOfAccount[];
    onMatchTransactions: (bankTxId: string, bookTxId: string) => void;
    onCreateAndMatchTransaction: (bankTx: BankTransaction, newBookTxData: Omit<Transaction, 'id' | 'reconciliationStatus' | 'matchedBankTxId'>) => void;
}

export const Banking: React.FC<BankingProps> = (props) => {
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

    const bankAccounts = useMemo(() => 
        props.chartOfAccounts.filter(acc => acc.type === 'Asset' && (acc.name.toLowerCase().includes('bank') || acc.name.toLowerCase().includes('checking') || acc.name.toLowerCase().includes('savings'))), 
        [props.chartOfAccounts]
    );

    const bankAccountData = useMemo(() => {
        return bankAccounts.map(acc => {
            const txs = props.bankTransactions.filter(btx => btx.bankAccountId === acc.id);
            const reconciledCount = txs.filter(btx => btx.status === 'reconciled').length;
            const bookBalance = props.allBookTransactions
                .filter(t => t.accountId === acc.id)
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                ...acc,
                totalTransactions: txs.length,
                reconciledCount,
                bookBalance
            };
        });
    }, [bankAccounts, props.bankTransactions, props.allBookTransactions]);

    if (selectedAccountId) {
        return (
            <Reconciliation
                key={selectedAccountId}
                bankAccountId={selectedAccountId}
                onBackToDashboard={() => setSelectedAccountId(null)}
                allBankTransactions={props.bankTransactions}
                allBookTransactions={props.allBookTransactions}
                chartOfAccounts={props.chartOfAccounts}
                onMatch={props.onMatchTransactions}
                onCreateAndMatch={props.onCreateAndMatchTransaction}
            />
        );
    }
    
    if (bankAccounts.length === 0) {
        return (
            <div className="card">
                <h2 style={{ margin: 0, border: 'none' }}>Banking</h2>
                <p style={{textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem 0'}}>
                    No bank accounts found. Please create a new 'Asset' account with 'Bank' in its name in your Chart of Accounts.
                </p>
            </div>
        );
    }

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <div className="card">
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <LandmarkIcon style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
                <h2 style={{ margin: 0, border: 'none' }}>Banking Dashboard</h2>
            </div>
             <p style={{color: 'var(--color-text-secondary)', marginTop: 0}}>
                Select an account to start reconciling transactions.
            </p>
            <div className="banking-dashboard-grid">
                {bankAccountData.map(acc => {
                    const progress = acc.totalTransactions > 0 ? (acc.reconciledCount / acc.totalTransactions) * 100 : 100;
                    return (
                        <div key={acc.id} className="bank-account-card" onClick={() => setSelectedAccountId(acc.id)}>
                            <div>
                                <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>{acc.name}</h3>
                                <p style={{margin: '0.5rem 0 0 0', color: 'var(--color-text-secondary)', fontWeight: 500, fontFamily: 'monospace'}}>
                                    Book Balance: {formatCurrency(acc.bookBalance)}
                                </p>
                            </div>
                            <div style={{marginTop: '1.5rem'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem'}}>
                                    <span>Reconciliation</span>
                                    <span>{acc.reconciledCount} / {acc.totalTransactions}</span>
                                </div>
                                <div style={{ backgroundColor: 'var(--color-border)', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--color-success)', transition: 'width 0.5s ease' }}></div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};