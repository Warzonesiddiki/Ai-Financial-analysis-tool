import React from 'react';
import { PeriodData } from '../types';
import { CheckCircleIcon, XIcon, InfoIcon } from './icons';

interface ValidationSummaryProps {
    period: PeriodData;
    currency: string;
}

const safeParse = (value: string | number): number => {
    if (typeof value === 'number') return value;
    const num = parseFloat(String(value).replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
};

const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
};

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({ period, currency }) => {
    const { balanceSheet } = period;

    const totalCurrentAssets = safeParse(balanceSheet.cashAndBankBalances) +
        safeParse(balanceSheet.accountsReceivable) +
        safeParse(balanceSheet.inventory) +
        safeParse(balanceSheet.prepayments) +
        safeParse(balanceSheet.otherCurrentAssets);

    const totalNonCurrentAssets = safeParse(balanceSheet.propertyPlantEquipmentNet) +
        safeParse(balanceSheet.intangibleAssets) +
        safeParse(balanceSheet.investmentProperties) +
        safeParse(balanceSheet.longTermInvestments);

    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

    const totalCurrentLiabilities = safeParse(balanceSheet.accountsPayable) +
        safeParse(balanceSheet.accruedExpenses) +
        safeParse(balanceSheet.shortTermLoans) +
        safeParse(balanceSheet.currentPortionOfLTDebt);
        
    const totalNonCurrentLiabilities = safeParse(balanceSheet.longTermLoans) +
        safeParse(balanceSheet.leaseLiabilities) +
        safeParse(balanceSheet.deferredTaxLiability);
    const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

    const totalEquity = safeParse(balanceSheet.shareCapital) +
        safeParse(balanceSheet.retainedEarnings) +
        safeParse(balanceSheet.otherReserves);
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    const difference = totalAssets - totalLiabilitiesAndEquity;
    const isBalanced = Math.abs(difference) < 1;

    return (
        <div className="card" style={{ position: 'sticky', top: '1.5rem' }}>
            <h4 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <InfoIcon /> Live Validation ({period.periodLabel})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Total Assets</span>
                    <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{formatCurrency(totalAssets, currency)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Total Liab. & Equity</span>
                    <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{formatCurrency(totalLiabilitiesAndEquity, currency)}</span>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0.25rem 0' }} />
                <div style={{ 
                    display: 'flex', justifyContent: 'space-between', 
                    fontWeight: 600,
                    color: isBalanced ? 'var(--color-text)' : 'var(--color-error)'
                }}>
                    <span>Difference</span>
                    <span style={{fontFamily: 'monospace'}}>{formatCurrency(difference, currency)}</span>
                </div>
                 <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '6px',
                    backgroundColor: isBalanced ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                    color: isBalanced ? 'var(--color-success)' : 'var(--color-error)',
                    fontWeight: 600,
                    marginTop: '0.5rem'
                }}>
                    {isBalanced ? <CheckCircleIcon /> : <XIcon />}
                    <span>{isBalanced ? 'Balanced' : 'Unbalanced'}</span>
                </div>
            </div>
        </div>
    );
};
