import React, { useState, useEffect, useMemo } from 'react';
import { PurchaseOrder, Vendor, PurchaseOrderLineItem, ChartOfAccount, Product, TaxCode } from '../../types';
import { XIcon, TrashIcon, PlusCircleIcon } from '../icons';

interface AddEditPurchaseOrderModalProps {
    isOpen: boolean;
    vendors: Vendor[];
    chartOfAccounts: ChartOfAccount[];
    products: Product[];
    existingPurchaseOrder: PurchaseOrder | null;
    onSave: (poData: Omit<PurchaseOrder, 'id'> | PurchaseOrder) => void;
    onClose: () => void;
    activeEntityId: string;
}

export const AddEditPurchaseOrderModal: React.FC<AddEditPurchaseOrderModalProps> = ({ isOpen, vendors, chartOfAccounts, products, existingPurchaseOrder, onSave, onClose, activeEntityId }) => {
    const [po, setPo] = useState<Omit<PurchaseOrder, 'id'>>({
        vendorId: '',
        poDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        lineItems: [{ id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, accountId: '', productId: '' }],
        status: 'Draft',
        entityId: activeEntityId,
        currency: 'USD',
        exchangeRate: 1,
        baseCurrencyAmount: 0,
    });

    const expenseAccounts = chartOfAccounts.filter(acc => acc.type === 'Expense' && !acc.isArchived);

    useEffect(() => {
        if (isOpen) {
            if (existingPurchaseOrder) {
                setPo(existingPurchaseOrder);
            } else {
                const defaultDeliveryDate = new Date();
                defaultDeliveryDate.setDate(defaultDeliveryDate.getDate() + 14);
                setPo({
                    vendorId: '',
                    poDate: new Date().toISOString().split('T')[0],
                    deliveryDate: defaultDeliveryDate.toISOString().split('T')[0],
                    lineItems: [{ id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, accountId: '', productId: '' }],
                    status: 'Draft',
                    entityId: activeEntityId,
                    currency: 'USD',
                    exchangeRate: 1,
                    baseCurrencyAmount: 0,
                });
            }
        }
    }, [existingPurchaseOrder, isOpen, activeEntityId]);

    const handleInputChange = (field: keyof Omit<PurchaseOrder, 'lineItems' | 'id'>, value: string) => {
        setPo(prev => ({ ...prev, [field]: value }));
    };

    const handleLineItemChange = (id: string, field: keyof Omit<PurchaseOrderLineItem, 'id'>, value: string | number) => {
        const updatedLineItems = po.lineItems.map(item => {
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
        setPo(prev => ({ ...prev, lineItems: updatedLineItems }));
    };

    const addLineItem = () => {
        setPo(prev => ({
            ...prev,
            lineItems: [...prev.lineItems, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, accountId: '', productId: '' }],
        }));
    };

    const removeLineItem = (id: string) => {
        setPo(prev => ({
            ...prev,
            lineItems: prev.lineItems.filter(item => item.id !== id),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(existingPurchaseOrder ? { ...po, id: existingPurchaseOrder.id } : po);
    };

    const totalAmount = useMemo(() => po.lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0), [po.lineItems]);
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    
    useEffect(() => {
        setPo(prev => ({
            ...prev,
            baseCurrencyAmount: totalAmount * (prev.exchangeRate || 1)
        }));
    }, [totalAmount, po.exchangeRate]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '900px', maxWidth: '95%', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, border: 'none' }}>{existingPurchaseOrder ? `Edit PO ${existingPurchaseOrder.id}` : 'New Purchase Order'}</h2>
                    <button onClick={onClose} className="button button-tertiary" style={{ padding: '0.5rem' }}><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem', marginBottom: '1.5rem'}}>
                        <div>
                            <div className="form-group" style={{marginBottom: 0, width: '300px'}}>
                                <label className="form-label">Vendor</label>
                                <select value={po.vendorId} onChange={e => handleInputChange('vendorId', e.target.value)} className="input" required>
                                    <option value="" disabled>Select a vendor</option>
                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{textAlign: 'right'}}>
                            <h3 style={{marginTop: 0}}>{formatCurrency(totalAmount)}</h3>
                            <div className="grid grid-cols-2" style={{gap: '1rem', marginTop: '1.5rem'}}>
                                <div className="form-group" style={{marginBottom: 0}}>
                                    <label className="form-label">PO Date</label>
                                    <input type="date" value={po.poDate} onChange={e => handleInputChange('poDate', e.target.value)} className="input" required />
                                </div>
                                <div className="form-group" style={{marginBottom: 0}}>
                                    <label className="form-label">Delivery Date</label>
                                    <input type="date" value={po.deliveryDate} onChange={e => handleInputChange('deliveryDate', e.target.value)} className="input" required />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="grid" style={{gridTemplateColumns: '2fr 2fr 2fr 1fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', padding: '0 0.5rem', fontWeight: 500 }}>
                            <span>Product</span>
                            <span>Description</span>
                            <span>Category</span>
                            <span>Qty</span>
                            <span>Price</span>
                            <span style={{textAlign: 'right'}}>Total</span>
                        </div>
                        {po.lineItems.map((item) => (
                            <div key={item.id} className="grid" style={{gridTemplateColumns: '2fr 2fr 2fr 1fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center'}}>
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
                                <input type="text" value={formatCurrency(item.quantity * item.unitPrice)} disabled className="input" style={{textAlign: 'right'}}/>
                                <button type="button" onClick={() => removeLineItem(item.id)} className="button button-tertiary" style={{padding: '0.5rem'}}><TrashIcon style={{width: '16px', height:'16px', color: 'var(--color-error)'}}/></button>
                            </div>
                        ))}
                        <button type="button" onClick={addLineItem} className="button button-tertiary" style={{marginTop: '0.5rem'}}><PlusCircleIcon/> Add Line</button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                         <div className="form-group" style={{marginBottom: 0, width: '200px'}}>
                            <label className="form-label">Status</label>
                            <select value={po.status} onChange={e => handleInputChange('status', e.target.value)} className="input">
                                <option value="Draft">Draft</option>
                                <option value="Awaiting Approval">Awaiting Approval</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" onClick={onClose} className="button button-secondary">Cancel</button>
                            <button type="submit" className="button button-primary">Save Purchase Order</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};