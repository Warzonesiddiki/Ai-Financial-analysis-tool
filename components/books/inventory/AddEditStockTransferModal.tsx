import React, { useState, useEffect } from 'react';
import { StockTransfer, Location, Product, InventoryItem } from '../../../types';
import { XIcon, TrashIcon, PlusCircleIcon } from '../../icons';

interface AddEditStockTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transferData: Omit<StockTransfer, 'id' | 'entityId'>) => void;
    locations: Location[];
    products: Product[];
    inventory: InventoryItem[];
    activeEntityId: string;
}

export const AddEditStockTransferModal: React.FC<AddEditStockTransferModalProps> = ({ isOpen, onClose, onSave, locations, products, inventory, activeEntityId }) => {
    
    const [transfer, setTransfer] = useState<Omit<StockTransfer, 'id' | 'entityId'>>({
        fromLocationId: '',
        toLocationId: '',
        date: new Date().toISOString().split('T')[0],
        items: [{ productId: '', quantity: 1 }],
        status: 'Completed',
    });

    useEffect(() => {
        if (isOpen) {
            setTransfer({
                fromLocationId: '',
                toLocationId: '',
                date: new Date().toISOString().split('T')[0],
                items: [{ productId: '', quantity: 1 }],
                status: 'Completed',
            });
        }
    }, [isOpen]);

    const handleInputChange = (field: keyof Omit<StockTransfer, 'items' | 'id' | 'entityId'>, value: string) => {
        setTransfer(prev => ({ ...prev, [field]: value }));
    };

    const handleItemChange = (index: number, field: 'productId' | 'quantity', value: string | number) => {
        const newItems = [...transfer.items];
        (newItems[index] as any)[field] = value;
        setTransfer(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setTransfer(prev => ({ ...prev, items: [...prev.items, { productId: '', quantity: 1 }] }));
    };

    const removeItem = (index: number) => {
        setTransfer(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(transfer);
    };

    const getStock = (productId: string, locationId: string) => {
        return inventory.find(i => i.productId === productId && i.locationId === locationId)?.quantity || 0;
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '600px', maxWidth: '90%', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, border: 'none' }}>New Stock Transfer</h2>
                    <button onClick={onClose} className="button button-tertiary" style={{ padding: '0.5rem' }}><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-3">
                        <div className="form-group">
                            <label className="form-label">From Location</label>
                            <select value={transfer.fromLocationId} onChange={e => handleInputChange('fromLocationId', e.target.value)} className="input" required>
                                <option value="" disabled>Select source</option>
                                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                            </select>
                        </div>
                         <div className="form-group">
                            <label className="form-label">To Location</label>
                            <select value={transfer.toLocationId} onChange={e => handleInputChange('toLocationId', e.target.value)} className="input" required>
                                <option value="" disabled>Select destination</option>
                                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                            </select>
                        </div>
                         <div className="form-group">
                            <label className="form-label">Date</label>
                            <input type="date" value={transfer.date} onChange={e => handleInputChange('date', e.target.value)} className="input" required />
                        </div>
                    </div>

                    <div style={{marginTop: '1rem'}}>
                         <div className="grid" style={{gridTemplateColumns: '3fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', padding: '0 0.5rem', fontWeight: 500 }}>
                            <span>Product</span>
                            <span>Quantity</span>
                        </div>
                        {transfer.items.map((item, index) => {
                            const availableStock = getStock(item.productId, transfer.fromLocationId);
                            return (
                                <div key={index} className="grid" style={{gridTemplateColumns: '3fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center'}}>
                                    <select value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)} className="input">
                                        <option value="">Select product</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <div>
                                        <input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} className="input" max={availableStock} />
                                        <small style={{color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginLeft: '0.5rem'}}>
                                            {availableStock} on hand
                                        </small>
                                    </div>
                                    <button type="button" onClick={() => removeItem(index)} className="button button-tertiary" style={{padding: '0.5rem'}}><TrashIcon style={{width: '16px', height:'16px', color: 'var(--color-error)'}}/></button>
                                </div>
                            )
                        })}
                        <button type="button" onClick={addItem} className="button button-tertiary" style={{marginTop: '0.5rem'}}><PlusCircleIcon/> Add Product</button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" onClick={onClose} className="button button-secondary">Cancel</button>
                        <button type="submit" className="button button-primary">Save Transfer</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
