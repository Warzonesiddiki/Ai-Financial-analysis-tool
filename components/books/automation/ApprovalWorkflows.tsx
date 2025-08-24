import React from 'react';
import { ApprovalWorkflow } from '../../../types';
import { WorkflowIcon } from '../../icons';

interface ApprovalWorkflowsProps {
    workflows: ApprovalWorkflow[];
}

export const ApprovalWorkflows: React.FC<ApprovalWorkflowsProps> = ({ workflows }) => {

    const formatAmount = (amount?: number) => {
        if (amount === undefined) return 'Unlimited';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    return (
        <div>
            <h3 style={{marginTop: '1.5rem'}}>Active Approval Workflows</h3>
            <p style={{color: 'var(--color-text-secondary)', marginTop: '-0.5rem', marginBottom: '1.5rem'}}>
                These are the rules the system uses to route bills for approval. To edit, please contact your administrator.
            </p>
            <div>
                {workflows.map(workflow => (
                    <div key={workflow.id} className="approval-workflow-card">
                        <header style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                            <WorkflowIcon />
                            <span>{workflow.name}</span>
                        </header>
                        <div>
                            {workflow.rules.map(rule => (
                                <div key={rule.id} className="rule-item">
                                    <div style={{fontWeight: 500}}>
                                        {formatAmount(rule.minAmount)} {rule.maxAmount ? `to ${formatAmount(rule.maxAmount)}` : 'and above'}
                                    </div>
                                    <div style={{color: 'var(--color-text-secondary)'}}>
                                        Requires: <span style={{fontWeight: 600, color: 'var(--color-text)'}}>{rule.requiredApprovers.join(', ')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};