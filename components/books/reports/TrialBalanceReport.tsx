import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, ChartOfAccount } from '../../../types';
import { formatCurrency } from '../../../utils/financialUtils';
import { CheckCircleIcon, XIcon, PrinterIcon } from '../../icons';

interface TrialBalanceReportProps {
    transactions: Transaction[];
    chartOfAccounts: ChartOfAccount[];
}

const TrialBalanceReport: React.FC<TrialBalanceReportProps> = ({ transactions, chartOfAccounts }) => {
    const [asOfDate, setAsOfDate] = useState(new Date());

    const reportData = useMemo(() => {
        const endDate = new Date(asOfDate);
        endDate.setHours(23, 59, 59, 999);
        const filteredTxs = transactions.filter(tx => new Date(tx.date) <= endDate);

        const balances: Record<string, number> = {};
        chartOfAccounts.forEach(acc => balances[acc.id] = 0);
        filteredTxs.forEach(tx => {
            balances[tx.accountId] = (balances[tx.accountId] || 0) + tx.amount;
        });

        let totalDebits = 0;
        let totalCredits = 0;

        const accountsWithBalances = chartOfAccounts
            .filter(acc => !acc.isArchived && balances[acc.id] !== 0)
            .map(acc => {
                const balance = balances[acc.id];
                let debit = 0;
                let credit = 0;

                // Asset & Expense are normal debit balances
                // Liability, Equity, Income are normal credit balances
                if (acc.type === 'Asset' || acc.type === 'Expense') {
                    if (balance > 0) debit = balance;
                    else credit = -balance;
                } else { // Liability, Equity, Income
                    if (balance < 0) debit = -balance;
                    else credit = balance;
                }
                
                totalDebits += debit;
                totalCredits += credit;

                return { ...acc, debit, credit };
            })
            .sort((a,b) => (a.accountNumber || '').localeCompare(b.accountNumber || ''));

        return { accountsWithBalances, totalDebits, totalCredits };
    }, [chartOfAccounts, transactions, asOfDate]);

    const handleExport = () => {
        const doc = new jsPDF();
        doc.text(`Trial Balance`, 14, 16);
        doc.setFontSize(10);
        doc.text(`As of ${asOfDate.toLocaleDateString()}`, 14, 22);
        
        autoTable(doc, {
            html: '#tb-report-table',
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] },
        });
        doc.save('trial_balance.pdf');
    };

    const { accountsWithBalances, totalDebits, totalCredits } = reportData;
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    return (
        <div>
            <div className="card report-toolbar" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="form-group" style={{marginBottom: 0}}>
                        <label className="form-label">As of Date</label>
                        <input type="date" value={asOfDate.toISOString().split('T')[0]} onChange={e => setAsOfDate(new Date(e.target.value))} className="input"/>
                    </div>
                     <button onClick={handleExport} className="button button-secondary">
                        <PrinterIcon /> Export as PDF
                    </button>
                </div>
            </div>
            <div className="report-container">
                <div className="report-header">
                    <h2>Trial Balance</h2>
                    <p>As of {asOfDate.toLocaleDateString()}</p>
                </div>
                <table className="report-table" id="tb-report-table">
                    <thead>
                        <tr>
                            <th>Account</th>
                            <th>Number</th>
                            <th className="right-align">Debit</th>
                            <th className="right-align">Credit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accountsWithBalances.map(acc => (
                            <tr key={acc.id}>
                                <td>{acc.name}</td>
                                <td className="monospace">{acc.accountNumber}</td>
                                <td className="right-align monospace">{acc.debit > 0 ? formatCurrency(acc.debit) : '-'}</td>
                                <td className="right-align monospace">{acc.credit > 0 ? formatCurrency(acc.credit) : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="total-row">
                            <td colSpan={2}>Totals</td>
                            <td className="right-align monospace">{formatCurrency(totalDebits)}</td>
                            <td className="right-align monospace">{formatCurrency(totalCredits)}</td>
                        </tr>
                    </tfoot>
                </table>
                 <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem',
                    backgroundColor: isBalanced ? 'var(--color-primary-light)' : '#fef2f2',
                    color: isBalanced ? 'var(--color-primary)' : 'var(--color-error)',
                    fontWeight: 600,
                }}>
                    {isBalanced ? <CheckCircleIcon/> : <XIcon/>}
                    <span>{isBalanced ? 'In Balance' : `Out of Balance by ${formatCurrency(totalDebits - totalCredits)}`}</span>
                </div>
            </div>
        </div>
    );
};

export default TrialBalanceReport;
