

import React, { useState, useEffect } from 'react';
import { Employee, PayType } from '../../types';
import { XIcon } from '../icons';

interface AddEditEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (employeeData: Omit<Employee, 'id' | 'entityId'>, id?: string) => void;
    existingEmployee: Employee | null;
}

export const AddEditEmployeeModal: React.FC<AddEditEmployeeModalProps> = ({ isOpen, onClose, onSave, existingEmployee }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [payType, setPayType] = useState<PayType>('salary');
    const [payRate, setPayRate] = useState(0);

    useEffect(() => {
        if (isOpen) {
            if (existingEmployee) {
                setName(existingEmployee.name);
                setEmail(existingEmployee.email);
                setPayType(existingEmployee.payType);
                setPayRate(existingEmployee.payRate);
            } else {
                setName('');
                setEmail('');
                setPayType('salary');
                setPayRate(0);
            }
        }
    }, [existingEmployee, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, email, payType, payRate }, existingEmployee?.id);
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
                    <h2 style={{ margin: 0, border: 'none' }}>{existingEmployee ? 'Edit Employee' : 'New Employee'}</h2>
                    <button onClick={onClose} className="button button-tertiary" style={{ padding: '0.5rem' }}><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" required />
                    </div>
                    <div className="grid grid-cols-2">
                        <div className="form-group">
                            <label className="form-label">Pay Type</label>
                            <select value={payType} onChange={e => setPayType(e.target.value as PayType)} className="input">
                                <option value="salary">Salary</option>
                                <option value="hourly">Hourly</option>
                            </select>
                        </div>
                         <div className="form-group">
                            <label className="form-label">{payType === 'salary' ? 'Annual Salary' : 'Hourly Rate'}</label>
                            <input type="number" step="0.01" value={payRate} onChange={e => setPayRate(parseFloat(e.target.value) || 0)} className="input" required />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" onClick={onClose} className="button button-secondary">Cancel</button>
                        <button type="submit" className="button button-primary">{existingEmployee ? 'Update Employee' : 'Save Employee'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};