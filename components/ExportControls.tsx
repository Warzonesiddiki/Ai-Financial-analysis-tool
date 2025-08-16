
import React, { useState, useCallback } from 'react';
import { Packer, Document, Paragraph, TextRun, HeadingLevel, ImageRun } from 'docx';
import PptxGenJS from 'pptxgenjs';
import saveAs from 'file-saver';
import html2canvas from 'html2canvas';
import { AINarrativeResponse, ReportData, UaeConstructionNarrativeResponse, UaeProjectReportData } from '../types';
import { FileIcon, FileTextIcon, PresentationIcon } from './icons';
import { Spinner } from './Spinner';

interface ExportControlsProps {
    narrative: AINarrativeResponse | UaeConstructionNarrativeResponse;
    companyName: string;
    reportData: ReportData | UaeProjectReportData;
    onPdfExport: () => void;
    isPdfExporting: boolean;
}

// Helper to fetch any image source (URL, data URI) and return an ArrayBuffer
const getImageBuffer = async (src: string): Promise<ArrayBuffer> => {
    const response = await fetch(src);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
};

export const ExportControls: React.FC<ExportControlsProps> = ({ narrative, companyName, reportData, onPdfExport, isPdfExporting }) => {
    const [isExporting, setIsExporting] = useState<string | null>(null);

    const getReportTitle = useCallback(() => {
        if ('periods' in reportData && 'periodType' in reportData && reportData.periods.length > 0) {
            if (reportData.periods.length === 1) return `${reportData.periods[0].periodLabel} Financial Report`;
            return `${reportData.periods[0].periodLabel} - ${reportData.periods[reportData.periods.length - 1].periodLabel} Financial Report`;
        }
        if ('projects' in reportData) {
            return "Construction Portfolio Analysis";
        }
        return "Financial Report";
    }, [reportData]);
    
    const fileName = `${companyName} ${getReportTitle()}`.replace(/\s+/g, '-');


    const getChartAsBase64 = useCallback(async (sectionId: string, chartIndex: number): Promise<string | null> => {
        // Find chart in the main UI, as the off-screen renderer is now handled by the PDF export logic directly
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

    const handleDocxExport = useCallback(async () => {
        setIsExporting('docx');
        const reportTitle = getReportTitle();
        
        try {
            const docChildren: Paragraph[] = [];
            const companyLogo = 'companyLogo' in reportData ? reportData.companyLogo : undefined;

            if (companyLogo) {
                try {
                    const imageBuffer = await getImageBuffer(companyLogo);
                    docChildren.push(new Paragraph({
                        children: [new ImageRun({ data: imageBuffer, transformation: { width: 100, height: 100 } } as any)],
                    }));
                } catch (e) { console.error("Could not process logo for DOCX", e); }
            }

            docChildren.push(new Paragraph({
                children: [new TextRun({ text: companyName, bold: true, size: 48, font: "Inter", color: "1f2937" })],
                heading: HeadingLevel.TITLE,
            }));
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: reportTitle, size: 28, italics: true, color: "6b7280", font: "Inter" })],
                spacing: { after: 400 }
            }));

            for (const section of narrative.sections) {
                if (!section.analysis) continue;
                docChildren.push(new Paragraph({
                    text: section.name,
                    heading: HeadingLevel.HEADING_1,
                    style: "Heading1",
                    spacing: { before: 400, after: 200 }
                }));

                docChildren.push(new Paragraph({
                    children: [new TextRun({ text: section.analysis.headline, bold: true, italics: true, size: 24, font: "Inter", color: "1f2937" })],
                    spacing: { after: 200 }
                }));

                section.analysis.takeaways.forEach(takeaway => {
                    docChildren.push(new Paragraph({
                        children: [new TextRun({ text: takeaway, font: "Inter", color: "1f2937" })],
                        bullet: { level: 0 },
                    }));
                });
                
                if (section.analysis.charts && section.analysis.charts.length > 0) {
                    for (const [index] of section.analysis.charts.entries()) {
                        const imageBase64DataUri = await getChartAsBase64(section.id, index);
                        if (imageBase64DataUri) {
                            try {
                                const imageBuffer = await getImageBuffer(imageBase64DataUri);
                                docChildren.push(new Paragraph({
                                    children: [new ImageRun({
                                        data: imageBuffer,
                                        transformation: { width: 500, height: 280 }
                                    } as any)],
                                    spacing: { before: 200, after: 200 }
                                }));
                            } catch (e) { console.error("Could not process chart image for DOCX", e); }
                        }
                    }
                }

                section.analysis.narrative.split('\n').filter(p => p.trim()).forEach(p => {
                    docChildren.push(new Paragraph({ children: [new TextRun({ text: p, font: "Inter", color: "1f2937" })], spacing: { after: 150 } }));
                });
            }
            
            const doc = new Document({
                sections: [{ children: docChildren }],
                styles: {
                    paragraphStyles: [{
                        id: "Heading1",
                        name: "Heading 1",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: { size: 32, bold: true, color: "4f46e5", font: "Inter" },
                    }]
                }
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `${fileName}.docx`);
        } catch (error) {
             console.error("DOCX Export failed:", error);
             alert("Sorry, there was an error creating the Word document. Please check the console for details.");
        } finally {
             setIsExporting(null);
        }
    }, [narrative, companyName, fileName, getReportTitle, reportData, getChartAsBase64]);


    const handlePptxExport = useCallback(async () => {
        setIsExporting('pptx');
        const reportTitle = getReportTitle();
        try {
            const pptx = new PptxGenJS();
            pptx.layout = 'LAYOUT_WIDE';
            const companyLogo = 'companyLogo' in reportData ? reportData.companyLogo : undefined;
            
            const masterOpts: PptxGenJS.SlideMasterProps = {
                title: 'MASTER_SLIDE',
                background: { color: "F3F4F6" },
                objects: []
            };

            if (companyLogo) {
                masterOpts.objects!.push({ image: { path: companyLogo, x: 12.3, y: 0.25, w: 0.75, h: 0.75 } });
            }
            pptx.defineSlideMaster(masterOpts);
            
            const titleSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE'});
            const textColor = '1f2937';
            const secondaryTextColor = '6b7280';

            titleSlide.addText(companyName, { x: 0.5, y: 2.5, w: '90%', fontSize: 44, bold: true, color: textColor })
                      .addText(reportTitle, { x: 0.5, y: 3.5, w: '90%', fontSize: 24, color: secondaryTextColor });
            
            for (const section of narrative.sections) {
                if (!section.analysis) continue;
                const slide = pptx.addSlide({ masterName: 'MASTER_SLIDE'});
                slide.addText(section.name, { x: 0.5, y: 0.25, w: '90%', h: 0.5, fontSize: 28, bold: true, color: '4f46e5' });
                
                const hasCharts = section.analysis.charts && section.analysis.charts.length > 0;

                slide.addText(section.analysis.headline, { x: 0.5, y: 0.75, w: '90%', h: 0.4, fontSize: 16, italic: true, color: textColor });

                const takeaways = section.analysis.takeaways.map(t => ({ text: t, options: { bullet: true, paraSpaceAfter: 8, color: secondaryTextColor } }));
                slide.addText(takeaways, { x: 0.5, y: 1.5, w: hasCharts ? '45%' : '90%', h: 5.5, fontSize: 14 });
                
                if (hasCharts) {
                    const imageBase64 = await getChartAsBase64(section.id, 0);
                    if (imageBase64) {
                        slide.addImage({ data: imageBase64, x: 5.5, y: 1.5, w: 7, h: 3.93 });
                    }
                    
                    if(section.analysis.charts.length > 1) {
                        for(let i = 1; i < section.analysis.charts.length; i++) {
                            const additionalChartBase64 = await getChartAsBase64(section.id, i);
                            if(additionalChartBase64) {
                                const chartSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE'});
                                chartSlide.addText(`${section.name}: ${section.analysis.charts[i].title}`, { x: 0.5, y: 0.25, w: '90%', h: 0.5, fontSize: 24, bold: true, color: '4f46e5' });
                                chartSlide.addImage({ data: additionalChartBase64, x: 0.5, y: 1.0, w: 12.3, h: 6.0 });
                            }
                        }
                    }
                }
            }

            await pptx.writeFile({ fileName: `${fileName}.pptx` });
        } catch(error) {
            console.error("PPTX Export failed:", error);
            alert("Sorry, there was an error creating the PowerPoint presentation. Please check the console for details.");
        } finally {
            setIsExporting(null);
        }
    }, [narrative, companyName, fileName, getReportTitle, reportData, getChartAsBase64]);


    const buttons = [
        { type: 'pdf', label: 'PDF', icon: FileIcon, handler: onPdfExport, isLoading: isPdfExporting },
        { type: 'docx', label: 'Word', icon: FileTextIcon, handler: handleDocxExport, isLoading: isExporting === 'docx' },
        { type: 'pptx', label: 'PPT', icon: PresentationIcon, handler: handlePptxExport, isLoading: isExporting === 'pptx' },
    ];

    return (
        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
             <span style={{fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text-secondary)'}}>Export:</span>
            {buttons.map(btn => {
                const Icon = btn.icon;
                const disabled = !!isExporting || isPdfExporting;
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