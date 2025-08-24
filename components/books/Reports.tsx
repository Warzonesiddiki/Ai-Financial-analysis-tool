import React, { useState } from 'react';
import { Transaction, ChartOfAccount, Budgets, ReportAccountNode, Invoice, Bill, TaxCode } from '../../types';
import { TrendingUpIcon, ScaleIcon, BarChartIcon, RepeatIcon, BookOpenIcon, ArrowLeftIcon, PercentCircleIcon } from '../icons';
import ProfitAndLossReport from './reports/ProfitAndLossReport';
import BalanceSheetReport from './reports/BalanceSheetReport';
import TrialBalanceReport from './reports/TrialBalanceReport';
import StatementOfCashFlowsReport from './reports/StatementOfCashFlowsReport';
import TaxReport from './reports/TaxReport';

interface ReportsProps {
    transactions: Transaction[];
    chartOfAccounts: ChartOfAccount[];
    budgets: Budgets;
    invoices: Invoice[];
    bills: Bill[];
    taxCodes: TaxCode[];
}

type ReportId = 'pnl' | 'balance_sheet' | 'trial_balance' | 'cash_flow' | 'tax_return';

const reportList = [
    { id: 'pnl', name: 'Profit and Loss', description: 'Analyze your income and expenses over a period.', icon: TrendingUpIcon },
    { id: 'balance_sheet', name: 'Balance Sheet', description: 'View your assets, liabilities, and equity at a point in time.', icon: ScaleIcon },
    { id: 'trial_balance', name: 'Trial Balance', description: 'Check if total debits equal total credits for all accounts.', icon: BookOpenIcon },
    { id: 'cash_flow', name: 'Statement of Cash Flows', description: 'See how cash moves through your business.', icon: RepeatIcon },
    { id: 'tax_return', name: 'VAT Return', description: 'Summarize VAT collected and paid for tax filing.', icon: PercentCircleIcon },
];

export const Reports: React.FC<ReportsProps> = (props) => {
    const [activeReport, setActiveReport] = useState<ReportId | null>(null);

    const renderReportContent = () => {
        switch (activeReport) {
            case 'pnl':
                return <ProfitAndLossReport {...props} />;
            case 'balance_sheet':
                return <BalanceSheetReport {...props} />;
            case 'trial_balance':
                 return <TrialBalanceReport {...props} />;
            case 'cash_flow':
                return <StatementOfCashFlowsReport {...props} />;
            case 'tax_return':
                return <TaxReport invoices={props.invoices} bills={props.bills} taxCodes={props.taxCodes} />;
            default:
                return null;
        }
    };

    if (activeReport) {
        return (
            <div>
                 <button onClick={() => setActiveReport(null)} className="button button-secondary" style={{marginBottom: '1.5rem'}}>
                    <ArrowLeftIcon />
                    Back to Report Center
                </button>
                {renderReportContent()}
            </div>
        )
    }

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <BarChartIcon style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
                <h2 style={{ margin: 0, border: 'none' }}>Report Center</h2>
            </div>
            <p style={{color: 'var(--color-text-secondary)', marginTop: 0}}>
                Select a report to analyze your financial data.
            </p>
            <div className="report-center-grid">
                {reportList.map(report => (
                    <div key={report.id} className="report-card" onClick={() => setActiveReport(report.id as ReportId)}>
                        <report.icon style={{width: '32px', height: '32px', color: 'var(--color-primary)', marginBottom: '1rem'}} />
                        <h3 style={{margin: '0 0 0.5rem 0'}}>{report.name}</h3>
                        <p style={{margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem'}}>{report.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
