
import React from 'react';
import { Employee } from '../../types';
import { PlusCircleIcon, EditIcon, TrashIcon } from '../icons';

interface EmployeesManagerProps {
    employees: Employee[];
    onDelete: (id: string) => void;
    onEdit: (employee: Employee) => void;
    onAddNew: () => void;
}

export const EmployeesManager: React.FC<EmployeesManagerProps> = ({ employees, onDelete, onEdit, onAddNew }) => {

    const handleDeleteEmployee = (id: string) => {
        if (window.confirm("Are you sure you want to delete this employee? This cannot be undone.")) {
            onDelete(id);
        }
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, border: 'none' }}>Employees</h2>
                <button onClick={onAddNew} className="button button-primary">
                    <PlusCircleIcon /> New Employee
                </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Name</th>
                            <th style={{ padding: '0.75rem' }}>Email</th>
                            <th style={{ padding: '0.75rem' }}>Pay Type</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Rate / Salary</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                         {employees.length === 0 ? (
                             <tr><td colSpan={5} style={{textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)'}}>No employees yet.</td></tr>
                        ) : employees.map(employee => (
                            <tr key={employee.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{employee.name}</td>
                                <td style={{ padding: '0.75rem' }}>{employee.email}</td>
                                <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{employee.payType}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace' }}>
                                    {formatCurrency(employee.payRate)} {employee.payType === 'hourly' ? '/ hr' : '/ yr'}
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                        <button onClick={() => onEdit(employee)} className="button button-tertiary" style={{ padding: '0.5rem' }}><EditIcon width="16" /></button>
                                        <button onClick={() => handleDeleteEmployee(employee.id)} className="button button-tertiary" style={{ padding: '0.5rem' }}><TrashIcon width="16" style={{color: 'var(--color-error)'}}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
