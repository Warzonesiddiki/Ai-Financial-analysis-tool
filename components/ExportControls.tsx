
import React, { useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { AINarrativeResponse, ReportData } from '../types';
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
            const companyName = reportData.companyName;
            const reportTitle = getReportTitle();
            
            // --- Cover Page ---
            if (reportData.companyLogo) {
                const imgData = await getImageBuffer(reportData.companyLogo);
                const extension = reportData.companyLogo.split('.').pop()?.toUpperCase() || 'PNG';
                doc.addImage(new Uint8Array(imgData), extension, margin, 40, 40, 40, 'alias', 'NONE');
            }
            doc.setFontSize(32).setFont('helvetica', 'bold');
            doc.text(companyName, pageWidth / 2, 120, { align: 'center' });
            doc.setFontSize(18).setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.text(reportTitle, pageWidth / 2, 135, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 150, { align: 'center' });
            
            let pageNumber = 1;
            
            const addHeaderFooter = () => {
                doc.setFontSize(8).setTextColor(150);
                doc.text(companyName, margin, 10, { align: 'left' });
                doc.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
            };

            for (const section of narrative.sections) {
                if (!section.analysis) continue;

                doc.addPage();
                pageNumber++;
                addHeaderFooter();
                cursorY = margin + 10;
                
                const checkPageBreak = (heightNeeded: number) => {
                    if (cursorY + heightNeeded > pageHeight - margin) {
                        doc.addPage();
                        pageNumber++;
                        addHeaderFooter();
                        cursorY = margin + 10;
                    }
                };

                // Section Title
                doc.setFontSize(22).setFont('helvetica', 'bold').setTextColor(79, 70, 229);
                doc.text(section.name, margin, cursorY);
                cursorY += 10;
                
                // Headline
                doc.setFontSize(14).setFont('helvetica', 'italic').setTextColor(17, 24, 39);
                const headlineLines = doc.splitTextToSize(section.analysis.headline, pageWidth - margin * 2);
                checkPageBreak(headlineLines.length * 6 + 5);
                doc.text(headlineLines, margin, cursorY);
                cursorY += headlineLines.length * 6 + 5;
                
                // Takeaways
                checkPageBreak(section.analysis.takeaways.length * 5 + 10);
                doc.setFontSize(11).setFont('helvetica', 'bold').setTextColor(17, 24, 39);
                doc.text('Key Takeaways', margin, cursorY);
                cursorY += 6;
                doc.setFont('helvetica', 'normal').setTextColor(107, 114, 128);
                section.analysis.takeaways.forEach(t => {
                    const takeawayLines = doc.splitTextToSize(t, pageWidth - margin * 2 - 5);
                    checkPageBreak(takeawayLines.length * 5 + 2);
                    doc.text(`•  ${takeawayLines[0]}`, margin + 2, cursorY);
                    if (takeawayLines.length > 1) {
                         doc.text(takeawayLines.slice(1), margin + 5, cursorY + 5);
                         cursorY += (takeawayLines.length - 1) * 5;
                    }
                    cursorY += 5;
                });
                cursorY += 5;

                // Charts
                if (section.analysis.quantitativeData.charts) {
                    for(const [index, chart] of section.analysis.quantitativeData.charts.entries()) {
                         const chartImg = await getChartAsBase64(section.id, index);
                         if (chartImg) {
                            const imgProps = doc.getImageProperties(chartImg);
                            const imgHeight = (imgProps.height * (pageWidth / 2 - margin*1.5)) / imgProps.width;
                            checkPageBreak(imgHeight + 10);
                            doc.addImage(chartImg, 'PNG', margin, cursorY, (pageWidth - margin*2), 0);
                            cursorY += (imgProps.height * (pageWidth-margin*2) / imgProps.width) + 10
                         }
                    }
                }
                
                // Narrative
                doc.setFontSize(11).setFont('helvetica', 'bold').setTextColor(17, 24, 39);
                checkPageBreak(12);
                doc.text('Detailed Narrative', margin, cursorY);
                cursorY += 6;
                doc.setFont('helvetica', 'normal').setTextColor(107, 114, 128);
                section.analysis.narrative.split('\n').filter(p => p.trim()).forEach(p => {
                    const isSubheading = p.match(/^\*\*(.*?)\*\*$/);
                    if (isSubheading) {
                        doc.setFont('helvetica', 'bold').setTextColor(55, 65, 81);
                        const subheadingLines = doc.splitTextToSize(isSubheading[1], pageWidth - margin*2);
                        checkPageBreak(subheadingLines.length * 5 + 4);
                        doc.text(subheadingLines, margin, cursorY);
                        cursorY += subheadingLines.length * 5 + 2;
                        doc.setFont('helvetica', 'normal').setTextColor(107, 114, 128);
                    } else {
                         const narrativeLines = doc.splitTextToSize(p, pageWidth - margin * 2);
                         checkPageBreak(narrativeLines.length * 5 + 4);
                         doc.text(narrativeLines, margin, cursorY);
                         cursorY += narrativeLines.length * 5 + 2;
                    }
                });
            }
            
            doc.deletePage(1); // Delete the initial blank page
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
