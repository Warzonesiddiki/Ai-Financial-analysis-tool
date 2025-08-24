

import React, { useState, useEffect } from 'react';
import { Vendor } from '../../types';
import { XIcon } from '../icons';

interface AddEditVendorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (vendorData: Omit<Vendor, 'id' | 'entityId'>, id?: string) => void;
    existingVendor: Vendor | null;
}

export const AddEditVendorModal: React.FC<AddEditVendorModalProps> = ({ isOpen, onClose, onSave, existingVendor }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (existingVendor) {
                setName(existingVendor.name);
                setEmail(existingVendor.email);
                setAddress(existingVendor.address);
            } else {
                setName('');
                setEmail('');
                setAddress('');
            }
        }
    }, [existingVendor, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, email, address }, existingVendor?.id);
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
                    <h2 style={{ margin: 0, border: 'none' }}>{existingVendor ? 'Edit Vendor' : 'New Vendor'}</h2>
                    <button onClick={onClose} className="button button-tertiary" style={{ padding: '0.5rem' }}><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Vendor Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Address</label>
                        <textarea value={address} onChange={e => setAddress(e.target.value)} className="input" style={{minHeight: '80px'}} required />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" onClick={onClose} className="button button-secondary">Cancel</button>
                        <button type="submit" className="button button-primary">{existingVendor ? 'Update Vendor' : 'Save Vendor'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};