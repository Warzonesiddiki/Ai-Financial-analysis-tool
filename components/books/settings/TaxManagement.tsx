import React from 'react';
import { TaxCode } from '../../../types';
import { PercentCircleIcon } from '../../icons';

interface TaxManagementProps {
    taxCodes: TaxCode[];
}

export const TaxManagement: React.FC<TaxManagementProps> = ({ taxCodes }) => {

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <PercentCircleIcon style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
                <h2 style={{ margin: 0, border: 'none' }}>Tax Code Management</h2>
            </div>
            <p style={{color: 'var(--color-text-secondary)', marginTop: 0}}>
                Manage tax codes for different jurisdictions. (Read-only view)
            </p>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Tax Code Name</th>
                            <th style={{ padding: '0.75rem' }}>Rate</th>
                            <th style={{ padding: '0.75rem' }}>Jurisdiction</th>
                        </tr>
                    </thead>
                    <tbody>
                        {taxCodes.map(code => (
                            <tr key={code.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{code.name}</td>
                                <td style={{ padding: '0.75rem' }}>{(code.rate * 100).toFixed(2)}%</td>
                                <td style={{ padding: '0.75rem' }}>{code.jurisdiction}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};