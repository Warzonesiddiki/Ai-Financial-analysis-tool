import React from 'react';
import { Location } from '../../../types';
import { PlusCircleIcon, EditIcon, WarehouseIcon } from '../../icons';

interface LocationManagementProps {
    locations: Location[];
    onEdit: (location: Location) => void;
    onAddNew: () => void;
}

export const LocationManagement: React.FC<LocationManagementProps> = ({ locations, onEdit, onAddNew }) => {

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <WarehouseIcon style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
                    <h2 style={{ margin: 0, border: 'none' }}>Inventory Locations</h2>
                </div>
                <button onClick={onAddNew} className="button button-primary">
                    <PlusCircleIcon /> New Location
                </button>
            </div>
             <p style={{color: 'var(--color-text-secondary)', marginTop: 0}}>
                Manage the physical locations where you store inventory, such as warehouses or retail stores.
            </p>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Name</th>
                            <th style={{ padding: '0.75rem' }}>Address</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                         {locations.length === 0 ? (
                             <tr><td colSpan={3} style={{textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)'}}>No locations created yet.</td></tr>
                        ) : locations.map(location => (
                            <tr key={location.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{location.name}</td>
                                <td style={{ padding: '0.75rem' }}>{location.address}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                    <button onClick={() => onEdit(location)} className="button button-tertiary" style={{ padding: '0.5rem' }}><EditIcon width="16" /> Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
