

import React from 'react';
import { EsgData } from '../types';
import CollapsibleSection from './CollapsibleSection';

interface InputFieldProps {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'number' | 'text';
}

const InputField: React.FC<InputFieldProps> = ({ label, sublabel, value, onChange, type='number' }) => (
    <div className="form-group">
        <label className="form-label">
            {label} 
            {sublabel && <span style={{fontSize: '0.8rem', color: '#6c757d', marginLeft: '4px'}}>{sublabel}</span>}
        </label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="input"
            placeholder="0"
        />
    </div>
);

interface EsgInputsProps {
  data: EsgData;
  onChange: <K extends keyof EsgData>(field: K, value: EsgData[K]) => void;
}

const EsgInputs: React.FC<EsgInputsProps> = ({ data, onChange }) => {
  return (
    <CollapsibleSection title="ESG & Sustainability Metrics" defaultOpen={false}>
      <div className="grid grid-cols-2">
        <InputField label="CO2 Emissions" sublabel="(tonnes)" value={data.co2Emissions} onChange={v => onChange('co2Emissions', v)} />
        <InputField label="Water Usage" sublabel="(cubic meters)" value={data.waterUsage} onChange={v => onChange('waterUsage', v)} />
        <InputField label="Employee Turnover" sublabel="(%)" value={data.employeeTurnover} onChange={v => onChange('employeeTurnover', v)} />
        <InputField label="Gender Diversity" sublabel="(% non-male)" value={data.genderDiversity} onChange={v => onChange('genderDiversity', v)} />
      </div>
    </CollapsibleSection>
  );
};

export default React.memo(EsgInputs);