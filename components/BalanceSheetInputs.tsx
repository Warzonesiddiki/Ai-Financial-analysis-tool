

import React, { useEffect, useMemo } from 'react';
import { BalanceSheetData, BankAccount, PpeItem } from '../types';
import CollapsibleSection from './CollapsibleSection';
import { XIcon } from './icons';

interface InputFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, disabled=false }) => (
    <div className="form-group">
        <label className="form-label">{label}</label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="input"
            placeholder="0"
            disabled={disabled}
        />
    </div>
);

const TotalField: React.FC<{label: string; value: number}> = ({ label, value }) => (
    <div className="form-group" style={{ backgroundColor: '#f9fafb', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label" style={{ marginBottom: 0, fontWeight: 600 }}>{label}</label>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '1rem' }}>
                {new Intl.NumberFormat('en-US').format(value)}
            </span>
        </div>
    </div>
);


interface BalanceSheetInputsProps {
    data: BalanceSheetData;
    onChange: <K extends keyof BalanceSheetData>(field: K, value: BalanceSheetData[K]) => void;
}

const BalanceSheetInputs: React.FC<BalanceSheetInputsProps> = ({ data, onChange }) => {

    const { totalCurrentAssets, totalNonCurrentAssets, totalAssets, totalCurrentLiabilities, totalNonCurrentLiabilities, totalLiabilities, totalEquity, totalLiabilitiesAndEquity } = useMemo(() => {
        const safeParse = (v: string) => parseFloat(v) || 0;
        const totalCurrentAssets = safeParse(data.cashAndBankBalances) + safeParse(data.accountsReceivable) + safeParse(data.inventory) + safeParse(data.prepayments) + safeParse(data.otherCurrentAssets);
        const totalNonCurrentAssets = safeParse(data.propertyPlantEquipmentNet) + safeParse(data.intangibleAssets) + safeParse(data.investmentProperties) + safeParse(data.longTermInvestments);
        const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

        const totalCurrentLiabilities = safeParse(data.accountsPayable) + safeParse(data.accruedExpenses) + safeParse(data.shortTermLoans) + safeParse(data.currentPortionOfLTDebt);
        const totalNonCurrentLiabilities = safeParse(data.longTermLoans) + safeParse(data.leaseLiabilities) + safeParse(data.deferredTaxLiability);
        const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

        const totalEquity = safeParse(data.shareCapital) + safeParse(data.retainedEarnings) + safeParse(data.otherReserves);
        
        return { totalCurrentAssets, totalNonCurrentAssets, totalAssets, totalCurrentLiabilities, totalNonCurrentLiabilities, totalLiabilities, totalEquity, totalLiabilitiesAndEquity: totalLiabilities + totalEquity };
    }, [data]);


    useEffect(() => {
        if (Array.isArray(data.bankAccounts)) {
            const total = data.bankAccounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
            onChange('cashAndBankBalances', String(total));
        }
    }, [data.bankAccounts, onChange]);

    useEffect(() => {
        if (Array.isArray(data.ppeSchedule)) {
            const total = data.ppeSchedule.reduce((sum, item) => sum + ((Number(item.cost) || 0) - (Number(item.accumulatedDepreciation) || 0)), 0);
            onChange('propertyPlantEquipmentNet', String(total));
        }
    }, [data.ppeSchedule, onChange]);


    const handleBankChange = (id: string, field: keyof Omit<BankAccount, 'id'>, value: string) => {
        const newAccounts = data.bankAccounts.map(acc => acc.id === id ? { ...acc, [field]: value } : acc);
        onChange('bankAccounts', newAccounts);
    };

    const addBankAccount = () => {
        const newAccount: BankAccount = { id: Date.now().toString(), name: '', balance: '' };
        onChange('bankAccounts', [...(Array.isArray(data.bankAccounts) ? data.bankAccounts : []), newAccount]);
    };
    
    const removeBankAccount = (id: string) => {
        onChange('bankAccounts', data.bankAccounts.filter(acc => acc.id !== id));
    };

    const handlePpeChange = (id: string, field: keyof Omit<PpeItem, 'id'>, value: string) => {
        const newItems = data.ppeSchedule.map(item => item.id === id ? { ...item, [field]: value } : item);
        onChange('ppeSchedule', newItems);
    };

    const addPpeItem = () => {
        const newItem: PpeItem = { id: Date.now().toString(), description: '', cost: '', accumulatedDepreciation: '' };
        onChange('ppeSchedule', [...(Array.isArray(data.ppeSchedule) ? data.ppeSchedule : []), newItem]);
    };
    
    const removePpeItem = (id: string) => {
        onChange('ppeSchedule', data.ppeSchedule.filter(item => item.id !== id));
    };


    return (
        <div>
            <CollapsibleSection title="Assets" defaultOpen>
                <CollapsibleSection title="Current Assets">
                     <div style={{backgroundColor: 'var(--color-background)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--color-border)', marginBottom: '1rem'}}>
                        <h4 style={{marginTop: 0, color: 'var(--color-text-secondary)'}}>Bank Balances</h4>
                        {Array.isArray(data.bankAccounts) && data.bankAccounts.map(acc => (
                           <div key={acc.id} className="grid grid-cols-2" style={{gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center'}}>
                               <input type="text" placeholder="Bank / Account Name" value={acc.name} onChange={e => handleBankChange(acc.id, 'name', e.target.value)} className="input" />
                               <div style={{display: 'flex', gap: '0.5rem'}}>
                                  <input type="number" placeholder="Balance" value={acc.balance} onChange={e => handleBankChange(acc.id, 'balance', e.target.value)} className="input" />
                                  <button onClick={() => removeBankAccount(acc.id)} className="button button-tertiary" style={{padding: '0.5rem'}}><XIcon style={{width:'16px', height: '16px', color: 'var(--color-error)'}}/></button>
                               </div>
                           </div>
                        ))}
                        <button onClick={addBankAccount} className="button button-tertiary">+ Add Bank Account</button>
                    </div>
                    <InputField label="Cash & Bank Balances" value={data.cashAndBankBalances} onChange={v => onChange('cashAndBankBalances', v)} disabled />
                    <InputField label="Accounts Receivable" value={data.accountsReceivable} onChange={v => onChange('accountsReceivable', v)} />
                    <InputField label="Inventory" value={data.inventory} onChange={v => onChange('inventory', v)} />
                    <InputField label="Prepayments" value={data.prepayments} onChange={v => onChange('prepayments', v)} />
                    <InputField label="Other Current Assets" value={data.otherCurrentAssets} onChange={v => onChange('otherCurrentAssets', v)} />
                    <TotalField label="Total Current Assets" value={totalCurrentAssets} />
                </CollapsibleSection>
                <CollapsibleSection title="Non-Current Assets">
                     <div style={{backgroundColor: 'var(--color-background)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--color-border)', marginBottom: '1rem'}}>
                        <h4 style={{marginTop: 0, color: 'var(--color-text-secondary)'}}>PPE Schedule</h4>
                         <div className="grid" style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr auto', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', padding: '0 0.5rem', fontWeight: 500}}>
                            <div>Description</div>
                            <div style={{textAlign:'right'}}>Cost</div>
                            <div style={{textAlign:'right'}}>Accum. Depr.</div>
                            <div style={{textAlign:'right'}}>NBV</div>
                        </div>
                        {Array.isArray(data.ppeSchedule) && data.ppeSchedule.map(item => {
                           const nbv = (Number(item.cost) || 0) - (Number(item.accumulatedDepreciation) || 0);
                           return (
                               <div key={item.id} className="grid" style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center'}}>
                                   <input type="text" placeholder="Asset Description" value={item.description} onChange={e => handlePpeChange(item.id, 'description', e.target.value)} className="input" />
                                   <input type="number" placeholder="Cost" value={item.cost} onChange={e => handlePpeChange(item.id, 'cost', e.target.value)} className="input" style={{textAlign: 'right'}} />
                                   <input type="number" placeholder="Depr." value={item.accumulatedDepreciation} onChange={e => handlePpeChange(item.id, 'accumulatedDepreciation', e.target.value)} className="input" style={{textAlign: 'right'}} />
                                   <input type="text" value={nbv.toLocaleString()} disabled className="input" style={{textAlign: 'right'}} />
                                   <button onClick={() => removePpeItem(item.id)} className="button button-tertiary" style={{padding: '0.5rem'}}><XIcon style={{width:'16px', height: '16px', color: 'var(--color-error)'}}/></button>
                               </div>
                           );
                        })}
                        <button onClick={addPpeItem} className="button button-tertiary">+ Add Asset</button>
                    </div>
                    <InputField label="Property, Plant & Equipment (Net)" value={data.propertyPlantEquipmentNet} onChange={v => onChange('propertyPlantEquipmentNet', v)} disabled/>
                    <InputField label="Intangible Assets" value={data.intangibleAssets} onChange={v => onChange('intangibleAssets', v)} />
                    <InputField label="Investment Properties" value={data.investmentProperties} onChange={v => onChange('investmentProperties', v)} />
                    <InputField label="Long-term Investments" value={data.longTermInvestments} onChange={v => onChange('longTermInvestments', v)} />
                    <TotalField label="Total Non-Current Assets" value={totalNonCurrentAssets} />
                </CollapsibleSection>
                <TotalField label="Total Assets" value={totalAssets} />
            </CollapsibleSection>
            <CollapsibleSection title="Liabilities & Equity">
                <CollapsibleSection title="Current Liabilities">
                    <InputField label="Accounts Payable" value={data.accountsPayable} onChange={v => onChange('accountsPayable', v)} />
                    <InputField label="Accrued Expenses" value={data.accruedExpenses} onChange={v => onChange('accruedExpenses', v)} />
                    <InputField label="Short-Term Loans" value={data.shortTermLoans} onChange={v => onChange('shortTermLoans', v)} />
                    <InputField label="Current Portion of LT Debt" value={data.currentPortionOfLTDebt} onChange={v => onChange('currentPortionOfLTDebt', v)} />
                    <TotalField label="Total Current Liabilities" value={totalCurrentLiabilities} />
                </CollapsibleSection>
                 <CollapsibleSection title="Non-Current Liabilities">
                    <InputField label="Long-Term Loans" value={data.longTermLoans} onChange={v => onChange('longTermLoans', v)} />
                    <InputField label="Lease Liabilities" value={data.leaseLiabilities} onChange={v => onChange('leaseLiabilities', v)} />
                    <InputField label="Deferred Tax Liability" value={data.deferredTaxLiability} onChange={v => onChange('deferredTaxLiability', v)} />
                    <TotalField label="Total Non-Current Liabilities" value={totalNonCurrentLiabilities} />
                 </CollapsibleSection>
                 <TotalField label="Total Liabilities" value={totalLiabilities} />
                  <CollapsibleSection title="Equity">
                    <InputField label="Share Capital" value={data.shareCapital} onChange={v => onChange('shareCapital', v)} />
                    <InputField label="Retained Earnings" value={data.retainedEarnings} onChange={v => onChange('retainedEarnings', v)} />
                    <InputField label="Other Reserves" value={data.otherReserves} onChange={v => onChange('otherReserves', v)} />
                    <TotalField label="Total Equity" value={totalEquity} />
                 </CollapsibleSection>
                 <TotalField label="Total Liabilities & Equity" value={totalLiabilitiesAndEquity} />
            </CollapsibleSection>
        </div>
    );
};

export default React.memo(BalanceSheetInputs);