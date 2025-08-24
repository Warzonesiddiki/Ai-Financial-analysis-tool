import React, { useState, useEffect } from 'react';
import { PurchaseOrder, GoodsReceiptNote, Location, InventoryItem, GoodsReceiptNoteLineItem } from '../../../types';
import { XIcon, PackageCheckIcon, TrashIcon } from '../../icons';

interface AddGoodsReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (grnData: Omit<GoodsReceiptNote, 'id' | 'entityId'>) => void;
    purchaseOrder: PurchaseOrder;
    locations: Location[];
    inventory: InventoryItem[];
}

export const AddGoodsReceiptModal: React.FC<AddGoodsReceiptModalProps> = ({ isOpen, onClose, onSave, purchaseOrder, locations, inventory }) => {
    
    const [grn, setGrn] = useState<Omit<GoodsReceiptNote, 'id' | 'entityId'>>({
        purchaseOrderId: '',
        locationId: '',
        receiptDate: new Date().toISOString().split('T')[0],
        status: 'Completed',
        lineItems: [],
    });

    useEffect(() => {
        if (isOpen && purchaseOrder) {
            setGrn({
                purchaseOrderId: purchaseOrder.id,
                locationId: '',
                receiptDate: new Date().toISOString().split('T')[0],
                status: 'Completed',
                lineItems: purchaseOrder.lineItems.map(poLine => ({
                    id: `grn_line_${poLine.id}`,
                    purchaseOrderLineId: poLine.id,
                    productId: poLine.productId || '',
                    quantityOrdered: poLine.quantity,
                    quantityReceived: 0, // Default to 0, user must confirm
                })),
            });
        }
    }, [isOpen, purchaseOrder]);

    const handleLineItemChange = (lineId: string, quantityReceived: number) => {
        setGrn(prev => ({
            ...prev,
            lineItems: prev.lineItems.map(line => 
                line.id === lineId ? { ...line, quantityReceived } : line
            )
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!grn.locationId) {
            alert("Please select a location to receive the items.");
            return;
        }
        onSave(grn);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '700px', maxWidth: '90%', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, border: 'none' }}>Receive Items for PO {purchaseOrder.id}</h2>
                    <button onClick={onClose} className="button button-tertiary" style={{ padding: '0.5rem' }}><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2" style={{marginBottom: '1.5rem'}}>
                        <div className="form-group">
                            <label className="form-label">Receipt Date</label>
                            <input type="date" value={grn.receiptDate} onChange={e => setGrn(p => ({...p, receiptDate: e.target.value}))} className="input" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Receive At Location</label>
                            <select value={grn.locationId} onChange={e => setGrn(p => ({...p, locationId: e.target.value}))} className="input" required>
                                <option value="" disabled>Select location</option>
                                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <div className="grid" style={{gridTemplateColumns: '4fr 1fr 1fr', gap: '1rem', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', padding: '0 0.5rem', fontWeight: 500 }}>
                            <span>Product / Description</span>
                            <span style={{textAlign: 'right'}}>Ordered</span>
                            <span style={{textAlign: 'right'}}>Received</span>
                        </div>
                        {grn.lineItems.map((item) => {
                            const poLine = purchaseOrder.lineItems.find(l => l.id === item.purchaseOrderLineId);
                            return (
                                <div key={item.id} className="grid" style={{gridTemplateColumns: '4fr 1fr 1fr', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center'}}>
                                    <div style={{fontWeight: 500}}>{poLine?.description}</div>
                                    <input type="text" value={item.quantityOrdered} disabled className="input" style={{textAlign: 'right'}}/>
                                    <input 
                                        type="number" 
                                        value={item.quantityReceived} 
                                        onChange={e => handleLineItemChange(item.id, Number(e.target.value))} 
                                        className="input" 
                                        style={{textAlign: 'right'}}
                                        max={item.quantityOrdered}
                                        min={0}
                                    />
                                </div>
                            )
                        })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" onClick={onClose} className="button button-secondary">Cancel</button>
                        <button type="submit" className="button button-primary">
                            <PackageCheckIcon /> Receive Items
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};