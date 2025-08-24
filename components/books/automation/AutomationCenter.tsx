import React, { useState } from 'react';
import { AIAgent, AIPolicy, ApprovalWorkflow } from '../../../types';
import { AgentMarketplace } from './AgentMarketplace';
import { PolicyEngine } from './PolicyEngine';
import { ApprovalWorkflows } from './ApprovalWorkflows';
import { BotIcon } from '../../icons';

interface AutomationCenterProps {
    agents: AIAgent[];
    policies: AIPolicy[];
    approvalWorkflows: ApprovalWorkflow[];
    onUpdateAgent: (agentId: string, isActive: boolean) => void;
    onUpdatePolicy: (policyId: AIPolicy['id'], value: number) => void;
}

export const AutomationCenter: React.FC<AutomationCenterProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'agents' | 'policies' | 'workflows'>('agents');

    return (
        <div className="card">
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <BotIcon style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
                <h2 style={{ margin: 0, border: 'none' }}>AI & Automation Center</h2>
            </div>
             <p style={{color: 'var(--color-text-secondary)', marginTop: 0, marginBottom: '1rem'}}>
                Configure and manage the AI agents and workflows that automate your bookkeeping tasks.
            </p>
            <div className="tabs">
                <button 
                    onClick={() => setActiveTab('agents')} 
                    className={`tab-button ${activeTab === 'agents' ? 'active' : ''}`}
                >
                    Agent Marketplace
                </button>
                <button 
                    onClick={() => setActiveTab('policies')} 
                    className={`tab-button ${activeTab === 'policies' ? 'active' : ''}`}
                >
                    Policy Engine
                </button>
                <button 
                    onClick={() => setActiveTab('workflows')} 
                    className={`tab-button ${activeTab === 'workflows' ? 'active' : ''}`}
                >
                    Approval Workflows
                </button>
            </div>
            <div className="tab-content" style={{paddingTop: 0}}>
                {activeTab === 'agents' && (
                    <AgentMarketplace agents={props.agents} onUpdateAgent={props.onUpdateAgent} />
                )}
                {activeTab === 'policies' && (
                    <PolicyEngine policies={props.policies} onUpdatePolicy={props.onUpdatePolicy} />
                )}
                {activeTab === 'workflows' && (
                    <ApprovalWorkflows workflows={props.approvalWorkflows} />
                )}
            </div>
        </div>
    );
};