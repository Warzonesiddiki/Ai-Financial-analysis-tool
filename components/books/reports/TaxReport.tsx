import React, { useState, useCallback, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Bill, TaxCode } from '../../../types';
import { formatCurrency } from '../../../utils/financialUtils';
import ReportToolbar from './ReportToolbar';

interface TaxReportProps {
    invoices: Invoice[];
    bills: Bill[];
    taxCodes: TaxCode[];
}

const TaxReport: React.FC<TaxReportProps> = ({ invoices, bills, taxCodes }) => {
    const [dateRange, setDateRange] = useState<{ start: Date, end: Date }>({ start: new Date(), end: new Date() });

    const reportData = useMemo(() => {
        const inPeriod = (dateStr: string) => {
            const date = new Date(dateStr);
            return date >= dateRange.start && date <= dateRange.end;
        };

        let outputTax = 0;
        let salesTotal = 0;
        invoices.filter(inv => inPeriod(inv.invoiceDate)).forEach(inv => {
            inv.lineItems.forEach(line => {
                const lineTotal = line.quantity * line.unitPrice;
                salesTotal += lineTotal;
                const taxCode = taxCodes.find(tc => tc.id === line.taxCodeId);
                if (taxCode) {
                    outputTax += lineTotal * taxCode.rate;
                }
            });
        });

        let inputTax = 0;
        let purchasesTotal = 0;
        bills.filter(bill => inPeriod(bill.billDate)).forEach(bill => {
            bill.lineItems.forEach(line => {
                const lineTotal = line.quantity * line.unitPrice;
                purchasesTotal += lineTotal;
                const taxCode = taxCodes.find(tc => tc.id === line.taxCodeId);
                if (taxCode) {
                    inputTax += lineTotal * taxCode.rate;
                }
            });
        });
        
        const netVatPayable = outputTax - inputTax;

        return { outputTax, salesTotal, inputTax, purchasesTotal, netVatPayable };
    }, [invoices, bills, taxCodes, dateRange]);

    const handleDateChange = useCallback((start: Date, end: Date) => {
        setDateRange({ start, end });
    }, []);
    
    const handleExport = () => {
        const doc = new jsPDF();
        doc.text(`VAT Return Summary`, 14, 16);
        doc.setFontSize(10);
        doc.text(`For the period ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`, 14, 22);
        
        autoTable(doc, {
            html: '#tax-report-table',
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] },
        });
        doc.save('vat_return_summary.pdf');
    };

    return (
        <div>
            <ReportToolbar onDateChange={handleDateChange} onExport={handleExport} title="VAT Return" />
            <div className="report-container">
                 <div className="report-header">
                    <h2>VAT Return Summary</h2>
                    <p>For the period from {dateRange.start.toLocaleDateString()} to {dateRange.end.toLocaleDateString()}</p>
                </div>
                <table className="report-table" id="tax-report-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th className="right-align">Amount</th>
                            <th className="right-align">VAT Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="header-row"><td colSpan={3}>VAT on Sales (Output Tax)</td></tr>
                        <tr>
                            <td className="indent-1">Total Sales</td>
                            <td className="right-align monospace">{formatCurrency(reportData.salesTotal)}</td>
                            <td className="right-align monospace">{formatCurrency(reportData.outputTax)}</td>
                        </tr>
                        <tr className="total-row" style={{border: 'none'}}>
                            <td>Total Output Tax</td>
                            <td></td>
                            <td className="right-align monospace">{formatCurrency(reportData.outputTax)}</td>
                        </tr>

                        <tr className="header-row" style={{height: '1rem'}}><td colSpan={3}></td></tr>
                        
                        <tr className="header-row"><td colSpan={3}>VAT on Purchases (Input Tax)</td></tr>
                        <tr>
                            <td className="indent-1">Total Purchases</td>
                            <td className="right-align monospace">{formatCurrency(reportData.purchasesTotal)}</td>
                            <td className="right-align monospace">{formatCurrency(reportData.inputTax)}</td>
                        </tr>
                        <tr className="total-row" style={{border: 'none'}}>
                            <td>Total Input Tax</td>
                            <td></td>
                            <td className="right-align monospace">{formatCurrency(reportData.inputTax)}</td>
                        </tr>
                        
                        <tr className="total-row" style={{backgroundColor: 'var(--color-primary-light)'}}>
                            <td>Net VAT Payable</td>
                            <td></td>
                            <td className="right-align monospace">{formatCurrency(reportData.netVatPayable)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TaxReport;
