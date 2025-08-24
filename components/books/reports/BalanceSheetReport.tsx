import React, { useState, useCallback, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, ChartOfAccount, ReportAccountNode } from '../../../types';
import { buildAccountTree, formatCurrency } from '../../../utils/financialUtils';
import { CheckCircleIcon, XIcon, PrinterIcon } from '../../icons';

interface BalanceSheetReportProps {
    transactions: Transaction[];
    chartOfAccounts: ChartOfAccount[];
}

const BalanceSheetReport: React.FC<BalanceSheetReportProps> = ({ transactions, chartOfAccounts }) => {
    const [asOfDate, setAsOfDate] = useState(new Date());

    const reportData = React.useMemo(() => {
        const endDate = new Date(asOfDate);
        endDate.setHours(23, 59, 59, 999);
        const filteredTxs = transactions.filter(tx => new Date(tx.date) <= endDate);

        const assetTree = buildAccountTree(chartOfAccounts, filteredTxs, ['Asset']);
        const liabilityTree = buildAccountTree(chartOfAccounts, filteredTxs, ['Liability']);
        const equityTree = buildAccountTree(chartOfAccounts, filteredTxs, ['Equity']);

        const totalAssets = assetTree.reduce((sum, node) => sum + node.total, 0);
        const totalLiabilities = liabilityTree.reduce((sum, node) => sum + node.total, 0);
        const totalEquity = equityTree.reduce((sum, node) => sum + node.total, 0);
        
        return { assetTree, liabilityTree, equityTree, totalAssets, totalLiabilities, totalEquity };
    }, [chartOfAccounts, transactions, asOfDate]);
    
    const handleExport = () => {
        const doc = new jsPDF();
        doc.text(`Balance Sheet`, 14, 16);
        doc.setFontSize(10);
        doc.text(`As of ${asOfDate.toLocaleDateString()}`, 14, 22);
        
        autoTable(doc, {
            html: '#bs-report-table',
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] },
        });
        doc.save('balance_sheet.pdf');
    };

    const AccountRow: React.FC<{ node: ReportAccountNode }> = ({ node }) => (
        <>
            <tr style={node.depth === 0 ? {fontWeight: 'bold'} : {}}>
                <td className={`indent-${node.depth}`}>{node.name}</td>
                <td className="right-align monospace">{formatCurrency(node.total)}</td>
            </tr>
            {node.children.map(child => <AccountRow key={child.id} node={child} />)}
        </>
    );

    const renderTree = (nodes: ReportAccountNode[]) => {
        return nodes.map(node => <AccountRow key={node.id} node={node} />);
    };

    const { totalAssets, totalLiabilities, totalEquity } = reportData;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01;

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
                    <h2>Balance Sheet</h2>
                    <p>As of {asOfDate.toLocaleDateString()}</p>
                </div>
                <table className="report-table" id="bs-report-table">
                    <thead>
                        <tr>
                            <th>Account</th>
                            <th className="right-align">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="header-row"><td colSpan={2}>Assets</td></tr>
                        {renderTree(reportData.assetTree)}
                        <tr className="total-row">
                            <td>Total Assets</td>
                            <td className="right-align monospace">{formatCurrency(totalAssets)}</td>
                        </tr>
                        
                        <tr className="header-row" style={{height: '1rem'}}><td colSpan={2}></td></tr>

                        <tr className="header-row"><td colSpan={2}>Liabilities</td></tr>
                        {renderTree(reportData.liabilityTree)}
                        <tr className="total-row" style={{border: 'none'}}>
                            <td>Total Liabilities</td>
                            <td className="right-align monospace">{formatCurrency(totalLiabilities)}</td>
                        </tr>

                         <tr className="header-row" style={{height: '1rem'}}><td colSpan={2}></td></tr>

                        <tr className="header-row"><td colSpan={2}>Equity</td></tr>
                        {renderTree(reportData.equityTree)}
                         <tr className="total-row" style={{border: 'none'}}>
                            <td>Total Equity</td>
                            <td className="right-align monospace">{formatCurrency(totalEquity)}</td>
                        </tr>

                        <tr className="total-row">
                            <td>Total Liabilities & Equity</td>
                            <td className="right-align monospace">{formatCurrency(totalLiabilitiesAndEquity)}</td>
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
                    <span>{isBalanced ? 'Balanced' : `Unbalanced by ${formatCurrency(totalAssets - totalLiabilitiesAndEquity)}`}</span>
                </div>
            </div>
        </div>
    );
};

export default BalanceSheetReport;