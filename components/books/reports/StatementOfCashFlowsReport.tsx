import React, { useState, useCallback, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, ChartOfAccount } from '../../../types';
import { calculateStatementOfCashFlows, formatCurrency } from '../../../utils/financialUtils';
import ReportToolbar from './ReportToolbar';
import { CheckCircleIcon, XIcon } from '../../icons';

interface StatementOfCashFlowsReportProps {
    transactions: Transaction[];
    chartOfAccounts: ChartOfAccount[];
}

const StatementOfCashFlowsReport: React.FC<StatementOfCashFlowsReportProps> = ({ transactions, chartOfAccounts }) => {
    const [dateRange, setDateRange] = useState<{ start: Date, end: Date }>({ start: new Date(), end: new Date() });

    const reportData = useMemo(() => {
        return calculateStatementOfCashFlows(transactions, chartOfAccounts, dateRange.start, dateRange.end);
    }, [transactions, chartOfAccounts, dateRange]);

    const handleDateChange = useCallback((start: Date, end: Date) => {
        setDateRange({ start, end });
    }, []);
    
    const handleExport = () => {
        const doc = new jsPDF();
        doc.text(`Statement of Cash Flows`, 14, 16);
        doc.setFontSize(10);
        doc.text(`For the period ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`, 14, 22);
        
        autoTable(doc, {
            html: '#scf-report-table',
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] },
        });
        doc.save('statement_of_cash_flows.pdf');
    };
    
    const isBalanced = Math.abs(reportData.netChangeInCash - (reportData.endCash - reportData.startCash)) < 0.01;

    return (
        <div>
            <ReportToolbar onDateChange={handleDateChange} onExport={handleExport} title="Statement of Cash Flows" />
            <div className="report-container">
                 <div className="report-header">
                    <h2>Statement of Cash Flows</h2>
                    <p>For the period from {dateRange.start.toLocaleDateString()} to {dateRange.end.toLocaleDateString()}</p>
                </div>
                <table className="report-table" id="scf-report-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th className="right-align">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="header-row"><td colSpan={2}>Cash flow from operating activities</td></tr>
                        <tr>
                            <td className="indent-1">Net Income</td>
                            <td className="right-align monospace">{formatCurrency(reportData.netIncome, true)}</td>
                        </tr>
                        <tr>
                            <td className="indent-2">Adjustments to reconcile Net Income:</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td className="indent-3">Depreciation & Amortization</td>
                            <td className="right-align monospace">{formatCurrency(reportData.depreciationAndAmortization, true)}</td>
                        </tr>
                        <tr>
                            <td className="indent-3">Change in Accounts Receivable</td>
                            <td className="right-align monospace">{formatCurrency(reportData.changeInAccountsReceivable, true)}</td>
                        </tr>
                        <tr>
                            <td className="indent-3">Change in Inventory</td>
                            <td className="right-align monospace">{formatCurrency(reportData.changeInInventory, true)}</td>
                        </tr>
                        <tr>
                            <td className="indent-3">Change in Accounts Payable</td>
                            <td className="right-align monospace">{formatCurrency(reportData.changeInAccountsPayable, true)}</td>
                        </tr>
                        <tr className="total-row" style={{border: 'none'}}>
                            <td className="indent-1">Net cash from operating activities</td>
                            <td className="right-align monospace">{formatCurrency(reportData.cashFromOperations, true)}</td>
                        </tr>

                        <tr className="header-row" style={{height: '1rem'}}><td colSpan={2}></td></tr>

                        <tr className="header-row"><td colSpan={2}>Cash flow from investing activities</td></tr>
                         <tr>
                            <td className="indent-1">Net cash from investing activities</td>
                            <td className="right-align monospace">{formatCurrency(reportData.cashFromInvesting, true)}</td>
                        </tr>
                        
                        <tr className="header-row" style={{height: '1rem'}}><td colSpan={2}></td></tr>

                        <tr className="header-row"><td colSpan={2}>Cash flow from financing activities</td></tr>
                         <tr>
                            <td className="indent-1">Net cash from financing activities</td>
                            <td className="right-align monospace">{formatCurrency(reportData.cashFromFinancing, true)}</td>
                        </tr>
                        
                        <tr className="header-row" style={{height: '1rem'}}><td colSpan={2}></td></tr>

                        <tr className="total-row">
                            <td>Net change in cash</td>
                            <td className="right-align monospace">{formatCurrency(reportData.netChangeInCash, true)}</td>
                        </tr>
                        <tr>
                            <td>Cash at beginning of period</td>
                            <td className="right-align monospace">{formatCurrency(reportData.startCash, true)}</td>
                        </tr>
                        <tr className="total-row">
                            <td>Cash at end of period</td>
                            <td className="right-align monospace">{formatCurrency(reportData.endCash, true)}</td>
                        </tr>
                    </tbody>
                </table>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem',
                    backgroundColor: isBalanced ? 'var(--color-primary-light)' : '#fef2f2',
                    color: isBalanced ? 'var(--color-primary)' : 'var(--color-error)',
                    fontWeight: 600,
                }}>
                    {isBalanced ? <CheckCircleIcon/> : <XIcon/>}
                    <span>{isBalanced ? 'Reconciled' : `Does not reconcile by ${formatCurrency(reportData.netChangeInCash - (reportData.endCash - reportData.startCash))}`}</span>
                </div>
            </div>
        </div>
    );
};

export default StatementOfCashFlowsReport;