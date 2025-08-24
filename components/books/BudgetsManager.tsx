import React, { useState, useEffect } from 'react';
import { ChartOfAccount, Budgets } from '../../types';
import { TargetIcon } from '../icons';

interface BudgetsManagerProps {
    accounts: ChartOfAccount[]; // Should be pre-filtered for expenses
    budgets: Budgets;
    onSetBudgets: (newBudgets: Budgets) => void;
}

export const BudgetsManager: React.FC<BudgetsManagerProps> = ({ accounts, budgets, onSetBudgets }) => {
    const [localBudgets, setLocalBudgets] = useState<Budgets>(budgets);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setLocalBudgets(budgets);
        setHasChanges(false);
    }, [budgets]);

    const handleBudgetChange = (accountId: string, value: string) => {
        const amount = parseFloat(value) || 0;
        setLocalBudgets(prev => ({ ...prev, [accountId]: amount }));
        setHasChanges(true);
    };

    const handleSaveChanges = () => {
        onSetBudgets(localBudgets);
        setHasChanges(false);
    };
    
    const totalBudgeted = Object.values(localBudgets).reduce((sum, amount) => sum + amount, 0);
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <TargetIcon style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
                <h2 style={{ margin: 0, border: 'none' }}>Monthly Budgets</h2>
            </div>
            <p style={{color: 'var(--color-text-secondary)', marginTop: 0, marginBottom: '1.5rem'}}>
                Set a monthly budget for each expense category to track your spending. This will be reflected in your reports and dashboard.
            </p>

            <div style={{ maxHeight: '60vh', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px', marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{position: 'sticky', top: 0, backgroundColor: 'var(--color-background)'}}>
                         <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Expense Category</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', width: '200px' }}>Monthly Budget</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.map(account => (
                            <tr key={account.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '0.75rem', fontWeight: 500 }}>{account.name}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem'}}>
                                        <span style={{color: 'var(--color-text-secondary)'}}>$</span>
                                        <input
                                            type="number"
                                            value={localBudgets[account.id] || ''}
                                            onChange={e => handleBudgetChange(account.id, e.target.value)}
                                            className="input"
                                            placeholder="0.00"
                                            step="10"
                                            style={{ textAlign: 'right', width: '120px', paddingRight: '0.5rem' }}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <div style={{fontWeight: 600}}>
                    Total Monthly Budget: <span style={{color: 'var(--color-primary)'}}>{formatCurrency(totalBudgeted)}</span>
                </div>
                <button onClick={handleSaveChanges} disabled={!hasChanges} className="button button-primary">
                    {hasChanges ? 'Save Changes' : 'Saved'}
                </button>
            </div>
        </div>
    );
};