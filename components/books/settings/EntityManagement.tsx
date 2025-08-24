import React from 'react';
import { Entity } from '../../../types';
import { Building2Icon } from '../../icons';

interface EntityManagementProps {
    entities: Entity[];
}

export const EntityManagement: React.FC<EntityManagementProps> = ({ entities }) => {
    
    const parentEntity = entities.find(e => !e.parentId);
    const subsidiaries = entities.filter(e => e.parentId);

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <Building2Icon style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
                <h2 style={{ margin: 0, border: 'none' }}>Entity Management</h2>
            </div>
            <p style={{color: 'var(--color-text-secondary)', marginTop: 0}}>
                Manage your company's legal and organizational structure. (Read-only view)
            </p>
            
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Entity Name</th>
                            <th style={{ padding: '0.75rem' }}>Type</th>
                            <th style={{ padding: '0.75rem' }}>Default Currency</th>
                            <th style={{ padding: '0.75rem' }}>Tax Jurisdiction</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parentEntity && (
                            <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{parentEntity.name}</td>
                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>Parent Company</td>
                                <td style={{ padding: '0.75rem' }}>{parentEntity.currency}</td>
                                <td style={{ padding: '0.75rem' }}>{parentEntity.taxJurisdiction}</td>
                            </tr>
                        )}
                        {subsidiaries.map(entity => (
                             <tr key={entity.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '0.75rem', paddingLeft: '2rem' }}>{entity.name}</td>
                                <td style={{ padding: '0.75rem' }}>Subsidiary</td>
                                <td style={{ padding: '0.75rem' }}>{entity.currency}</td>
                                <td style={{ padding: '0.75rem' }}>{entity.taxJurisdiction}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};