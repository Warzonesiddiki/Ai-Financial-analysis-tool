import React from 'react';
import { CategorizationRule, ChartOfAccount } from '../../types';
import { TrashIcon, ZapIcon } from '../icons';

interface AIRulesManagerProps {
    rules: CategorizationRule[];
    chartOfAccounts: ChartOfAccount[];
    onDeleteRule: (id: string) => void;
}

export const AIRulesManager: React.FC<AIRulesManagerProps> = ({ rules, chartOfAccounts, onDeleteRule }) => {

    const handleDeleteClick = (id: string) => {
        if (window.confirm('Are you sure you want to delete this rule?')) {
            onDeleteRule(id);
        }
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <ZapIcon style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
                <h2 style={{ margin: 0, border: 'none' }}>AI Categorization Rules</h2>
            </div>
            <p style={{color: 'var(--color-text-secondary)', marginTop: 0}}>
                These rules automatically categorize transactions for you. They are created when you accept an AI suggestion on the Transactions page.
            </p>

            {rules.length === 0 ? (
                <div style={{textAlign: 'center', padding: '2rem', border: '2px dashed var(--color-border)', borderRadius: '8px'}}>
                    <p style={{color: 'var(--color-text-secondary)', fontWeight: 500}}>You have no rules yet.</p>
                    <p style={{color: 'var(--color-text-secondary)', fontSize: '0.9rem'}}>Go to the Transactions page and categorize an item to get an AI suggestion for a new rule.</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem' }}>Keyword</th>
                                <th style={{ padding: '0.75rem' }}>Assigned Category</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rules.map(rule => {
                                const account = chartOfAccounts.find(acc => acc.id === rule.accountId);
                                return (
                                <tr key={rule.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: 500 }}>"{rule.keyword}"</td>
                                    <td style={{ padding: '0.75rem', color: 'var(--color-text-secondary)' }}>{account?.name || 'N/A'}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        <button onClick={() => handleDeleteClick(rule.id)} className="button button-tertiary" style={{ padding: '0.5rem' }} aria-label="Delete rule">
                                            <TrashIcon style={{ width: '16px', height: '16px', color: 'var(--color-error)' }} />
                                        </button>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};