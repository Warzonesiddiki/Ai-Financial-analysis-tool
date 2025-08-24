

import React, { useState } from 'react';
import { Employee, PayRun } from '../../types';
import { RunPayroll } from './RunPayroll';
import { EmployeesManager } from './EmployeesManager';

interface PayrollProps {
    employees: Employee[];
    payRuns: PayRun[];
    onAddEmployee: (employee: Omit<Employee, 'id' | 'entityId'>) => void;
    onUpdateEmployee: (employee: Employee) => void;
    onDeleteEmployee: (id: string) => void;
    onApprovePayRun: (payRun: PayRun) => void;
    openModal: (type: 'employee', data: any) => void;
    activeEntityId: string;
}

type PayrollTab = 'run' | 'employees';

export const Payroll: React.FC<PayrollProps> = (props) => {
    const [activeTab, setActiveTab] = useState<PayrollTab>('run');

    return (
        <div>
            <div className="tabs" style={{marginBottom: 0}}>
                <button 
                    onClick={() => setActiveTab('run')} 
                    className={`tab-button ${activeTab === 'run' ? 'active' : ''}`}
                >
                    Run Payroll
                </button>
                <button 
                    onClick={() => setActiveTab('employees')} 
                    className={`tab-button ${activeTab === 'employees' ? 'active' : ''}`}
                >
                    Employees
                </button>
            </div>
            <div className="tab-content" style={{paddingTop: 0}}>
                {activeTab === 'run' && (
                    <RunPayroll 
                        employees={props.employees}
                        payRuns={props.payRuns}
                        onApprovePayRun={props.onApprovePayRun}
                        activeEntityId={props.activeEntityId}
                    />
                )}
                {activeTab === 'employees' && (
                    <EmployeesManager 
                        employees={props.employees}
                        onDelete={props.onDeleteEmployee}
                        onEdit={(employee) => props.openModal('employee', { employee })}
                        onAddNew={() => props.openModal('employee', { employee: null })}
                    />
                )}
            </div>
        </div>
    );
};