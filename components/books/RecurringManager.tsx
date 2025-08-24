
import React from 'react';
import { RecurringTransaction, ChartOfAccount } from '../../types';
import { PlusCircleIcon, EditIcon, TrashIcon, RefreshCwIcon } from '../icons';

interface RecurringManagerProps {
    recurringTransactions: RecurringTransaction[];
    chartOfAccounts: ChartOfAccount[];
    onDelete: (id: string) => void;
    openModal: (type: 'recurring', data: any) => void;
}

export const RecurringManager: React.FC<RecurringManagerProps> = ({ recurringTransactions, chartOfAccounts, onDelete, openModal }) => {

    const handleEditClick = (data: RecurringTransaction) => {
        openModal('recurring', { recurring: data });
    };

    const handleDeleteClick = (id: string) => {
        if (window.confirm('Are you sure you want to delete this recurring transaction template? This will stop future transactions from being created.')) {
            onDelete(id);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <RefreshCwIcon style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
                    <h2 style={{ margin: 0, border: 'none' }}>Recurring Transactions</h2>
                </div>
                <button onClick={() => openModal('recurring', { recurring: null })} className="button button-primary">
                    <PlusCircleIcon /> Add Recurring
                </button>
            </div>
             <p style={{color: 'var(--color-text-secondary)', marginTop: 0, marginBottom: '1.5rem'}}>
                Manage templates for transactions that repeat on a schedule. The system will create them for you automatically on their due date.
            </p>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Description</th>
                            <th style={{ padding: '0.75rem' }}>Category</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
                            <th style={{ padding: '0.75rem' }}>Frequency</th>
                            <th style={{ padding: '0.75rem' }}>Next Date</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recurringTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)'}}>
                                    No recurring transactions have been set up yet.
                                </td>
                            </tr>
                        ) : recurringTransactions.map(rt => {
                            const account = chartOfAccounts.find(acc => acc.id === rt.accountId);
                            return (
                            <tr key={rt.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '0.75rem', fontWeight: 500 }}>{rt.description}</td>
                                <td style={{ padding: '0.75rem' }}>{account?.name || 'N/A'}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', color: rt.amount < 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                                    {formatCurrency(rt.amount)}
                                </td>
                                <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{rt.frequency}</td>
                                <td style={{ padding: '0.75rem' }}>{rt.nextDueDate}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                        <button onClick={() => handleEditClick(rt)} className="button button-tertiary" style={{ padding: '0.5rem' }} aria-label="Edit recurring transaction">
                                            <EditIcon style={{ width: '16px', height: '16px' }} />
                                        </button>
                                        <button onClick={() => handleDeleteClick(rt.id)} className="button button-tertiary" style={{ padding: '0.5rem' }} aria-label="Delete recurring transaction">
                                            <TrashIcon style={{ width: '16px', height: '16px', color: 'var(--color-error)' }} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
