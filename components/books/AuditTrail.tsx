import React from 'react';
import { ActivityLogEntry } from '../../types';
import { HistoryIcon, PlusCircleIcon, EditIcon, TrashIcon } from '../icons';

interface AuditTrailProps {
    activityLog: ActivityLogEntry[];
}

const ActionIcon: React.FC<{ action: ActivityLogEntry['action'] }> = ({ action }) => {
    switch (action) {
        case 'create':
            return <PlusCircleIcon style={{ color: 'var(--color-success)', width: '18px', height: '18px' }} />;
        case 'update':
            return <EditIcon style={{ color: '#f59e0b', width: '18px', height: '18px' }} />;
        case 'delete':
            return <TrashIcon style={{ color: 'var(--color-error)', width: '18px', height: '18px' }} />;
        default:
            return null;
    }
};

export const AuditTrail: React.FC<AuditTrailProps> = ({ activityLog }) => {
    
    const formatTimestamp = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <HistoryIcon style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
                <h2 style={{ margin: 0, border: 'none' }}>Activity Audit Trail</h2>
            </div>
            <p style={{color: 'var(--color-text-secondary)', marginTop: 0}}>
                A complete history of all changes made in the bookkeeping module.
            </p>

            {activityLog.length === 0 ? (
                <div style={{textAlign: 'center', padding: '2rem', border: '2px dashed var(--color-border)', borderRadius: '8px'}}>
                    <p style={{color: 'var(--color-text-secondary)', fontWeight: 500}}>No activity has been recorded yet.</p>
                </div>
            ) : (
                <div style={{ maxHeight: '60vh', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead style={{position: 'sticky', top: 0, backgroundColor: 'var(--color-background)'}}>
                            <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem', width: '200px' }}>Timestamp</th>
                                <th style={{ padding: '0.75rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activityLog.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '0.75rem', color: 'var(--color-text-secondary)', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                                        {formatTimestamp(log.timestamp)}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <div style={{display: 'flex', alignItems: 'flex-start', gap: '0.75rem'}}>
                                            <div style={{marginTop: '2px'}}><ActionIcon action={log.action} /></div>
                                            <p style={{margin: 0, lineHeight: 1.5}}>{log.description}</p>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};