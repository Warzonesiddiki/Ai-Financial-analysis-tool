

import React from 'react';
import { BudgetData } from '../types';
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

interface BudgetInputsProps {
  data: BudgetData;
  onChange: <K extends keyof BudgetData>(field: K, value: BudgetData[K]) => void;
}

const BudgetInputs: React.FC<BudgetInputsProps> = ({ data, onChange }) => {
  return (
    <CollapsibleSection title="Budget Figures (for Variance Analysis)" defaultOpen={false}>
      <p style={{fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem'}}>Provide budget numbers for the same period to enable Actual vs. Budget analysis in the report.</p>
      <div className="grid grid-cols-3">
        <InputField label="Budgeted Revenue" value={data.revenue} onChange={v => onChange('revenue', v)} />
        <InputField label="Budgeted COGS" value={data.cogs} onChange={v => onChange('cogs', v)} />
        <InputField label="Budgeted Operating Expenses" value={data.opex} onChange={v => onChange('opex', v)} />
      </div>
    </CollapsibleSection>
  );
};

export default React.memo(BudgetInputs);