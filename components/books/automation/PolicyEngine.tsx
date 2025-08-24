import React from 'react';
import { AIPolicy } from '../../../types';
import { ShieldCheckIcon } from '../../icons';

interface PolicyEngineProps {
    policies: AIPolicy[];
    onUpdatePolicy: (policyId: AIPolicy['id'], value: number) => void;
}

export const PolicyEngine: React.FC<PolicyEngineProps> = ({ policies, onUpdatePolicy }) => {
    
    const formatValue = (value: number, type: 'percentage' | 'currency') => {
        if (type === 'percentage') return `${value}%`;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    };

    return (
        <div>
            <h3 style={{marginTop: '1rem'}}>AI Governance Policies</h3>
            <p style={{color: 'var(--color-text-secondary)', marginTop: '-0.5rem', marginBottom: '1.5rem'}}>
                Set global rules and thresholds to control how your AI agents operate.
            </p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                {policies.map(policy => (
                    <div key={policy.id} className="policy-item">
                        <div>
                            <h4 style={{margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                <ShieldCheckIcon style={{color: 'var(--color-text-secondary)'}}/>
                                {policy.name}
                            </h4>
                            <p style={{margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)'}}>{policy.description}</p>
                        </div>
                        <div className="policy-item-control">
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem'}}>
                                <label className="form-label" style={{marginBottom: 0}}>Set Value</label>
                                <span style={{fontWeight: 700, color: 'var(--color-primary)'}}>{formatValue(policy.value, policy.type)}</span>
                            </div>
                            <input 
                                type="range" 
                                min={policy.type === 'percentage' ? 50 : 0} 
                                max={policy.type === 'percentage' ? 100 : 5000} 
                                step={policy.type === 'percentage' ? 1 : 50}
                                value={policy.value} 
                                onChange={(e) => onUpdatePolicy(policy.id, Number(e.target.value))}
                                style={{width: '100%'}}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
