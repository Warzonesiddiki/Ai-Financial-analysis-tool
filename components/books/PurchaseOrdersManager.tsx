import React, { useMemo } from 'react';
import { PurchaseOrder, Vendor } from '../../types';
import { PlusCircleIcon } from '../icons';

interface PurchaseOrdersManagerProps {
    purchaseOrders: PurchaseOrder[];
    vendors: Vendor[];
    onEdit: (po: PurchaseOrder) => void;
    onAddNew: () => void;
    onApproveOrReject: (po: PurchaseOrder) => void;
    onConvertToBill: (po: PurchaseOrder) => void;
    onReceiveItems: (po: PurchaseOrder) => void;
}

export const PurchaseOrdersManager: React.FC<PurchaseOrdersManagerProps> = ({ purchaseOrders, vendors, onEdit, onAddNew, onApproveOrReject, onConvertToBill, onReceiveItems }) => {
    
    const sortedPOs = useMemo(() => {
        return [...purchaseOrders].sort((a, b) => new Date(b.poDate).getTime() - new Date(a.poDate).getTime());
    }, [purchaseOrders]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const getStatusBadge = (status: PurchaseOrder['status']) => {
        const styles: { [key in PurchaseOrder['status']]: React.CSSProperties } = {
            Draft: { backgroundColor: 'var(--color-border)', color: 'var(--color-text-secondary)'},
            'Awaiting Approval': { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
            Approved: { backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' },
            'Partially Received': { backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' },
            'Fully Received': { backgroundColor: 'rgba(22, 163, 74, 0.1)', color: 'var(--color-success)' },
            Closed: { backgroundColor: 'rgba(22, 163, 74, 0.1)', color: 'var(--color-success)' },
            Rejected: { backgroundColor: 'rgba(220, 38, 38, 0.1)', color: 'var(--color-error)' },
        };
        return (
            <span style={{
                padding: '4px 10px',
                borderRadius: '99px',
                fontSize: '0.75rem',
                fontWeight: 600,
                ...styles[status]
            }}>
                {status}
            </span>
        );
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, border: 'none' }}>Purchase Orders</h2>
                <button onClick={onAddNew} className="button button-primary">
                    <PlusCircleIcon /> New Purchase Order
                </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Number</th>
                            <th style={{ padding: '0.75rem' }}>Vendor</th>
                            <th style={{ padding: '0.75rem' }}>Date</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
                            <th style={{ padding: '0.75rem' }}>Status</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedPOs.length === 0 ? (
                             <tr><td colSpan={6} style={{textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)'}}>No purchase orders yet.</td></tr>
                        ) : sortedPOs.map(po => {
                            const vendor = vendors.find(v => v.id === po.vendorId);
                            const total = po.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
                            return (
                                <tr key={po.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.2s ease' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--color-background)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', cursor: 'pointer' }} onClick={() => onEdit(po)}>{po.id}</td>
                                    <td style={{ padding: '0.75rem', cursor: 'pointer' }} onClick={() => onEdit(po)}>{vendor?.name || 'N/A'}</td>
                                    <td style={{ padding: '0.75rem', cursor: 'pointer' }} onClick={() => onEdit(po)}>{po.poDate}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', cursor: 'pointer' }} onClick={() => onEdit(po)}>{formatCurrency(total)}</td>
                                    <td style={{ padding: '0.75rem', cursor: 'pointer' }} onClick={() => onEdit(po)}>{getStatusBadge(po.status)}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                        {po.status === 'Awaiting Approval' && (
                                            <button onClick={() => onApproveOrReject(po)} className="button button-secondary">
                                                Review
                                            </button>
                                        )}
                                        {(po.status === 'Approved' || po.status === 'Partially Received') && (
                                            <button onClick={() => onReceiveItems(po)} className="button button-primary">
                                                Receive Items
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};