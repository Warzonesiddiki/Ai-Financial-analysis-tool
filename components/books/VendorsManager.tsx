
import React from 'react';
import { Vendor } from '../../types';
import { PlusCircleIcon, EditIcon, TrashIcon } from '../icons';

interface VendorsManagerProps {
    vendors: Vendor[];
    onDelete: (id: string) => void;
    onEdit: (vendor: Vendor) => void;
    onAddNew: () => void;
}

export const VendorsManager: React.FC<VendorsManagerProps> = ({ vendors, onDelete, onEdit, onAddNew }) => {

    const handleDeleteVendor = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this vendor? This cannot be undone.")) {
            onDelete(id);
        }
    };
    
    const handleEditVendor = (e: React.MouseEvent, vendor: Vendor) => {
        e.stopPropagation();
        onEdit(vendor);
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, border: 'none' }}>Vendors</h2>
                <button onClick={onAddNew} className="button button-primary">
                    <PlusCircleIcon /> New Vendor
                </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Name</th>
                            <th style={{ padding: '0.75rem' }}>Email</th>
                            <th style={{ padding: '0.75rem' }}>Address</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                         {vendors.length === 0 ? (
                             <tr><td colSpan={4} style={{textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)'}}>No vendors yet.</td></tr>
                        ) : vendors.map(vendor => (
                            <tr key={vendor.id} onClick={(e) => handleEditVendor(e, vendor)} style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background-color 0.2s ease' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--color-background)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{vendor.name}</td>
                                <td style={{ padding: '0.75rem' }}>{vendor.email}</td>
                                <td style={{ padding: '0.75rem' }}>{vendor.address}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                        <button onClick={(e) => handleEditVendor(e, vendor)} className="button button-tertiary" style={{ padding: '0.5rem' }}><EditIcon width="16" /></button>
                                        <button onClick={(e) => handleDeleteVendor(e, vendor.id)} className="button button-tertiary" style={{ padding: '0.5rem' }}><TrashIcon width="16" style={{color: 'var(--color-error)'}}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
