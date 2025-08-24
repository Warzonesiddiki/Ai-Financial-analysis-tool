import React, { useState, useEffect, useMemo } from 'react';
import { Bill, Vendor, BillLineItem, ChartOfAccount, Product, ApprovalStep, PurchaseOrder, TaxCode, Entity, CurrencyExchangeRate } from '../../types';
import { XIcon, TrashIcon, PlusCircleIcon, CheckCircleIcon, ShieldCheckIcon } from '../icons';

interface AddEditBillProps {
    isOpen: boolean;
    vendors: Vendor[];
    chartOfAccounts: ChartOfAccount[];
    products: Product[];
    taxCodes: TaxCode[];
    existingBill: Omit<Bill, 'id'> | Bill | null;
    onSave: (billData: Omit<Bill, 'id'> | Bill) => void;
    onClose: () => void;
    activeEntityId: string;
    entities: Entity[];
    exchangeRates: CurrencyExchangeRate[];
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

export const AddEditBill: React.FC<AddEditBillProps> = ({ isOpen, vendors, chartOfAccounts, products, taxCodes, existingBill, onSave, onClose, activeEntityId, entities, exchangeRates }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [bill, setBill] = useState<Omit<Bill, 'id'>>({
        vendorId: '',
        billDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        lineItems: [{ id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, accountId: '', productId: '' }],
        status: 'Draft',
        approvalHistory: [],
        entityId: activeEntityId,
        currency: entities.find(e => e.id === activeEntityId)?.currency || 'USD',
        exchangeRate: 1,
        baseCurrencyAmount: 0,
    });
    const isEditing = existingBill && 'id' in existingBill;
    const expenseAccounts = chartOfAccounts.filter(acc => acc.type === 'Expense' && !acc.isArchived);
    const activeEntity = entities.find(e => e.id === activeEntityId);
    const baseCurrency = entities.find(e => !e.parentId)?.currency || 'USD';

    useEffect(() => {
        if (isOpen) {
            setActiveTab('details');
            const entityCurrency = activeEntity?.currency || 'USD';
            if (existingBill) {
                setBill(existingBill);
            } else {
                const defaultDueDate = new Date();
                defaultDueDate.setDate(defaultDueDate.getDate() + 30);
                setBill({
                    vendorId: '',
                    billDate: new Date().toISOString().split('T')[0],
                    dueDate: defaultDueDate.toISOString().split('T')[0],
                    lineItems: [{ id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, accountId: '', productId: '' }],
                    status: 'Draft',
                    approvalHistory: [],
                    entityId: activeEntityId,
                    currency: entityCurrency,
                    exchangeRate: 1,
                    baseCurrencyAmount: 0
                });
            }
        }
    }, [existingBill, isOpen, activeEntityId, activeEntity]);
    
    const { subtotal, taxTotal, grandTotal } = useMemo(() => {
        let subtotal = 0;
        let taxTotal = 0;
        bill.lineItems.forEach(item => {
            const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
            subtotal += lineTotal;
            const taxCode = taxCodes.find(tc => tc.id === item.taxCodeId);
            if (taxCode) {
                taxTotal += lineTotal * taxCode.rate;
            }
        });
        return { subtotal, taxTotal, grandTotal: subtotal + taxTotal };
    }, [bill.lineItems, taxCodes]);

    useEffect(() => {
        const rate = exchangeRates.find(r => r.from === bill.currency && r.to === baseCurrency)?.rate || 1;
        setBill(prev => ({
            ...prev,
            exchangeRate: rate,
            baseCurrencyAmount: grandTotal * rate
        }));
    }, [bill.currency, grandTotal, exchangeRates, baseCurrency]);

    const handleInputChange = (field: keyof Omit<Bill, 'lineItems' | 'id'>, value: string) => {
        setBill(prev => ({ ...prev, [field]: value }));
    };

    const handleLineItemChange = (id: string, field: keyof Omit<BillLineItem, 'id'>, value: string | number) => {
        const updatedLineItems = bill.lineItems.map(item => {
            if (item.id === id) {
                 const updatedItem = { ...item, [field]: value };
                 if (field === 'productId') {
                    const product = products.find(p => p.id === value);
                    if (product) {
                        updatedItem.description = product.name;
                        updatedItem.unitPrice = product.purchasePrice;
                    }
                }
                return updatedItem;
            }
            return item;
        });
        setBill(prev => ({ ...prev, lineItems: updatedLineItems }));
    };

    const addLineItem = () => {
        setBill(prev => ({
            ...prev,
            lineItems: [...prev.lineItems, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, accountId: '', productId: '' }],
        }));
    };

    const removeLineItem = (id: string) => {
        setBill(prev => ({
            ...prev,
            lineItems: prev.lineItems.filter(item => item.id !== id),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(isEditing ? { ...bill, id: (existingBill as Bill).id } : bill);
    };

    const formatCurrency = (amount: number, currencyCode: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(amount);
    
    if (!isOpen) return null;

    return (
         <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '900px', maxWidth: '95%', animation: 'fadeIn 0.2s ease-out' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, border: 'none' }}>{isEditing ? `Edit Bill ${existingBill.id}` : 'New Bill'}</h2>
                    <button onClick={onClose} className="button button-tertiary" style={{ padding: '0.5rem' }}><XIcon /></button>
                </div>
                 <div className="tabs">
                    <button onClick={() => setActiveTab('details')} className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}>Details</button>
                    {isEditing && <button onClick={() => setActiveTab('history')} className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}>Approval History</button>}
                </div>
                {activeTab === 'details' ? (
                <form onSubmit={handleSubmit}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem', marginBottom: '1.5rem'}}>
                        <div className="grid grid-cols-2" style={{gap: '1rem'}}>
                            <div className="form-group" style={{marginBottom: 0, width: '300px'}}>
                                <label className="form-label">Vendor</label>
                                <select value={bill.vendorId} onChange={e => handleInputChange('vendorId', e.target.value)} className="input" required>
                                    <option value="" disabled>Select a vendor</option>
                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{marginBottom: 0, width: '150px'}}>
                                <label className="form-label">Currency</label>
                                <select value={bill.currency} onChange={e => handleInputChange('currency', e.target.value)} className="input" required>
                                    <option value="USD">USD</option>
                                    <option value="AED">AED</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            </div>
                        </div>
                        <div style={{textAlign: 'right'}}>
                             <div style={{marginBottom: '1rem'}}>
                                <span style={{color: 'var(--color-text-secondary)'}}>Subtotal: {formatCurrency(subtotal, bill.currency)}</span><br/>
                                <span style={{color: 'var(--color-text-secondary)'}}>Tax: {formatCurrency(taxTotal, bill.currency)}</span>
                                <h3 style={{marginTop: 0}}>Total: {formatCurrency(grandTotal, bill.currency)}</h3>
                            </div>
                             {bill.currency !== baseCurrency && (
                                <p style={{fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '-0.5rem 0 1.5rem 0'}}>
                                    ~ {formatCurrency(bill.baseCurrencyAmount, baseCurrency)} @ {bill.exchangeRate}
                                </p>
                            )}
                            <div className="grid grid-cols-2" style={{gap: '1rem'}}>
                                <div className="form-group" style={{marginBottom: 0}}>
                                    <label className="form-label">Bill Date</label>
                                    <input type="date" value={bill.billDate} onChange={e => handleInputChange('billDate', e.target.value)} className="input" required />
                                </div>
                                <div className="form-group" style={{marginBottom: 0}}>
                                    <label className="form-label">Due Date</label>
                                    <input type="date" value={bill.dueDate} onChange={e => handleInputChange('dueDate', e.target.value)} className="input" required />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="grid" style={{gridTemplateColumns: '2fr 2fr 2fr 1fr 1fr 1.5fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', padding: '0 0.5rem', fontWeight: 500 }}>
                            <span>Product</span>
                            <span>Description</span>
                            <span>Category</span>
                            <span>Qty</span>
                            <span>Price</span>
                            <span>Tax</span>
                            <span style={{textAlign: 'right'}}>Total</span>
                        </div>
                        {bill.lineItems.map((item) => (
                            <div key={item.id} className="grid" style={{gridTemplateColumns: '2fr 2fr 2fr 1fr 1fr 1.5fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center'}}>
                                <select value={item.productId} onChange={e => handleLineItemChange(item.id, 'productId', e.target.value)} className="input">
                                    <option value="">-</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <input type="text" placeholder="Description" value={item.description} onChange={e => handleLineItemChange(item.id, 'description', e.target.value)} className="input" required/>
                                <select value={item.accountId} onChange={e => handleLineItemChange(item.id, 'accountId', e.target.value)} className="input" required>
                                    <option value="" disabled>Select category</option>
                                    {expenseAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                                <input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleLineItemChange(item.id, 'quantity', Number(e.target.value))} className="input"/>
                                <input type="number" placeholder="Price" value={item.unitPrice} onChange={e => handleLineItemChange(item.id, 'unitPrice', Number(e.target.value))} className="input"/>
                                <select value={item.taxCodeId || ''} onChange={e => handleLineItemChange(item.id, 'taxCodeId', e.target.value)} className="input">
                                    <option value="">-</option>
                                    {taxCodes.map(tc => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
                                </select>
                                <input type="text" value={formatCurrency(item.quantity * item.unitPrice, bill.currency)} disabled className="input" style={{textAlign: 'right'}}/>
                                <button type="button" onClick={() => removeLineItem(item.id)} className="button button-tertiary" style={{padding: '0.5rem'}}><TrashIcon style={{width: '16px', height:'16px', color: 'var(--color-error)'}}/></button>
                            </div>
                        ))}
                        <button type="button" onClick={addLineItem} className="button button-tertiary" style={{marginTop: '0.5rem'}}><PlusCircleIcon/> Add Line</button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                         <div className="form-group" style={{marginBottom: 0, width: '200px'}}>
                            <label className="form-label">Status</label>
                            <select value={bill.status} onChange={e => handleInputChange('status', e.target.value)} className="input">
                                <option value="Draft">Draft</option>
                                <option value="Awaiting Approval">Awaiting Approval</option>
                                <option value="Awaiting Payment">Awaiting Payment</option>
                                <option value="Paid">Paid</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" onClick={onClose} className="button button-secondary">Cancel</button>
                            <button type="submit" className="button button-primary">Save Bill</button>
                        </div>
                    </div>
                </form>
                ) : (
                    <div style={{minHeight: '300px', padding: '1rem'}}>
                       <ApprovalHistoryTimeline history={bill.approvalHistory || []} />
                    </div>
                )}
            </div>
        </div>
    );
};