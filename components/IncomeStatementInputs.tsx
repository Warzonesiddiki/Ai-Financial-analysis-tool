

import React, { useMemo } from 'react';
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

interface TotalFieldProps {
    label: string;
    value: number;
}
const TotalField: React.FC<TotalFieldProps> = ({ label, value }) => (
    <div className="form-group" style={{ backgroundColor: '#f9fafb', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label" style={{ marginBottom: 0, fontWeight: 600 }}>{label}</label>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '1rem' }}>
                {new Intl.NumberFormat('en-US').format(value)}
            </span>
        </div>
    </div>
);


interface IncomeStatementInputsProps {
    data: IncomeStatementData;
    onChange: <K extends keyof IncomeStatementData>(field: K, value: IncomeStatementData[K]) => void;
}

const IncomeStatementInputs: React.FC<IncomeStatementInputsProps> = ({ data, onChange }) => {
    const { totalRevenue, totalCogs, grossProfit, totalOpex, netIncome } = useMemo(() => {
        const safeParse = (v: string) => parseFloat(v) || 0;
        const totalRevenue = safeParse(data.revenueSaleOfGoods) + safeParse(data.revenueServices) + safeParse(data.revenueRental) + safeParse(data.otherIncome);
        const totalCogs = safeParse(data.materialCost) + safeParse(data.directLabor) + safeParse(data.subcontractorCosts) + safeParse(data.directEquipmentCost) + safeParse(data.otherDirectCosts);
        const grossProfit = totalRevenue - totalCogs;
        const totalOpexWithoutTaxAndDA = safeParse(data.staffSalariesAdmin) + safeParse(data.rentExpenseAdmin) + safeParse(data.utilities) + safeParse(data.marketingAdvertising) + safeParse(data.legalProfessionalFees) + safeParse(data.otherGAndA);
        const totalOpex = totalOpexWithoutTaxAndDA + safeParse(data.depreciationAmortization) + safeParse(data.incomeTaxExpense);
        const netIncome = grossProfit - totalOpex;
        return { totalRevenue, totalCogs, grossProfit, totalOpex, netIncome };
    }, [data]);

    return (
        <div>
            <CollapsibleSection title="Revenue" defaultOpen>
                <InputField label="Revenue from sale of goods" value={data.revenueSaleOfGoods} onChange={v => onChange('revenueSaleOfGoods', v)} />
                <InputField label="Revenue from services" value={data.revenueServices} onChange={v => onChange('revenueServices', v)} />
                <InputField label="Revenue from rental" value={data.revenueRental} onChange={v => onChange('revenueRental', v)} />
                <InputField label="Other Income" value={data.otherIncome} onChange={v => onChange('otherIncome', v)} />
                <TotalField label="Total Revenue" value={totalRevenue} />
            </CollapsibleSection>
            <CollapsibleSection title="Direct Costs / COGS">
                 <InputField label="Material Cost" value={data.materialCost} onChange={v => onChange('materialCost', v)} />
                 <InputField label="Direct Labor" value={data.directLabor} onChange={v => onChange('directLabor', v)} />
                 <InputField label="Subcontractor Costs" value={data.subcontractorCosts} onChange={v => onChange('subcontractorCosts', v)} />
                 <InputField label="Direct Equipment Cost" value={data.directEquipmentCost} onChange={v => onChange('directEquipmentCost', v)} />
                 <InputField label="Other Direct Costs" value={data.otherDirectCosts} onChange={v => onChange('otherDirectCosts', v)} />
                 <TotalField label="Total COGS" value={totalCogs} />
                 <TotalField label="Gross Profit" value={grossProfit} />
            </CollapsibleSection>
            <CollapsibleSection title="Operating Expenses">
                 <InputField label="Staff Salaries & Benefits (Admin)" value={data.staffSalariesAdmin} onChange={v => onChange('staffSalariesAdmin', v)} />
                 <InputField label="Rent Expense (Admin)" value={data.rentExpenseAdmin} onChange={v => onChange('rentExpenseAdmin', v)} />
                 <InputField label="Utilities" value={data.utilities} onChange={v => onChange('utilities', v)} />
                 <InputField label="Marketing & Advertising" value={data.marketingAdvertising} onChange={v => onChange('marketingAdvertising', v)} />
                 <InputField label="Legal & Professional Fees" value={data.legalProfessionalFees} onChange={v => onChange('legalProfessionalFees', v)} />
                 <InputField label="Other G&A Expenses" value={data.otherGAndA} onChange={v => onChange('otherGAndA', v)} />
                 <hr style={{border: 'none', borderTop: '1px dashed #e5e7eb', margin: '1.5rem 0'}}/>
                 <InputField label="Depreciation & Amortization" value={data.depreciationAmortization} onChange={v => onChange('depreciationAmortization', v)} />
                 <InputField label="Income Tax Expense" value={data.incomeTaxExpense} onChange={v => onChange('incomeTaxExpense', v)} />
                 <TotalField label="Total Operating Expenses" value={totalOpex} />
                 <TotalField label="Net Income" value={netIncome} />
            </CollapsibleSection>
        </div>
    );
};

export default React.memo(IncomeStatementInputs);