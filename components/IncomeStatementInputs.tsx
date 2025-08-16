

import React from 'react';
import { IncomeStatementData } from '../types';
import CollapsibleSection from './CollapsibleSection';

interface InputFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

const InputField: React.FC<InputFieldProps> = ({ label, value, onChange }) => (
    <div className="form-group">
        <label className="form-label">{label}</label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="input"
            placeholder="0"
        />
    </div>
);

interface IncomeStatementInputsProps {
    data: IncomeStatementData;
    onChange: <K extends keyof IncomeStatementData>(field: K, value: IncomeStatementData[K]) => void;
}

const IncomeStatementInputs: React.FC<IncomeStatementInputsProps> = ({ data, onChange }) => {
    return (
        <div>
            <CollapsibleSection title="Revenue" defaultOpen>
                <InputField label="Revenue from sale of goods" value={data.revenueSaleOfGoods} onChange={v => onChange('revenueSaleOfGoods', v)} />
                <InputField label="Revenue from services" value={data.revenueServices} onChange={v => onChange('revenueServices', v)} />
                <InputField label="Revenue from rental" value={data.revenueRental} onChange={v => onChange('revenueRental', v)} />
                <InputField label="Other Income" value={data.otherIncome} onChange={v => onChange('otherIncome', v)} />
            </CollapsibleSection>
            <CollapsibleSection title="Direct Costs / COGS">
                 <InputField label="Material Cost" value={data.materialCost} onChange={v => onChange('materialCost', v)} />
                 <InputField label="Direct Labor" value={data.directLabor} onChange={v => onChange('directLabor', v)} />
                 <InputField label="Subcontractor Costs" value={data.subcontractorCosts} onChange={v => onChange('subcontractorCosts', v)} />
                 <InputField label="Direct Equipment Cost" value={data.directEquipmentCost} onChange={v => onChange('directEquipmentCost', v)} />
                 <InputField label="Other Direct Costs" value={data.otherDirectCosts} onChange={v => onChange('otherDirectCosts', v)} />
            </CollapsibleSection>
            <CollapsibleSection title="Operating Expenses">
                 <InputField label="Staff Salaries & Benefits (Admin)" value={data.staffSalariesAdmin} onChange={v => onChange('staffSalariesAdmin', v)} />
                 <InputField label="Rent Expense (Admin)" value={data.rentExpenseAdmin} onChange={v => onChange('rentExpenseAdmin', v)} />
                 <InputField label="Utilities" value={data.utilities} onChange={v => onChange('utilities', v)} />
                 <InputField label="Marketing & Advertising" value={data.marketingAdvertising} onChange={v => onChange('marketingAdvertising', v)} />
                 <InputField label="Legal & Professional Fees" value={data.legalProfessionalFees} onChange={v => onChange('legalProfessionalFees', v)} />
                 <InputField label="Depreciation & Amortization" value={data.depreciationAmortization} onChange={v => onChange('depreciationAmortization', v)} />
                 <InputField label="Other G&A Expenses" value={data.otherGAndA} onChange={v => onChange('otherGAndA', v)} />
                 <InputField label="Income Tax Expense" value={data.incomeTaxExpense} onChange={v => onChange('incomeTaxExpense', v)} />
            </CollapsibleSection>
        </div>
    );
};

export default React.memo(IncomeStatementInputs);