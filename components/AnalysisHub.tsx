import React from 'react';
import { SparklesIcon } from './icons';
import { Spinner } from './Spinner';

interface AnalysisHubProps {
    onGenerate: () => void;
    isLoading: boolean;
    companyName: string;
}

export const AnalysisHub: React.FC<AnalysisHubProps> = ({ onGenerate, isLoading, companyName }) => {
    return (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <SparklesIcon style={{ width: '48px', height: '48px', color: 'var(--color-primary)', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.75rem' }}>AI Financial Analysis Suite</h2>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0.5rem auto 2rem auto' }}>
                Leverage the power of generative AI to create a comprehensive financial narrative for <strong>{companyName}</strong> directly from your live bookkeeping data.
            </p>
            <button
                onClick={onGenerate}
                disabled={isLoading}
                className="button button-primary"
                style={{ minWidth: '300px', padding: '1rem' }}
            >
                {isLoading ? <Spinner /> : <SparklesIcon />}
                <span>{isLoading ? 'Generating Analysis...' : 'Generate AI Analysis from Live Books'}</span>
            </button>
        </div>
    );
};
