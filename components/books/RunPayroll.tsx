

import React, { useState, useMemo } from 'react';
import { Employee, PayRun, EmployeePayment } from '../../types';
import { Spinner } from '../Spinner';
import { CheckCircleIcon } from '../icons';

interface RunPayrollProps {
    employees: Employee[];
    payRuns: PayRun[];
    onApprovePayRun: (payRun: PayRun) => void;
    activeEntityId: string;
}

export const RunPayroll: React.FC<RunPayrollProps> = ({ employees, payRuns, onApprovePayRun, activeEntityId }) => {
    const today = new Date().toISOString().split('T')[0];
    const [payPeriodStart, setPayPeriodStart] = useState('');
    const [payPeriodEnd, setPayPeriodEnd] = useState('');
    const [paymentDate, setPaymentDate] = useState(today);
    
    const [draftPayRun, setDraftPayRun] = useState<PayRun | null>(null);
    const [hoursWorked, setHoursWorked] = useState<Record<string, number>>({});
    const [isApproving, setIsApproving] = useState(false);

    const handlePreparePayroll = () => {
        if (!payPeriodStart || !payPeriodEnd || !paymentDate) {
            alert("Please select all dates.");
            return;
        }

        const payments: EmployeePayment[] = employees.map(emp => {
            let grossPay = 0;
            if (emp.payType === 'salary') {
                // Simplified: assuming monthly pay period
                grossPay = emp.payRate / 12; 
            } else {
                // Hourly employees will have hours entered in the next step
                grossPay = 0;
            }
            return { employeeId: emp.id, grossPay };
        });

        setDraftPayRun({
            id: `pr_${Date.now()}`,
            payPeriodStart,
            payPeriodEnd,
            paymentDate,
            status: 'draft',
            payments,
            entityId: activeEntityId,
        });
    };

    const handleHoursChange = (employeeId: string, hours: string) => {
        const h = parseFloat(hours) || 0;
        setHoursWorked(prev => ({ ...prev, [employeeId]: h }));

        if (draftPayRun) {
            const updatedPayments = draftPayRun.payments.map(p => {
                if (p.employeeId === employeeId) {
                    const emp = employees.find(e => e.id === employeeId);
                    if (emp?.payType === 'hourly') {
                        return { ...p, grossPay: emp.payRate * h };
                    }
                }
                return p;
            });
            setDraftPayRun({ ...draftPayRun, payments: updatedPayments });
        }
    };
    
    const handleApprove = () => {
        if (draftPayRun && window.confirm("Are you sure you want to approve this pay run? This will create accounting entries.")) {
            setIsApproving(true);
            // Simulate async operation
            setTimeout(() => {
                onApprovePayRun(draftPayRun);
                setDraftPayRun(null);
                setIsApproving(false);
            }, 1000);
        }
    };

    const totalPayroll = draftPayRun?.payments.reduce((sum, p) => sum + p.grossPay, 0) || 0;
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <div className="card">
            <h2 style={{ margin: 0, border: 'none', marginBottom: '1.5rem' }}>Run Payroll</h2>

            {!draftPayRun ? (
                <div style={{maxWidth: '600px'}}>
                    <div className="grid grid-cols-3">
                        <div className="form-group">
                            <label className="form-label">Pay Period Start</label>
                            <input type="date" value={payPeriodStart} onChange={e => setPayPeriodStart(e.target.value)} className="input" />
                        </div>
                         <div className="form-group">
                            <label className="form-label">Pay Period End</label>
                            <input type="date" value={payPeriodEnd} onChange={e => setPayPeriodEnd(e.target.value)} className="input" />
                        </div>
                         <div className="form-group">
                            <label className="form-label">Payment Date</label>
                            <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="input" />
                        </div>
                    </div>
                    <button onClick={handlePreparePayroll} className="button button-primary">Start Pay Run</button>
                </div>
            ) : (
                <div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                        <div>
                            <h3 style={{margin: 0}}>Review Payroll</h3>
                            <p style={{color: 'var(--color-text-secondary)', margin: '0.25rem 0 0 0'}}>
                                Period: {draftPayRun.payPeriodStart} to {draftPayRun.payPeriodEnd} | Payment Date: {draftPayRun.paymentDate}
                            </p>
                        </div>
                        <button onClick={() => setDraftPayRun(null)} className="button button-secondary">Change Dates</button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem' }}>Employee</th>
                                    <th style={{ padding: '0.75rem' }}>Pay Type</th>
                                    <th style={{ padding: '0.75rem' }}>Rate</th>
                                    <th style={{ padding: '0.75rem' }}>Hours Worked</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Gross Pay</th>
                                </tr>
                            </thead>
                            <tbody>
                                {draftPayRun.payments.map(payment => {
                                    const employee = employees.find(e => e.id === payment.employeeId);
                                    if (!employee) return null;
                                    return (
                                        <tr key={employee.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>{employee.name}</td>
                                            <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{employee.payType}</td>
                                            <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
                                                {formatCurrency(employee.payRate)}{employee.payType === 'hourly' ? '/hr' : '/yr'}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                {employee.payType === 'hourly' ? (
                                                    <input 
                                                        type="number" 
                                                        className="input"
                                                        style={{width: '100px'}}
                                                        value={hoursWorked[employee.id] || ''}
                                                        onChange={e => handleHoursChange(employee.id, e.target.value)}
                                                        placeholder="Hours"
                                                    />
                                                ) : 'N/A'}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace' }}>
                                                {formatCurrency(payment.grossPay)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                             <tfoot>
                                <tr style={{fontWeight: 600, borderTop: '2px solid var(--color-border)'}}>
                                    <td colSpan={4} style={{padding: '0.75rem', textAlign: 'right'}}>Total Payroll Cost</td>
                                    <td style={{padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace'}}>{formatCurrency(totalPayroll)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button onClick={handleApprove} disabled={isApproving} className="button button-primary" style={{backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)', minWidth: '150px'}}>
                            {isApproving ? <Spinner/> : <CheckCircleIcon/>}
                            {isApproving ? 'Processing...' : 'Approve Payroll'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};