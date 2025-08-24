import React, { useState, useEffect } from 'react';
import { Product, Location } from '../../types';
import { XIcon } from '../icons';

interface AdjustInventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (productId: string, locationId: string, newQuantity: number, reason: string) => void;
    product: Product;
    location: Location;
    currentQuantity: number;
}

export const AdjustInventoryModal: React.FC<AdjustInventoryModalProps> = ({ isOpen, onClose, onSave, product, location, currentQuantity }) => {
    const [newQuantity, setNewQuantity] = useState(currentQuantity);
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (isOpen) {
            setNewQuantity(currentQuantity);
            setReason('');
        }
    }, [isOpen, currentQuantity]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newQuantity !== currentQuantity && reason) {
            onSave(product.id, location.id, newQuantity, reason);
        } else if (!reason) {
            alert("Please provide a reason for the adjustment.");
        } else {
            onClose(); // No change was made
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0, border: 'none' }}>Adjust Inventory</h2>
                    <button onClick={onClose} className="button button-tertiary" style={{ padding: '0.5rem' }}><XIcon /></button>
                </div>
                <h3 style={{marginTop: 0, fontWeight: 500, color: 'var(--color-text-secondary)'}}>{product.name} at {location.name}</h3>
                
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2">
                        <div className="form-group">
                            <label className="form-label">Current Quantity</label>
                            <input type="text" value={currentQuantity} disabled className="input" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">New Quantity</label>
                            <input type="number" value={newQuantity} onChange={e => setNewQuantity(Number(e.target.value))} className="input" required />
                        </div>
                    </div>
                     <div className="form-group" style={{gridColumn: 'span 2'}}>
                        <label className="form-label">Reason for Adjustment</label>
                        <input type="text" value={reason} onChange={e => setReason(e.target.value)} className="input" placeholder="e.g., Annual stocktake, Damaged goods" required />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" onClick={onClose} className="button button-secondary">Cancel</button>
                        <button type="submit" className="button button-primary">Save Adjustment</button>
                    </div>
                </form>
            </div>
        </div>
    );
};