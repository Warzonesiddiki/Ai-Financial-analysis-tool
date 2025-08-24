

import React, { useState, useEffect } from 'react';
import { Transaction, KPIDeepDiveResponse } from '../../types';
import { generateKPIDeepDive } from '../../services/geminiService';
import { XIcon, SparklesIcon, AlertTriangleIcon } from '../icons';
import { Spinner } from '../Spinner';
import { SimpleBarChart } from '../charts/SimpleBarChart';
import { SimplePieChart } from '../charts/SimplePieChart';
import { SimpleLineChart } from '../charts/SimpleLineChart';
import { SimpleWaterfallChart } from '../charts/SimpleWaterfallChart';

interface KPIDeepDiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    data: Transaction[];
}

export const KPIDeepDiveModal: React.FC<KPIDeepDiveModalProps> = ({ isOpen, onClose, title, data }) => {
    const [analysis, setAnalysis] = useState<KPIDeepDiveResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchAnalysis = async () => {
                setIsLoading(true);
                setError(null);
                setAnalysis(null);
                try {
                    const result = await generateKPIDeepDive(title, data);
                    setAnalysis(result);
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to generate analysis.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAnalysis();
        }
    }, [isOpen, title, data]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                    <Spinner />
                    <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>AI is analyzing the drivers for {title}...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', textAlign: 'center' }}>
                    <AlertTriangleIcon style={{ width: '48px', height: '48px', color: 'var(--color-error)' }} />
                    <h3 style={{ marginTop: '1rem' }}>Analysis Failed</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
                </div>
            );
        }

        if (analysis) {
            const { narrative, chart } = analysis;
            return (
                <div>
                    <div style={{ backgroundColor: 'var(--color-primary-light)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
                        <h4 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                            <SparklesIcon /> AI Insight
                        </h4>
                        <p style={{ margin: 0, color: 'var(--color-text)' }}>{narrative}</p>
                    </div>
                    <div className="chart-container">
                        {chart.type === 'bar' && <SimpleBarChart data={chart.data} currency="USD" />}
                        {chart.type === 'pie' && <SimplePieChart data={chart.data} currency="USD" />}
                        {chart.type === 'line' && <SimpleLineChart data={chart.data} currency="USD" />}
                        {chart.type === 'waterfall' && <SimpleWaterfallChart data={chart.data} currency="USD" />}
                    </div>
                </div>
            );
        }

        return null;
    };


    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card kpi-deep-dive-modal" style={{ width: '600px', maxWidth: '90%', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, border: 'none' }}>Deep Dive: {title}</h2>
                    <button onClick={onClose} className="button button-tertiary" style={{ padding: '0.5rem' }}><XIcon /></button>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};