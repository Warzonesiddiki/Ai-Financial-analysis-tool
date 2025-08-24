import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, Customer, InvoiceLineItem, Product, ApprovalStep, TaxCode } from '../../types';
import { XIcon, TrashIcon, PlusCircleIcon, CheckCircleIcon } from '../icons';

interface AddEditInvoiceProps {
    isOpen: boolean;
    customers: Customer[];
    products: Product[];
    taxCodes: TaxCode[];
    existingInvoice: Invoice | null;
    onSave: (invoiceData: Omit<Invoice, 'id'> | Invoice) => void;
    onClose: () => void;
    activeEntityId: string;
}

const ApprovalHistoryTimeline: React.FC<{ history: ApprovalStep[] }> = ({ history }) => {
    if (!history || history.length === 0) {
        return <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No approval history found.</p>;
    }
    return (
        <div className="approval-timeline">
            {history.map((step, index) => (
                <div key={index} className="timeline-item">
                    <div className="timeline-icon">
                        <CheckCircleIcon style={{ color: step.decision === 'Approved' ? 'var(--color-success)' : 'var(--color-text-secondary)' }} />
                    </div>
                    <div className="timeline-content">
                        <p style={{ margin: 0, fontWeight: 600 }}>
                            {step.decision} by {step.approver}
                        </p>
                        <time style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                            {new Date(step.timestamp).toLocaleString()}
                        </time>
                        {step.notes && <p className="notes">Notes: "{step.notes}"</p>}
                    </div>
                </div>
            ))}
        </div>
    );
};

export const AddEditInvoice: React.FC<AddEditInvoiceProps> = ({ isOpen, customers, products, taxCodes, existingInvoice, onSave, onClose, activeEntityId }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [invoice, setInvoice] = useState<Omit<Invoice, 'id'>>({
        customerId: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        lineItems: [{ id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, productId: '' }],
        status: 'Draft',
        entityId: activeEntityId,
        currency: 'USD',
        exchangeRate: 1,
        baseCurrencyAmount: 0,
    });

    useEffect(() => {
        if (isOpen) {
            setActiveTab('details');
            if (existingInvoice) {
                setInvoice(existingInvoice);
            } else {
                const defaultDueDate = new Date();
                defaultDueDate.setDate(defaultDueDate.getDate() + 30);
                setInvoice({
                    customerId: '',
                    invoiceDate: new Date().toISOString().split('T')[0],
                    dueDate: defaultDueDate.toISOString().split('T')[0],
                    lineItems: [{ id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, productId: '' }],
                    status: 'Draft',
                    entityId: activeEntityId,
                    currency: 'USD',
                    exchangeRate: 1,
                    baseCurrencyAmount: 0,
                });
            }
        }
    }, [existingInvoice, isOpen, activeEntityId]);

    const handleInputChange = (field: keyof Omit<Invoice, 'lineItems' | 'id'>, value: string) => {
        setInvoice(prev => ({ ...prev, [field]: value }));
    };

    const handleLineItemChange = (id: string, field: keyof Omit<InvoiceLineItem, 'id'>, value: string | number) => {
        const updatedLineItems = invoice.lineItems.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'productId') {
                    const product = products.find(p => p.id === value);
                    if (product) {
                        updatedItem.description = product.name;
                        updatedItem.unitPrice = product.salePrice;
                    }
                }
                return updatedItem;
            }
            return item;
        });
        setInvoice(prev => ({ ...prev, lineItems: updatedLineItems }));
    };

    const addLineItem = () => {
        setInvoice(prev => ({
            ...prev,
            lineItems: [...prev.lineItems, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, productId: '' }],
        }));
    };

    const removeLineItem = (id: string) => {
        setInvoice(prev => ({
            ...prev,
            lineItems: prev.lineItems.filter(item => item.id !== id),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(existingInvoice ? { ...invoice, id: existingInvoice.id } : invoice);
    };

    const { subtotal, taxTotal, grandTotal } = useMemo(() => {
        let subtotal = 0;
        let taxTotal = 0;
        invoice.lineItems.forEach(item => {
            const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
            subtotal += lineTotal;
            const taxCode = taxCodes.find(tc => tc.id === item.taxCodeId);
            if (taxCode) {
                taxTotal += lineTotal * taxCode.rate;
            }
        });
        return { subtotal, taxTotal, grandTotal: subtotal + taxTotal };
    }, [invoice.lineItems, taxCodes]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    
    useEffect(() => {
        setInvoice(prev => ({
            ...prev,
            baseCurrencyAmount: grandTotal * prev.exchangeRate
        }));
    }, [grandTotal, invoice.exchangeRate]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '900px', maxWidth: '95%', animation: 'fadeIn 0.2s ease-out' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, border: 'none' }}>{existingInvoice ? `Edit Invoice ${existingInvoice.id}` : 'New Invoice'}</h2>
                    <button onClick={onClose} className="button button-tertiary" style={{ padding: '0.5rem' }}><XIcon /></button>
                </div>
                 <div className="tabs">
                    <button onClick={() => setActiveTab('details')} className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}>Details</button>
                    {existingInvoice && <button onClick={() => setActiveTab('history')} className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}>Approval History</button>}
                </div>
                {activeTab === 'details' ? (
                <form onSubmit={handleSubmit}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem', marginBottom: '1.5rem'}}>
                        <div>
                            <div className="form-group" style={{marginBottom: 0, width: '300px'}}>
                                <label className="form-label">Customer</label>
                                <select value={invoice.customerId} onChange={e => handleInputChange('customerId', e.target.value)} className="input" required>
                                    <option value="" disabled>Select a customer</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{textAlign: 'right'}}>
                            <div style={{marginBottom: '1rem'}}>
                                <span style={{color: 'var(--color-text-secondary)'}}>Subtotal: {formatCurrency(subtotal)}</span><br/>
                                <span style={{color: 'var(--color-text-secondary)'}}>Tax: {formatCurrency(taxTotal)}</span>
                                <h3 style={{marginTop: 0}}>Total: {formatCurrency(grandTotal)}</h3>
                            </div>
                            <div className="grid grid-cols-2" style={{gap: '1rem'}}>
                                <div className="form-group" style={{marginBottom: 0}}>
                                    <label className="form-label">Invoice Date</label>
                                    <input type="date" value={invoice.invoiceDate} onChange={e => handleInputChange('invoiceDate', e.target.value)} className="input" required />
                                </div>
                                <div className="form-group" style={{marginBottom: 0}}>
                                    <label className="form-label">Due Date</label>
                                    <input type="date" value={invoice.dueDate} onChange={e => handleInputChange('dueDate', e.target.value)} className="input" required />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="grid" style={{gridTemplateColumns: '2fr 3fr 1fr 1fr 1.5fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', padding: '0 0.5rem', fontWeight: 500 }}>
                            <span>Product</span>
                            <span>Description</span>
                            <span>Qty</span>
                            <span>Price</span>
                            <span>Tax</span>
                            <span style={{textAlign: 'right'}}>Total</span>
                        </div>
                        {invoice.lineItems.map((item) => (
                            <div key={item.id} className="grid" style={{gridTemplateColumns: '2fr 3fr 1fr 1fr 1.5fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center'}}>
                                <select value={item.productId} onChange={e => handleLineItemChange(item.id, 'productId', e.target.value)} className="input">
                                    <option value="">-</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <input type="text" placeholder="Description" value={item.description} onChange={e => handleLineItemChange(item.id, 'description', e.target.value)} className="input" required/>
                                <input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleLineItemChange(item.id, 'quantity', Number(e.target.value))} className="input"/>
                                <input type="number" placeholder="Price" value={item.unitPrice} onChange={e => handleLineItemChange(item.id, 'unitPrice', Number(e.target.value))} className="input"/>
                                <select value={item.taxCodeId || ''} onChange={e => handleLineItemChange(item.id, 'taxCodeId', e.target.value)} className="input">
                                    <option value="">-</option>
                                    {taxCodes.map(tc => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
                                </select>
                                <input type="text" value={formatCurrency(item.quantity * item.unitPrice)} disabled className="input" style={{textAlign: 'right'}}/>
                                <button type="button" onClick={() => removeLineItem(item.id)} className="button button-tertiary" style={{padding: '0.5rem'}}><TrashIcon style={{width: '16px', height:'16px', color: 'var(--color-error)'}}/></button>
                            </div>
                        ))}
                        <button type="button" onClick={addLineItem} className="button button-tertiary" style={{marginTop: '0.5rem'}}><PlusCircleIcon/> Add Line</button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                         <div className="form-group" style={{marginBottom: 0, width: '200px'}}>
                            <label className="form-label">Status</label>
                            <select value={invoice.status} onChange={e => handleInputChange('status', e.target.value)} className="input">
                                <option value="Draft">Draft</option>
                                <option value="Sent">Sent</option>
                                <option value="Paid">Paid</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" onClick={onClose} className="button button-secondary">Cancel</button>
                            <button type="submit" className="button button-primary">Save Invoice</button>
                        </div>
                    </div>
                </form>
                 ) : (
                    <div style={{minHeight: '300px', padding: '1rem'}}>
                        <ApprovalHistoryTimeline history={invoice.approvalHistory || []} />
                    </div>
                )}
            </div>
        </div>
    );
};