import React, { useState, useMemo, useCallback } from 'react';
import { Transaction, ChartOfAccount, Invoice, Bill, RecurringTransaction, ManualAdjustment, CashFlowForecast as CashFlowForecastData } from '../../types';
import { generateCashFlowForecast } from '../../services/geminiService';
import { SparklesIcon, AlertTriangleIcon, PlusCircleIcon, TrashIcon } from '../icons';
import { Spinner } from '../Spinner';
import { ForecastChart } from './forecast/ForecastChart';
import { ForecastDataTable } from './forecast/ForecastDataTable';

interface CashFlowForecastProps {
    transactions: Transaction[];
    chartOfAccounts: ChartOfAccount[];
    invoices: Invoice[];
    bills: Bill[];
    recurringTransactions: RecurringTransaction[];
}

export const CashFlowForecast: React.FC<CashFlowForecastProps> = (props) => {
    const [forecast, setForecast] = useState<CashFlowForecastData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [manualAdjustments, setManualAdjustments] = useState<ManualAdjustment[]>([]);
    
    // New adjustment form state
    const [newAdjDate, setNewAdjDate] = useState(new Date().toISOString().split('T')[0]);
    const [newAdjDesc, setNewAdjDesc] = useState('');
    const [newAdjAmount, setNewAdjAmount] = useState(0);

    const startingBalance = useMemo(() => {
        const cashAccounts = props.chartOfAccounts.filter(a => a.type === 'Asset' && (a.name.toLowerCase().includes('bank') || a.name.toLowerCase().includes('cash')));
        const cashAccountIds = cashAccounts.map(a => a.id);
        return props.transactions
            .filter(t => cashAccountIds.includes(t.accountId))
            .reduce((sum, t) => sum + t.amount, 0);
    }, [props.transactions, props.chartOfAccounts]);

    const handleGenerateForecast = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            const recentTransactions = props.transactions.filter(t => new Date(t.date) >= ninetyDaysAgo);

            const result = await generateCashFlowForecast(
                startingBalance,
                recentTransactions,
                props.invoices,
                props.bills,
                props.recurringTransactions,
                manualAdjustments
            );
            setForecast(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred while generating the forecast.");
        } finally {
            setIsLoading(false);
        }
    }, [props, startingBalance, manualAdjustments]);
    
    const handleAddAdjustment = (e: React.FormEvent) => {
        e.preventDefault();
        if (newAdjDesc && newAdjAmount !== 0) {
            const newAdjustment: ManualAdjustment = {
                id: `manual_${Date.now()}`,
                date: newAdjDate,
                description: newAdjDesc,
                amount: newAdjAmount
            };
            setManualAdjustments(prev => [...prev, newAdjustment]);
            // Reset form
            setNewAdjDesc('');
            setNewAdjAmount(0);
        }
    };
    
    const handleRemoveAdjustment = (id: string) => {
        setManualAdjustments(prev => prev.filter(adj => adj.id !== id));
    };

    return (
        <div className="forecast-container">
            <main>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-primary)' }}>
                            <SparklesIcon style={{ width: '28px', height: '28px' }} />
                            <h2 style={{ margin: 0, border: 'none', color: 'inherit' }}>AI Cash Flow Forecast</h2>
                        </div>
                        <button className="button button-primary" onClick={handleGenerateForecast} disabled={isLoading}>
                            {isLoading ? <Spinner /> : <SparklesIcon />}
                            <span>{isLoading ? 'Forecasting...' : 'Generate Forecast'}</span>
                        </button>
                    </div>

                    {error && (
                        <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '8px', border: '1px solid #fecaca', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <AlertTriangleIcon style={{ flexShrink: 0 }} /> <p style={{ margin: 0 }}>{error}</p>
                        </div>
                    )}
                </div>

                {forecast ? (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem'}}>
                        <div className="card">
                            <h4 style={{marginTop: 0}}>AI Narrative Summary</h4>
                            <p style={{color: 'var(--color-text-secondary)'}}>{forecast.narrative}</p>
                        </div>
                        <div className="card">
                             <h4 style={{marginTop: 0}}>8-Week Cash Projection</h4>
                            <ForecastChart forecast={forecast} />
                        </div>
                        <div className="card">
                            <h4 style={{marginTop: 0}}>Forecast Data</h4>
                            <ForecastDataTable forecast={forecast} />
                        </div>
                    </div>
                ) : !isLoading && (
                    <div className="card" style={{marginTop: '1.5rem', textAlign: 'center', padding: '3rem 1.5rem', border: '2px dashed var(--color-border)'}}>
                        <h3 style={{marginTop: 0}}>Your Cash Flow Crystal Ball</h3>
                        <p style={{color: 'var(--color-text-secondary)'}}>
                            Click "Generate Forecast" to let our AI project your cash balance for the next 8 weeks based on your financial data.
                        </p>
                    </div>
                )}
            </main>
            <aside>
                 <div className="card">
                    <h3 style={{marginTop: 0}}>Manual Adjustments</h3>
                    <p style={{color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '-0.5rem'}}>
                        Add one-off events the AI might not know about, like a new loan, asset purchase, or investor funding.
                    </p>
                    <form onSubmit={handleAddAdjustment} className="manual-adjustments-form" style={{marginTop: '1.5rem'}}>
                        <div className="grid">
                             <div className="form-group" style={{marginBottom: 0}}>
                                <label className="form-label">Date</label>
                                <input type="date" value={newAdjDate} onChange={e => setNewAdjDate(e.target.value)} className="input"/>
                             </div>
                             <div className="form-group" style={{marginBottom: 0}}>
                                <label className="form-label">Description</label>
                                <input type="text" value={newAdjDesc} onChange={e => setNewAdjDesc(e.target.value)} className="input" placeholder="e.g. New Equipment"/>
                             </div>
                             <div className="form-group" style={{marginBottom: 0}}>
                                <label className="form-label">Amount</label>
                                <input type="number" step="100" value={newAdjAmount} onChange={e => setNewAdjAmount(Number(e.target.value))} className="input" placeholder="e.g. -5000"/>
                             </div>
                              <div className="form-group" style={{marginBottom: 0, alignSelf: 'flex-end'}}>
                                <button type="submit" className="button button-primary" style={{width: '100%'}}>Add</button>
                             </div>
                        </div>
                    </form>
                     <div style={{marginTop: '1.5rem'}}>
                        {manualAdjustments.length > 0 && (
                            <ul style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                                {manualAdjustments.map(adj => (
                                    <li key={adj.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: 'var(--color-background)', borderRadius: '6px'}}>
                                        <div>
                                            <div style={{fontWeight: 500}}>{adj.description}</div>
                                            <div style={{fontSize: '0.8rem', color: 'var(--color-text-secondary)'}}>{adj.date}</div>
                                        </div>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                            <span style={{fontFamily: 'monospace', color: adj.amount > 0 ? 'var(--color-success)' : 'var(--color-error)'}}>
                                                {adj.amount.toLocaleString()}
                                            </span>
                                            <button onClick={() => handleRemoveAdjustment(adj.id)} className="button button-tertiary" style={{padding: '0.2rem'}}><TrashIcon style={{width: '14px', height: '14px', color: 'var(--color-error)'}} /></button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </aside>
        </div>
    );
};