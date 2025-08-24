import React, { useState, useCallback, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, ChartOfAccount, Budgets, ReportAccountNode } from '../../../types';
import { buildAccountTree, formatCurrency } from '../../../utils/financialUtils';
import ReportToolbar from './ReportToolbar';

interface ProfitAndLossReportProps {
    transactions: Transaction[];
    chartOfAccounts: ChartOfAccount[];
}

const ProfitAndLossReport: React.FC<ProfitAndLossReportProps> = ({ transactions, chartOfAccounts }) => {
    const reportContentRef = useRef<HTMLDivElement>(null);
    const [dateRange, setDateRange] = useState<{ start: Date, end: Date }>({ start: new Date(), end: new Date() });

    const reportData = React.useMemo(() => {
        const incomeTree = buildAccountTree(chartOfAccounts, transactions, ['Income'], dateRange.start, dateRange.end);
        const expenseTree = buildAccountTree(chartOfAccounts, transactions, ['Expense'], dateRange.start, dateRange.end);
        const cogsTree = buildAccountTree(chartOfAccounts, transactions, ['Expense'], dateRange.start, dateRange.end)
             .filter(node => node.name.toLowerCase().includes('cost of goods sold'));

        const totalIncome = incomeTree.reduce((sum, node) => sum + node.total, 0);
        const totalCogs = cogsTree.reduce((sum, node) => sum + node.total, 0);
        const totalExpenses = expenseTree.reduce((sum, node) => sum + node.total, 0);

        const grossProfit = totalIncome - totalCogs;
        const netProfit = totalIncome - totalExpenses;

        return { incomeTree, expenseTree, totalIncome, totalExpenses, grossProfit, netProfit };
    }, [chartOfAccounts, transactions, dateRange]);

    const handleDateChange = useCallback((start: Date, end: Date) => {
        setDateRange({ start, end });
    }, []);
    
    const handleExport = () => {
        const doc = new jsPDF();
        doc.text(`Profit and Loss Statement`, 14, 16);
        doc.setFontSize(10);
        doc.text(`For the period ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`, 14, 22);
        
        autoTable(doc, {
            html: '#pnl-report-table',
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] },
            didParseCell: function (data) {
                // Remove the % column for PDF export as it's complex to render
                if (data.column.index === 2) {
                    data.cell.text = '';
                }
            }
        });
        doc.save('profit_and_loss.pdf');
    };

    const AccountRow: React.FC<{ node: ReportAccountNode, totalRevenue: number }> = ({ node, totalRevenue }) => {
        const percentOfRevenue = totalRevenue !== 0 ? (node.total / totalRevenue) * 100 : 0;
        return (
            <>
                <tr style={node.depth === 0 ? {fontWeight: 'bold'} : {}}>
                    <td className={`indent-${node.depth}`}>{node.name}</td>
                    <td className="right-align monospace">{formatCurrency(node.total)}</td>
                    <td className="right-align monospace" style={{color: 'var(--color-text-secondary)'}}>
                        {node.type === 'Income' || node.type === 'Expense' ? `${percentOfRevenue.toFixed(2)}%` : ''}
                    </td>
                </tr>
                {node.children.map(child => <AccountRow key={child.id} node={child} totalRevenue={totalRevenue} />)}
            </>
        )
    }

    const renderTree = (nodes: ReportAccountNode[], totalRevenue: number) => {
        return nodes.map(node => <AccountRow key={node.id} node={node} totalRevenue={totalRevenue} />);
    };

    return (
        <div>
            <ReportToolbar onDateChange={handleDateChange} onExport={handleExport} title="Profit & Loss" />
            <div className="report-container" ref={reportContentRef}>
                 <div className="report-header">
                    <h2>Profit and Loss Statement</h2>
                    <p>For the period from {dateRange.start.toLocaleDateString()} to {dateRange.end.toLocaleDateString()}</p>
                </div>
                <table className="report-table" id="pnl-report-table">
                    <thead>
                        <tr>
                            <th>Account</th>
                            <th className="right-align">Total</th>
                            <th className="right-align">% of Income</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="header-row"><td colSpan={3}>Income</td></tr>
                        {renderTree(reportData.incomeTree, reportData.totalIncome)}
                        <tr className="total-row">
                            <td>Total Income</td>
                            <td className="right-align monospace">{formatCurrency(reportData.totalIncome)}</td>
                             <td className="right-align monospace" style={{color: 'var(--color-text-secondary)'}}>100.00%</td>
                        </tr>

                        <tr className="header-row" style={{height: '1rem'}}><td colSpan={3}></td></tr>
                        
                        <tr className="header-row"><td colSpan={3}>Expenses</td></tr>
                        {renderTree(reportData.expenseTree, reportData.totalIncome)}
                        <tr className="total-row">
                            <td>Total Expenses</td>
                            <td className="right-align monospace">{formatCurrency(reportData.totalExpenses)}</td>
                            <td className="right-align monospace" style={{color: 'var(--color-text-secondary)'}}>
                                {(reportData.totalIncome !== 0 ? (reportData.totalExpenses / reportData.totalIncome) * 100 : 0).toFixed(2)}%
                            </td>
                        </tr>
                        
                        <tr className="total-row" style={{backgroundColor: 'var(--color-primary-light)'}}>
                            <td>Net Profit</td>
                            <td className="right-align monospace">{formatCurrency(reportData.netProfit)}</td>
                            <td className="right-align monospace" style={{color: 'var(--color-text-secondary)'}}>
                                {(reportData.totalIncome !== 0 ? (reportData.netProfit / reportData.totalIncome) * 100 : 0).toFixed(2)}%
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProfitAndLossReport;
