import React from 'react';
import { AIAgent } from '../../../types';
import { BotIcon } from '../../icons';

interface AgentMarketplaceProps {
    agents: AIAgent[];
    onUpdateAgent: (agentId: string, isActive: boolean) => void;
}

export const AgentMarketplace: React.FC<AgentMarketplaceProps> = ({ agents, onUpdateAgent }) => {
    return (
        <div>
            <h3 style={{marginTop: '1rem'}}>Available Agents</h3>
            <p style={{color: 'var(--color-text-secondary)', marginTop: '-0.5rem', marginBottom: '1.5rem'}}>
                Activate agents to put them to work. Inactive agents will not perform any actions.
            </p>
            <div className="agent-marketplace-grid">
                {agents.map(agent => (
                    <div key={agent.id} className="agent-card">
                        <div className="agent-card-header">
                            <h3><BotIcon style={{color: agent.isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)'}}/> {agent.name}</h3>
                            <label className="toggle-switch">
                                <input 
                                    type="checkbox" 
                                    checked={agent.isActive} 
                                    onChange={(e) => onUpdateAgent(agent.id, e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <p>{agent.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
