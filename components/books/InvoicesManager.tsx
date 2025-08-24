

import React, { useMemo } from 'react';
import { Invoice, Customer, Product } from '../../types';
import { PlusCircleIcon } from '../icons';

interface InvoicesManagerProps {
    invoices: Invoice[];
    customers: Customer[];
    products: Product[];
    onDelete: (id: string) => void;
    onEdit: (invoice: Invoice) => void;
    onAddNew: () => void;
    onRecordPayment: (invoice: Invoice) => void;
}

export const InvoicesManager: React.FC<InvoicesManagerProps> = ({ invoices, customers, products, onDelete, onEdit, onAddNew, onRecordPayment }) => {
    
    const sortedInvoices = useMemo(() => {
        return [...invoices].sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
    }, [invoices]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const getStatusBadge = (status: Invoice['status']) => {
        const styles: { [key in Invoice['status']]: React.CSSProperties } = {
            Draft: { backgroundColor: 'var(--color-border)', color: 'var(--color-text-secondary)'},
            Sent: { backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' },
            'Partially Paid': { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
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
                <h2 style={{ margin: 0, border: 'none' }}>Invoices</h2>
                <button onClick={onAddNew} className="button button-primary">
                    <PlusCircleIcon /> New Invoice
                </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Number</th>
                            <th style={{ padding: '0.75rem' }}>Customer</th>
                            <th style={{ padding: '0.75rem' }}>Date</th>
                            <th style={{ padding: '0.75rem' }}>Due Date</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount Due</th>
                            <th style={{ padding: '0.75rem' }}>Status</th>
                            <th style={{ padding: '0.75rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedInvoices.length === 0 ? (
                             <tr><td colSpan={8} style={{textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)'}}>No invoices yet.</td></tr>
                        ) : sortedInvoices.map(invoice => {
                            const customer = customers.find(c => c.id === invoice.customerId);
                            const total = invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
                            const amountPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                            const amountDue = total - amountPaid;
                            return (
                                <tr key={invoice.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.2s ease' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--color-background)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <td onClick={() => onEdit(invoice)} style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', cursor: 'pointer' }}>{invoice.id}</td>
                                    <td onClick={() => onEdit(invoice)} style={{ padding: '0.75rem', cursor: 'pointer' }}>{customer?.name || 'N/A'}</td>
                                    <td onClick={() => onEdit(invoice)} style={{ padding: '0.75rem', cursor: 'pointer' }}>{invoice.invoiceDate}</td>
                                    <td onClick={() => onEdit(invoice)} style={{ padding: '0.75rem', cursor: 'pointer' }}>{invoice.dueDate}</td>
                                    <td onClick={() => onEdit(invoice)} style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', cursor: 'pointer' }}>{formatCurrency(total)}</td>
                                    <td onClick={() => onEdit(invoice)} style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', cursor: 'pointer', fontWeight: 600 }}>{formatCurrency(amountDue)}</td>
                                    <td onClick={() => onEdit(invoice)} style={{ padding: '0.75rem', cursor: 'pointer' }}>{getStatusBadge(invoice.status)}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {['Sent', 'Overdue', 'Partially Paid'].includes(invoice.status) && (
                                            <button onClick={() => onRecordPayment(invoice)} className="button button-secondary">
                                                Record Payment
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