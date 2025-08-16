

import React, { useState, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { AINarrativeResponse, ReportData, Chart } from '../types';
import { SectionDisplay } from './SectionDisplay';
import { AlertTriangleIcon, ArrowLeftIcon, CheckCircleIcon, XIcon } from './icons';
import { ExportControls } from './ExportControls';
import { REPORT_SECTIONS } from '../constants';
import { Spinner } from './Spinner';
import { SimpleBarChart } from './charts/SimpleBarChart';
import { SimplePieChart } from './charts/SimplePieChart';
import { SimpleLineChart } from './charts/SimpleLineChart';


type ProgressState = { [key: string]: 'pending' | 'loading' | 'success' | 'error' };

interface ReportDashboardProps {
    narrative: AINarrativeResponse | null;
    reportData: ReportData;
    isLoading: boolean;
    progress: ProgressState;
    onBackToInput: () => void;
}

const ReportDashboard: React.FC<ReportDashboardProps> = ({ narrative, reportData, isLoading, progress, onBackToInput }) => {
    const [activeSectionId, setActiveSectionId] = useState<string>(REPORT_SECTIONS[0].id);
    const [isPdfExporting, setIsPdfExporting] = useState<boolean>(false);

    const activeSectionData = useMemo(() => {
        return narrative?.sections.find(s => s.id === activeSectionId);
    }, [narrative?.sections, activeSectionId]);
    
    const getReportTitle = useCallback(() => {
        if (reportData.periods.length === 0) return "Financial Report";
        if (reportData.periods.length === 1) return `${reportData.periods[0].periodLabel} Financial Report`;
        return `${reportData.periods[0].periodLabel} - ${reportData.periods[reportData.periods.length - 1].periodLabel} Financial Report`;
    }, [reportData]);
    
    const fileName = `${reportData.companyName} ${getReportTitle()}`.replace(/\s+/g, '-');
    
    // A component to render the full report off-screen for PDF generation
    const PrintableReport: React.FC<{ narrative: AINarrativeResponse, reportData: ReportData }> = ({ narrative, reportData }) => (
        <div style={{ backgroundColor: 'var(--color-surface)', padding: '2rem' }}>
            <div style={{ textAlign: 'center', padding: '2rem 0', pageBreakAfter: 'always' }}>
                 {reportData.companyLogo && <img src={reportData.companyLogo} alt="logo" style={{ maxWidth: '150px', maxHeight: '150px', marginBottom: '1rem' }} />}
                <h1 style={{fontSize: '2.5rem'}}>{reportData.companyName}</h1>
                <p style={{ fontSize: '1.5rem', color: 'var(--color-text-secondary)' }}>{getReportTitle()}</p>
                 <p style={{marginTop: '3rem', color: 'var(--color-text-secondary)'}}>Generated on {new Date().toLocaleDateString()}</p>
            </div>
            {narrative.sections.map(section => (
                <SectionDisplay key={section.id} section={section} reportData={reportData} progressStatus="success" />
            ))}
        </div>
    );

    const handlePdfExport = useCallback(async () => {
        if (isPdfExporting || !narrative) return;
        setIsPdfExporting(true);
    
        const printContainer = document.createElement('div');
        printContainer.id = 'print-container';
        printContainer.style.position = 'absolute';
        printContainer.style.left = '-9999px';
        printContainer.style.width = '1200px'; 
        printContainer.style.fontFamily = 'var(--font-sans)';
        document.body.appendChild(printContainer);
    
        const root = ReactDOM.createRoot(printContainer);
        root.render(<React.StrictMode><PrintableReport narrative={narrative} reportData={reportData} /></React.StrictMode>);
        
        // Wait for rendering and potential image loading
        await new Promise(resolve => setTimeout(resolve, 1500)); 
    
        try {
            const canvas = await html2canvas(printContainer, { scale: 2, logging: false, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            
            const imgHeightInPdf = pdfWidth / ratio;
            let heightLeft = imgHeightInPdf;
            let position = 0;
    
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
            heightLeft -= pdfHeight;
    
            while (heightLeft > 0) {
                position = position - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
                heightLeft -= pdfHeight;
            }
    
            pdf.save(`${fileName}.pdf`);
    
        } catch (error) {
            console.error("PDF Export failed:", error);
            alert("Sorry, there was an error creating the PDF. Please check the console for details.");
        } finally {
            root.unmount();
            document.body.removeChild(printContainer);
            setIsPdfExporting(false);
        }
    }, [isPdfExporting, narrative, reportData, fileName, getReportTitle, PrintableReport]);


    const renderSectionContent = () => {
        if (!activeSectionData) {
            return (
                 <div className="card" style={{textAlign: 'center', padding: '4rem'}}>
                    <Spinner />
                    <h3 style={{marginTop: '1rem'}}>Loading Section...</h3>
                 </div>
            );
        }
        
        return <SectionDisplay section={activeSectionData} reportData={reportData} progressStatus={progress[activeSectionId]}/>;
    };

    if (isLoading && Object.values(progress).every(s => s === 'loading' || s === 'pending')) {
        return (
            <div className="card" style={{textAlign: 'center', padding: '4rem', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                <Spinner />
                <h3 style={{marginTop: '1rem'}}>Preparing Analysis...</h3>
                <p style={{color: 'var(--color-text-secondary)'}}>This may take a moment.</p>
            </div>
        );
    }
    
    if (!narrative) {
         return (
             <div className="card" style={{textAlign: 'center', padding: '4rem'}}>
                <AlertTriangleIcon style={{width: '48px', height: '48px', color: 'var(--color-error)'}}/>
                <h3 style={{marginTop: '1rem'}}>Report Generation Failed</h3>
                <p style={{color: 'var(--color-text-secondary)'}}>Something went wrong. Please go back and try again.</p>
                 <button onClick={onBackToInput} className="button button-secondary" style={{marginTop: '1rem'}}>
                     <ArrowLeftIcon />
                     Back to Data Input
                 </button>
             </div>
        );
    }

    return (
        <div id="report-container">
            <header style={{marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem'}}>
                <div>
                     <button onClick={onBackToInput} className="button button-secondary" style={{marginBottom: '1rem'}}>
                         <ArrowLeftIcon />
                         Back to Data Input
                     </button>
                     <h1 style={{margin: 0}}>{reportData.companyName}</h1>
                     <p style={{color: 'var(--color-text-secondary)', marginTop: '0.25rem', fontSize: '1.1rem'}}>{getReportTitle()}</p>
                </div>
                <ExportControls 
                    narrative={narrative} 
                    companyName={reportData.companyName} 
                    reportData={reportData}
                    onPdfExport={handlePdfExport}
                    isPdfExporting={isPdfExporting}
                />
            </header>

            <div className="dashboard">
                <nav className="dashboard-nav">
                     <div className="card" style={{padding: '0.75rem'}}>
                        <h3 style={{padding: '0.5rem 0.5rem 0.75rem 0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.5rem'}}>Report Sections</h3>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                        {REPORT_SECTIONS.map(section => {
                            const Icon = section.icon;
                            const isActive = activeSectionId === section.id;
                            const status = progress[section.id];
                            
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSectionId(section.id)}
                                    className="button"
                                    style={{
                                      justifyContent: 'flex-start',
                                      width: '100%',
                                      backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                                      color: isActive ? 'white' : 'var(--color-text)',
                                      border: 'none',
                                      fontWeight: 500,
                                    }}
                                >
                                    <Icon style={{width: '18px', height: '18px', color: isActive ? 'white' : 'var(--color-primary)'}}/>
                                    <span style={{flexGrow: 1, textAlign: 'left'}}>{section.name}</span>
                                    {status === 'loading' && <Spinner />}
                                    {status === 'success' && <CheckCircleIcon style={{color: isActive? 'white' : 'var(--color-success)', width: '18px', height: '18px'}} />}
                                    {status === 'error' && <XIcon style={{color: isActive? 'white' : 'var(--color-error)', width: '18px', height: '18px'}} />}
                                </button>
                            );
                        })}
                        </div>
                    </div>
                </nav>
            
                <div className="dashboard-content" id="report-content" data-active-section={activeSectionId}>
                    {renderSectionContent()}
                </div>
            </div>
        </div>
    );
};

export default ReportDashboard;