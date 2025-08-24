
import React, { useState, useEffect, useCallback } from 'react';
import { BankTransaction, ChartOfAccount, AIBankFeedInsight } from '../../../types';
import { analyzeBankFeed } from '../../../services/geminiService';
import { Spinner } from '../../Spinner';
import { LightbulbIcon, PlusCircleIcon } from '../../icons';

interface AIAnalysisTabProps {
    unreconciledTxs: BankTransaction[];
    chartOfAccounts: ChartOfAccount[];
}

export const AIAnalysisTab: React.FC<AIAnalysisTabProps> = ({ unreconciledTxs, chartOfAccounts }) => {
    const [insights, setInsights] = useState<AIBankFeedInsight[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runAnalysis = useCallback(async () => {
        if (unreconciledTxs.length === 0) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await analyzeBankFeed(unreconciledTxs, chartOfAccounts);
            setInsights(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to run analysis.");
        } finally {
            setIsLoading(false);
        }
    }, [unreconciledTxs, chartOfAccounts]);
    
    useEffect(() => {
        runAnalysis();
    }, [runAnalysis]);

    if (isLoading) {
        return <div style={{textAlign: 'center', padding: '3rem'}}><Spinner/> <p>Analyzing your bank feed for patterns...</p></div>;
    }
    
    if (error) {
         return <div style={{textAlign: 'center', padding: '3rem', color: 'var(--color-error)'}}>{error}</div>;
    }

    if (insights.length === 0) {
        return <div style={{textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)'}}>No specific automation suggestions found at this time.</div>;
    }

    return (
        <div style={{padding: '1.5rem'}}>
            <h3 style={{marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                <LightbulbIcon style={{color: 'var(--color-primary)'}}/>
                AI Automation Suggestions
            </h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                {insights.map(insight => (
                    <div key={insight.id} className="ai-insight-card">
                        <h4>{insight.title}</h4>
                        <p>{insight.description}</p>
                        <div style={{marginTop: '1rem', display: 'flex', justifyContent: 'flex-end'}}>
                            {insight.type === 'CREATE_RULE' && (
                                <button className="button button-primary">
                                    <PlusCircleIcon /> Create Rule
                                </button>
                            )}
                            {insight.type === 'RECURRING_PAYMENT' && (
                                <button className="button button-primary">
                                    <PlusCircleIcon /> Create Recurring
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
