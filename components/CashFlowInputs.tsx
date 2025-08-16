

import React from 'react';
import { CashFlowData } from '../types';
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


interface CashFlowInputsProps {
    data: CashFlowData;
    onChange: <K extends keyof CashFlowData>(field: K, value: CashFlowData[K]) => void;
}

const CashFlowInputs: React.FC<CashFlowInputsProps> = ({ data, onChange }) => {
    return (
        <div>
            <CollapsibleSection title="Operating Activities" defaultOpen>
                <InputField label="Net Income" value={data.netIncome} onChange={v => onChange('netIncome', v)} />
                <InputField label="Depreciation & Amortization" value={data.depreciationAmortization} onChange={v => onChange('depreciationAmortization', v)} />
                <InputField label="Changes in Working Capital" value={data.changesInWorkingCapital} onChange={v => onChange('changesInWorkingCapital', v)} />
            </CollapsibleSection>
            <CollapsibleSection title="Investing Activities">
                 <InputField label="Capital Expenditures" value={data.capitalExpenditures} onChange={v => onChange('capitalExpenditures', v)} />
                 <InputField label="Sale of Assets" value={data.saleOfAssets} onChange={v => onChange('saleOfAssets', v)} />
            </CollapsibleSection>
            <CollapsibleSection title="Financing Activities">
                 <InputField label="Issuance of Debt" value={data.issuanceOfDebt} onChange={v => onChange('issuanceOfDebt', v)} />
                 <InputField label="Repayment of Debt" value={data.repaymentOfDebt} onChange={v => onChange('repaymentOfDebt', v)} />
                 <InputField label="Issuance of Equity" value={data.issuanceOfEquity} onChange={v => onChange('issuanceOfEquity', v)} />
                 <InputField label="Dividends Paid" value={data.dividendsPaid} onChange={v => onChange('dividendsPaid', v)} />
            </CollapsibleSection>
        </div>
    );
};

export default React.memo(CashFlowInputs);