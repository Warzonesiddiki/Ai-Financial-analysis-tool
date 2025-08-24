
import React, { useState, useCallback } from 'react';
import { jsPDF, TextOptionsLight } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { AINarrativeResponse, ReportData, KeyMetric, Chart } from '../types';
import { FileIcon } from './icons';
import { Spinner } from './Spinner';

interface ExportControlsProps {
    narrative: AINarrativeResponse;
    reportData: ReportData;
}

const getImageBuffer = async (src: string): Promise<ArrayBuffer> => {
    const response = await fetch(src);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    return await response.arrayBuffer();
};

export const ExportControls: React.FC<ExportControlsProps> = ({ narrative, reportData }) => {
    const [isExporting, setIsExporting] = useState<string | null>(null);

    const getReportTitle = useCallback(() => {
        if (!reportData.periods || reportData.periods.length === 0) return "Financial Report";
        if (reportData.periods.length === 1) return `${reportData.periods[0].periodLabel} Financial Report`;
        return `${reportData.periods[0].periodLabel} - ${reportData.periods[reportData.periods.length - 1].periodLabel} Financial Report`;
    }, [reportData]);
    
    const fileName = `${reportData.companyName} ${getReportTitle()}`.replace(/\s+/g, '-');

    const getChartAsBase64 = useCallback(async (sectionId: string, chartIndex: number): Promise<string | null> => {
        const chartElement = document.getElementById(`chart-${sectionId}-${chartIndex}`);
        if (!chartElement) return null;
        try {
            const surfaceColor = getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim();
            const canvas = await html2canvas(chartElement, { backgroundColor: surfaceColor, logging: false, useCORS: true, scale: 2 });
            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error("Failed to capture chart:", error);
            return null;
        }
    }, []);

    const handlePdfExport = useCallback(async () => {
        setIsExporting('pdf');
        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            let cursorY = 0;
            const toc: { title: string, page: number }[] = [];

            // --- Define Theme Colors ---
            const primaryColor = '#4f46e5';
            const textColor = '#111827';
            const secondaryTextColor = '#6b7280';
            const borderColor = '#e5e7eb';
            const surfaceColor = '#ffffff';
            const backgroundColor = '#f9fafb';

            // --- Cover Page ---
            doc.setFillColor(primaryColor);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
            doc.setTextColor('#ffffff');

            if (reportData.companyLogo) {
                try {
                    const imgData = await getImageBuffer(reportData.companyLogo);
                    const extension = reportData.companyLogo.split('.').pop()?.toUpperCase() || 'PNG';
                    doc.addImage(new Uint8Array(imgData), extension, pageWidth / 2 - 25, 60, 50, 50, 'logo', 'NONE');
                } catch(e) { console.error("Could not add company logo to PDF", e) }
            }
            doc.setFontSize(36).setFont('helvetica', 'bold');
            doc.text(reportData.companyName, pageWidth / 2, 130, { align: 'center' });
            doc.setFontSize(20).setFont('helvetica', 'normal');
            doc.text(getReportTitle(), pageWidth / 2, 145, { align: 'center' });
            doc.setFontSize(12);
            doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 160, { align: 'center' });
            
            const addHeaderFooter = (pageNumber: number, totalPages: number) => {
                doc.setFontSize(9);
                // Header
                doc.setFillColor(backgroundColor);
                doc.rect(0, 0, pageWidth, 15, 'F');
                doc.setTextColor(textColor);
                doc.setFont('helvetica', 'bold');
                doc.text(reportData.companyName, margin, 10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(secondaryTextColor);
                doc.text(getReportTitle(), pageWidth - margin, 10, { align: 'right' });

                // Footer
                doc.setFillColor(backgroundColor);
                doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
                doc.setTextColor(secondaryTextColor);
                doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
            };
            
            const checkPageBreak = (heightNeeded: number) => {
                if (cursorY + heightNeeded > pageHeight - margin) {
                    doc.addPage();
                    cursorY = margin + 15;
                }
            };

            // --- Generate Content Pages & Build TOC ---
            for (const section of narrative.sections) {
                if (!section.analysis) continue;

                doc.addPage();
                toc.push({ title: section.name, page: doc.internal.pages.length });
                cursorY = margin + 15; // Extra space for header
                
                // Section Title Banner
                doc.setFillColor(primaryColor);
                doc.rect(margin, cursorY, pageWidth - (margin*2), 12, 'F');
                doc.setFontSize(18).setFont('helvetica', 'bold').setTextColor(surfaceColor);
                doc.text(section.name, margin + 4, cursorY + 8);
                cursorY += 20;
                
                // Headline
                doc.setFontSize(14).setFont('helvetica', 'italic').setTextColor(textColor);
                const headlineLines = doc.splitTextToSize(section.analysis.headline, pageWidth - margin * 2);
                checkPageBreak(headlineLines.length * 6 + 5);
                doc.text(headlineLines, margin, cursorY);
                cursorY += headlineLines.length * 6 + 8;
                
                // Key Metrics Table
                if (section.analysis.quantitativeData.keyMetrics && section.analysis.quantitativeData.keyMetrics.length > 0) {
                    checkPageBreak(20);
                    const tableBody = section.analysis.quantitativeData.keyMetrics.map((m: KeyMetric) => [
                        m.label, m.value, m.change ? `${m.change.toFixed(1)}%` : 'N/A'
                    ]);
                    autoTable(doc, {
                        startY: cursorY,
                        head: [['Metric', 'Value', 'Change vs Prior']],
                        body: tableBody,
                        theme: 'grid',
                        headStyles: { fillColor: primaryColor, textColor: surfaceColor, fontStyle: 'bold' },
                        styles: { cellPadding: 2.5, fontSize: 9 },
                        margin: { left: margin, right: margin },
                    });
                    cursorY = (doc as any).lastAutoTable.finalY + 10;
                }
                
                // Takeaways
                checkPageBreak(section.analysis.takeaways.length * 5 + 10);
                doc.setFontSize(12).setFont('helvetica', 'bold').setTextColor(textColor);
                doc.text('Key Takeaways', margin, cursorY);
                cursorY += 7;
                doc.setFont('helvetica', 'normal').setTextColor(secondaryTextColor);
                section.analysis.takeaways.forEach(t => {
                    const takeawayLines = doc.splitTextToSize(t, pageWidth - margin * 2 - 8);
                    checkPageBreak(takeawayLines.length * 5 + 4);
                    doc.setFillColor(primaryColor).circle(margin + 2, cursorY - 1.5, 1.2, 'F');
                    doc.text(takeawayLines, margin + 8, cursorY);
                    cursorY += takeawayLines.length * 5 + 2;
                });
                cursorY += 8;

                // Charts & Data Tables
                if (section.analysis.quantitativeData.charts && section.analysis.quantitativeData.charts.length > 0) {
                    for(const [index, chart] of section.analysis.quantitativeData.charts.entries()) {
                        const chartAndTableHeight = 120; // Estimate
                        checkPageBreak(chartAndTableHeight);

                        const groupStartY = cursorY;
                         
                         const chartImg = await getChartAsBase64(section.id, index);
                         let chartHeight = 0;
                         if (chartImg) {
                            const imgProps = doc.getImageProperties(chartImg);
                            const ratio = imgProps.width / imgProps.height;
                            const chartWidth = Math.min(pageWidth - margin*2, 160);
                            chartHeight = chartWidth / ratio;
                            
                            const chartX = (pageWidth - chartWidth) / 2;
                            doc.addImage(chartImg, 'PNG', chartX, cursorY, chartWidth, chartHeight);
                            cursorY += chartHeight + 5;
                         }

                         if (chart.data && chart.data.length > 0) {
                            checkPageBreak(25);
                            
                            doc.setFontSize(10).setFont('helvetica', 'bold').setTextColor(secondaryTextColor);
                            doc.text(`${chart.title} Data`, margin + 2, cursorY);
                            cursorY += 5;

                            const hasSeries = chart.data.some(d => d.series);
                            const tableHead = hasSeries ? [['Label', 'Series', 'Value']] : [['Item', 'Value']];
                            const tableBody = chart.data.map(d => {
                                const formattedValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: reportData.currency }).format(d.value);
                                return hasSeries ? [d.label, d.series || 'N/A', formattedValue] : [d.label, formattedValue];
                            });

                            autoTable(doc, {
                                startY: cursorY,
                                head: tableHead,
                                body: tableBody,
                                theme: 'striped',
                                headStyles: { fillColor: borderColor, textColor: textColor, fontStyle: 'bold', fontSize: 9 },
                                bodyStyles: { fontSize: 8 },
                                margin: { left: margin, right: margin },
                            });
                            cursorY = (doc as any).lastAutoTable.finalY;
                         }
                        
                        // Draw grouping box
                        doc.setDrawColor(borderColor);
                        doc.roundedRect(margin - 2, groupStartY - 2, pageWidth - (margin-2)*2, cursorY - groupStartY + 4, 3, 3, 'S');
                        cursorY += 10;
                    }
                }
                
                // Narrative
                doc.setFontSize(12).setFont('helvetica', 'bold').setTextColor(textColor);
                checkPageBreak(12);
                doc.text('Detailed Narrative', margin, cursorY);
                cursorY += 7;
                doc.setFontSize(10).setFont('helvetica', 'normal').setTextColor(secondaryTextColor);
                section.analysis.narrative.split('\n').filter(p => p.trim()).forEach(p => {
                    const isSubheading = p.match(/^\*\*(.*?)\*\*$/);
                    if (isSubheading) {
                        doc.setFont('helvetica', 'bold').setTextColor(textColor);
                        const subheadingLines = doc.splitTextToSize(isSubheading[1], pageWidth - margin*2);
                        checkPageBreak(subheadingLines.length * 5 + 4);
                        doc.text(subheadingLines, margin, cursorY);
                        cursorY += subheadingLines.length * 5 + 2;
                        doc.setFont('helvetica', 'normal').setTextColor(secondaryTextColor);
                    } else {
                         const narrativeLines = doc.splitTextToSize(p, pageWidth - margin * 2);
                         checkPageBreak(narrativeLines.length * 5 + 4);
                         doc.text(narrativeLines, margin, cursorY);
                         cursorY += narrativeLines.length * 5 + 2;
                    }
                });

                 // Sources
                if (section.analysis.sources && section.analysis.sources.length > 0) {
                    cursorY += 5;
                    checkPageBreak(15);
                    doc.setFontSize(12).setFont('helvetica', 'bold').setTextColor(textColor);
                    doc.text('Sources from the Web', margin, cursorY);
                    cursorY += 7;
                    doc.setFontSize(9).setFont('helvetica', 'normal');
                    section.analysis.sources.forEach((source, i) => {
                        const linkText = `${i + 1}. ${source.title || source.uri}`;
                        const textLines = doc.splitTextToSize(linkText, pageWidth - margin * 2);
                        checkPageBreak(textLines.length * 4 + 2);
                        doc.setTextColor(primaryColor).textWithLink(linkText, margin, cursorY, { url: source.uri });
                        cursorY += textLines.length * 4 + 1;
                    });
                }
            }
            
            // --- Table of Contents Page ---
            doc.insertPage(2);
            doc.setPage(2);
            cursorY = margin + 15;
            doc.setFontSize(22).setFont('helvetica', 'bold').setTextColor(primaryColor);
            doc.text('Table of Contents', margin, cursorY);
            cursorY += 15;

            doc.setFontSize(12).setFont('helvetica', 'normal').setTextColor(textColor);
            toc.forEach(item => {
                checkPageBreak(10);
                const text = `${item.title}`;
                const pageNumStr = `${item.page}`;
                const textWidth = doc.getStringUnitWidth(text) * 12 / doc.internal.scaleFactor;
                const pageNumWidth = doc.getStringUnitWidth(pageNumStr) * 12 / doc.internal.scaleFactor;
                const availableWidth = pageWidth - margin * 2;
                const dotsWidth = availableWidth - textWidth - pageNumWidth - 2;
                const dots = '.'.repeat(Math.max(0, Math.floor(dotsWidth / (doc.getStringUnitWidth('.') * 12 / doc.internal.scaleFactor))));
                
                doc.textWithLink(text, margin, cursorY, { pageNumber: item.page });
                doc.setTextColor(secondaryTextColor).text(`${dots}`, margin + textWidth + 1, cursorY);
                doc.setTextColor(textColor).text(pageNumStr, pageWidth - margin, cursorY, { align: 'right' });

                cursorY += 10;
            });
            
            // --- Finalize: Add Headers/Footers and Delete Blank Page ---
            const totalPages = doc.internal.pages.length;
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                addHeaderFooter(i, totalPages);
            }
            doc.deletePage(1); 
            doc.save(`${fileName}.pdf`);
        } catch (error) {
            console.error("PDF Export failed:", error);
            alert("Sorry, there was an error creating the PDF. Please check the console for details.");
        } finally {
             setIsExporting(null);
        }
    }, [narrative, reportData, getChartAsBase64, getReportTitle, fileName]);

    const buttons = [
        { type: 'pdf', label: 'PDF', icon: FileIcon, handler: handlePdfExport, isLoading: isExporting === 'pdf' },
    ];

    return (
        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
             <span style={{fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)'}}>Export:</span>
            {buttons.map(btn => {
                const Icon = btn.icon;
                const disabled = !!isExporting;
                return (
                    <button key={btn.type} onClick={btn.handler} disabled={disabled} title={btn.label} className="button button-secondary">
                       {btn.isLoading ? <Spinner/> : <Icon style={{width: '20px', height: '20px'}}/>}
                       <span>{btn.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
