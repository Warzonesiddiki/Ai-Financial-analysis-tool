

import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { XIcon } from '../icons';

interface AddEditProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (productData: Omit<Product, 'id' | 'entityId'>, id?: string) => void;
    existingProduct: Product | null;
}

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({ isOpen, onClose, onSave, existingProduct }) => {
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [description, setDescription] = useState('');
    const [purchasePrice, setPurchasePrice] = useState(0);
    const [salePrice, setSalePrice] = useState(0);

    useEffect(() => {
        if (isOpen) {
            if (existingProduct) {
                setName(existingProduct.name);
                setSku(existingProduct.sku);
                setDescription(existingProduct.description);
                setPurchasePrice(existingProduct.purchasePrice);
                setSalePrice(existingProduct.salePrice);
            } else {
                setName('');
                setSku('');
                setDescription('');
                setPurchasePrice(0);
                setSalePrice(0);
            }
        }
    }, [existingProduct, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, sku, description, purchasePrice, salePrice }, existingProduct?.id);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '500px', maxWidth: '90%', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, border: 'none' }}>{existingProduct ? 'Edit Product' : 'New Product'}</h2>
                    <button onClick={onClose} className="button button-tertiary" style={{ padding: '0.5rem' }}><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2">
                         <div className="form-group">
                            <label className="form-label">Product Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">SKU</label>
                            <input type="text" value={sku} onChange={e => setSku(e.target.value)} className="input" required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="input" style={{minHeight: '80px'}} required />
                    </div>
                     <div className="grid grid-cols-2">
                        <div className="form-group">
                            <label className="form-label">Purchase Price</label>
                            <input type="number" step="0.01" value={purchasePrice} onChange={e => setPurchasePrice(parseFloat(e.target.value) || 0)} className="input" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Sale Price</label>
                            <input type="number" step="0.01" value={salePrice} onChange={e => setSalePrice(parseFloat(e.target.value) || 0)} className="input" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" onClick={onClose} className="button button-secondary">Cancel</button>
                        <button type="submit" className="button button-primary">{existingProduct ? 'Update Product' : 'Save Product'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};