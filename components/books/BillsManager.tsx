import React, { useMemo } from 'react';
import { Bill, Vendor } from '../../types';
import { PlusCircleIcon, LinkIcon } from '../icons';

interface BillsManagerProps {
    bills: Bill[];
    vendors: Vendor[];
    chartOfAccounts: any;
    products: any;
    onUpdate?: (bill: Bill) => void;
    onDelete: (id: string) => void;
    onEdit: (bill: Bill) => void;
    onAddNew: () => void;
    onApproveOrReject: (bill: Bill) => void;
}

export const BillsManager: React.FC<BillsManagerProps> = ({ bills, vendors, onDelete, onEdit, onAddNew, onApproveOrReject }) => {
    
    const sortedBills = useMemo(() => {
        return [...bills].sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());
    }, [bills]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const getStatusBadge = (status: Bill['status']) => {
        const styles: { [key in Bill['status']]: React.CSSProperties } = {
            Draft: { backgroundColor: 'var(--color-border)', color: 'var(--color-text-secondary)'},
            'Awaiting Approval': { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
            'Awaiting Payment': { backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' },
            'Processing Payment': { backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' },
            Paid: { backgroundColor: 'rgba(22, 163, 74, 0.1)', color: 'var(--color-success)' },
            Overdue: { backgroundColor: 'rgba(220, 38, 38, 0.1)', color: 'var(--color-error)' },
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
                <h2 style={{ margin: 0, border: 'none' }}>Bills</h2>
                <button onClick={onAddNew} className="button button-primary">
                    <PlusCircleIcon /> New Bill
                </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Number</th>
                            <th style={{ padding: '0.75rem' }}>Vendor</th>
                            <th style={{ padding: '0.75rem' }}>Date</th>
                            <th style={{ padding: '0.75rem' }}>Due Date</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
                            <th style={{ padding: '0.75rem' }}>Status</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedBills.length === 0 ? (
                             <tr><td colSpan={7} style={{textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)'}}>No bills yet.</td></tr>
                        ) : sortedBills.map(bill => {
                            const vendor = vendors.find(c => c.id === bill.vendorId);
                            const total = bill.lineItems.reduce((sum, item) => {
                                const taxRate = 0; // Simplified
                                const itemTotal = item.quantity * item.unitPrice;
                                return sum + itemTotal * (1 + taxRate);
                            }, 0);
                            const canReview = bill.status === 'Awaiting Approval';
                            return (
                                <tr key={bill.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.2s ease', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--color-background)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--color-primary)' }} onClick={() => onEdit(bill)}>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                            {bill.purchaseOrderId && <span title={`From PO ${bill.purchaseOrderId}`}><LinkIcon style={{width: '14px', height: '14px'}}/></span>}
                                            <span>{bill.id}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.75rem' }} onClick={() => onEdit(bill)}>{vendor?.name || 'N/A'}</td>
                                    <td style={{ padding: '0.75rem' }} onClick={() => onEdit(bill)}>{bill.billDate}</td>
                                    <td style={{ padding: '0.75rem' }} onClick={() => onEdit(bill)}>{bill.dueDate}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace' }} onClick={() => onEdit(bill)}>{formatCurrency(total)}</td>
                                    <td style={{ padding: '0.75rem' }} onClick={() => onEdit(bill)}>{getStatusBadge(bill.status)}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                        {canReview && (
                                            <button onClick={() => onApproveOrReject(bill)} className="button button-secondary">
                                                Review
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