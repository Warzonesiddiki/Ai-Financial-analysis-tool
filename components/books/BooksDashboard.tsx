import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Transaction, ChartOfAccount, Budgets, InsightCard, InsightSeverity, Invoice, Bill, InventoryItem } from '../../types';
import { StatCard } from '../StatCard';
import { SparklesIcon, AlertTriangleIcon, TrendingUpIcon, TrendingDownIcon, InfoIcon } from '../icons';
import { Spinner } from '../Spinner';
import { generateBusinessInsights } from '../../services/geminiService';

interface BooksDashboardProps {
    transactions: Transaction[];
    invoices: Invoice[];
    bills: Bill[];
    chartOfAccounts: ChartOfAccount[];
    budgets: Budgets;
    inventory: InventoryItem[];
    navigateTo: (view: string) => void;
    openModal: (type: any, data?: any) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const InsightIcon: React.FC<{ severity: InsightSeverity }> = ({ severity }) => {
    switch (severity) {
        case 'Critical': return <AlertTriangleIcon style={{ color: 'var(--color-error)' }} />;
        case 'Warning': return <TrendingDownIcon style={{ color: '#f59e0b' }}/>;
        case 'Info': return <InfoIcon style={{ color: 'var(--color-primary)' }} />;
        default: return <InfoIcon />;
    }
}

export const BooksDashboard: React.FC<BooksDashboardProps> = ({ transactions, invoices, bills, chartOfAccounts, budgets, inventory, navigateTo }) => {
    const [insights, setInsights] = useState<InsightCard[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const financialMetrics = useMemo(() => {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthTxs = transactions.filter(tx => new Date(tx.date) >= startOfThisMonth);

        const income = thisMonthTxs.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
        const expenses = thisMonthTxs.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0);
        const netProfit = income + expenses;
        return { income, expenses, netProfit };
    }, [transactions]);

    const handleGenerateInsights = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
            const recentTransactions = transactions.filter(tx => tx.date >= thirtyDaysAgo);
            
            const result = await generateBusinessInsights(recentTransactions, invoices, bills, budgets, inventory);
            setInsights(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            setInsights([]);
        } finally {
            setIsLoading(false);
        }
    }, [transactions, invoices, bills, budgets, inventory]);
    
    // Auto-fetch insights on initial load
    useEffect(() => {
        handleGenerateInsights();
    }, [handleGenerateInsights]);

    const severityStyles: Record<InsightSeverity, { borderColor: string, backgroundColor: string }> = {
        'Critical': { borderColor: 'var(--color-error)', backgroundColor: 'rgba(220, 38, 38, 0.05)' },
        'Warning': { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.05)' },
        'Info': { borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)' }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="grid grid-cols-3">
                <StatCard metric={{ label: `This Month's Income`, value: formatCurrency(financialMetrics.income) }} />
                <StatCard metric={{ label: `This Month's Expenses`, value: formatCurrency(financialMetrics.expenses) }} />
                <StatCard metric={{ label: `This Month's Net Profit`, value: formatCurrency(financialMetrics.netProfit), trend: financialMetrics.netProfit >= 0 ? 'positive' : 'negative' }} />
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-primary)' }}>
                        <SparklesIcon style={{ width: '28px', height: '28px' }} />
                        <h2 style={{ margin: 0, border: 'none', color: 'inherit' }}>AI Command Center</h2>
                    </div>
                     <button className="button button-primary" onClick={handleGenerateInsights} disabled={isLoading}>
                        {isLoading ? <Spinner/> : <SparklesIcon />}
                        <span>{isLoading ? 'Analyzing...' : 'Refresh Insights'}</span>
                    </button>
                </div>

                {isLoading && insights.length === 0 ? (
                    <div style={{textAlign: 'center', padding: '3rem 0'}}>
                        <Spinner />
                        <p style={{color: 'var(--color-text-secondary)', marginTop: '1rem', fontWeight: 500}}>
                            Analyzing your business data...
                        </p>
                    </div>
                ) : error ? (
                    <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <AlertTriangleIcon style={{ flexShrink: 0, width: '20px', height: '20px' }} />
                        <p style={{ margin: 0, fontWeight: 500 }}>{error}</p>
                    </div>
                ) : insights.length > 0 ? (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                        {insights.map((insight, index) => (
                            <div key={index} 
                                 className="card"
                                 onClick={() => insight.link && navigateTo(insight.link)}
                                 style={{
                                    borderLeft: `5px solid ${severityStyles[insight.severity].borderColor}`,
                                    backgroundColor: severityStyles[insight.severity].backgroundColor,
                                    cursor: insight.link ? 'pointer' : 'default',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                 }}
                                 onMouseOver={e => { if(insight.link) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}}
                                 onMouseOut={e => { if(insight.link) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-md)';}}}
                            >
                                <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem'}}>
                                    <InsightIcon severity={insight.severity} />
                                    <h4 style={{margin: 0, color: severityStyles[insight.severity].borderColor}}>{insight.title}</h4>
                                </div>
                                <p style={{margin: 0, color: 'var(--color-text-secondary)', paddingLeft: '2.25rem'}}>{insight.description}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{textAlign: 'center', padding: '3rem 0', border: '2px dashed var(--color-border)', borderRadius: '8px'}}>
                        <p style={{color: 'var(--color-text-secondary)', fontWeight: 500}}>
                            No critical insights found at the moment.
                        </p>
                        <p style={{color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem'}}>
                            Click "Refresh Insights" to run a new analysis.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};