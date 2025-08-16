import React, { useState, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { UaeConstructionNarrativeResponse, UaeProjectReportData, UaeConstructionReportSection, SectionAnalysis, Subcontractor, ProjectData } from '../types';
import { Spinner } from './Spinner';
import { StatCard } from './StatCard';
import { ArrowLeftIcon, AlertTriangleIcon, CheckCircleIcon, XIcon } from './icons';
import { UAE_CONSTRUCTION_SECTIONS } from '../constants';
import { NarrativeDisplay } from './NarrativeDisplay';
import { SimpleBarChart } from './charts/SimpleBarChart';
import { SimplePieChart } from './charts/SimplePieChart';
import { SimpleLineChart } from './charts/SimpleLineChart';
import { ExportControls } from './ExportControls';

type ProgressState = { [key: string]: 'pending' | 'loading' | 'success' | 'error' };

interface UaeConstructionReportDashboardProps {
    narrative: UaeConstructionNarrativeResponse | null;
    reportData: UaeProjectReportData;
    isLoading: boolean;
    progress: ProgressState;
    onBackToInput: () => void;
}

const SubcontractorTable: React.FC<{ data: Subcontractor[], currency: string }> = ({ data, currency }) => (
    <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Major Subcontractors</h3>
        <table className="styled-table">
            <thead>
                <tr>
                    <th>Subcontractor Name</th>
                    <th>Contract Value</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item) => (
                    <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                        <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(parseFloat(item.contractValue))}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const ProjectHealthTable: React.FC<{ projects: ProjectData[], currency: string }> = ({ projects, currency }) => (
     <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Project Health Dashboard</h3>
        <div style={{overflowX: 'auto'}}>
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Project Name</th>
                        <th>Completion</th>
                        <th>Contract Value</th>
                        <th>Milestone / Risk</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map((proj) => (
                        <tr key={proj.id}>
                            <td style={{ fontWeight: 500 }}>{proj.name}</td>
                            <td>{proj.completionPercentage}%</td>
                            <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(parseFloat(proj.totalContractValue))}</td>
                            <td style={{maxWidth: '300px'}}>{proj.keyMilestoneOrRisk}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);


const UaeConstructionReportDashboard: React.FC<UaeConstructionReportDashboardProps> = ({ narrative, reportData, isLoading, progress, onBackToInput }) => {
    const [activeSectionId, setActiveSectionId] = useState<string>(UAE_CONSTRUCTION_SECTIONS[0].id);
    const [isPdfExporting, setIsPdfExporting] = useState<boolean>(false);

    const activeSectionData = useMemo(() => {
        return narrative?.sections.find(s => s.id === activeSectionId);
    }, [narrative?.sections, activeSectionId]);

    const reportTitle = "Construction Portfolio Analysis";
    const fileName = `${reportData.companyName} ${reportTitle}`.replace(/\s+/g, '-');

    const PrintableUaeConstructionSection: React.FC<{ section: UaeConstructionReportSection; reportData: UaeProjectReportData; }> = ({ section, reportData }) => {
        const { analysis } = section;
        if (!analysis) return null;

        return (
            <div style={{ pageBreakInside: 'avoid', marginBottom: '3rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
                <h2 style={{color: 'var(--color-primary)'}}>{section.name}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontStyle: 'italic', fontWeight: 600 }}>{analysis.headline}</h3>
                    
                    {analysis.keyMetrics && analysis.keyMetrics.length > 0 && (
                        <div className="grid grid-cols-2 lg:grid-cols-4" style={{gap: '1rem'}}>
                            {analysis.keyMetrics.map((metric, index) => (
                                <StatCard key={index} metric={metric} />
                            ))}
                        </div>
                    )}
    
                    {section.id === 'project_health_dashboard' && <ProjectHealthTable projects={reportData.projects} currency={reportData.currency} /> }
    
                    {analysis.forecast && (
                         <div className="card">
                            <h3 style={{marginBottom: '1rem'}}>5-Year Forecast</h3>
                            <div style={{overflowX: 'auto'}}>
                                <table className="styled-table">
                                    <thead><tr><th>Year</th><th>Est. Revenue</th><th>Est. Gross Profit</th><th>Est. Gross Margin %</th></tr></thead>
                                    <tbody>
                                        {analysis.forecast.map((year, index) => (
                                            <tr key={index}>
                                                <td style={{fontWeight: 600}}>{year.year}</td>
                                                <td>{reportData.currency} {year.revenue.toLocaleString()}</td>
                                                <td>{reportData.currency} {year.grossProfit.toLocaleString()}</td>
                                                <td>{year.grossMargin.toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
    
                    {analysis.subcontractors && analysis.subcontractors.length > 0 && (
                        <SubcontractorTable data={analysis.subcontractors} currency={reportData.currency} />
                    )}
                    
                    {analysis.charts && analysis.charts.length > 0 && (
                        <div className={`grid ${analysis.charts.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`} style={{gap: '1.5rem'}}>
                            {analysis.charts.map((chart, index) => (
                                <div key={index} className="card" id={`chart-pdf-${section.id}-${index}`}>
                                    <h4 style={{marginBottom: '1rem'}}>{chart.title}</h4>
                                    {chart.type === 'bar' && <SimpleBarChart data={chart.data} currency={reportData.currency} />}
                                    {chart.type === 'pie' && <SimplePieChart data={chart.data} />}
                                    {chart.type === 'line' && <SimpleLineChart data={chart.data} currency={reportData.currency} />}
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div className="card">
                        <NarrativeDisplay analysis={analysis} />
                    </div>
                </div>
            </div>
        );
    };

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

        const FullReport = () => (
            <div style={{ backgroundColor: 'var(--color-surface)', padding: '2rem' }}>
                <div style={{ textAlign: 'center', padding: '2rem 0', pageBreakAfter: 'always' }}>
                    {reportData.companyLogo && <img src={reportData.companyLogo} alt="logo" style={{ maxWidth: '150px', maxHeight: '150px', marginBottom: '1rem' }} />}
                    <h1 style={{fontSize: '2.5rem'}}>{reportData.companyName}</h1>
                    <p style={{ fontSize: '1.5rem', color: 'var(--color-text-secondary)' }}>{reportTitle}</p>
                    <p style={{marginTop: '3rem', color: 'var(--color-text-secondary)'}}>Generated on {new Date().toLocaleDateString()}</p>
                </div>
                {narrative.sections.map(section => {
                    if (section.id === 'five_year_forecast' && !reportData.forecastAssumptions.forecastEnabled) {
                        return null;
                    }
                    return <PrintableUaeConstructionSection key={section.id} section={section} reportData={reportData} />;
                })}
            </div>
        );

        const root = ReactDOM.createRoot(printContainer);
        root.render(<React.StrictMode><FullReport /></React.StrictMode>);
        
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        try {
            const canvas = await html2canvas(printContainer, { scale: 2, logging: false, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const ratio = canvas.width / canvas.height;
            const imgHeightInPdf = pdfWidth / ratio;
            let heightLeft = imgHeightInPdf;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position -= pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
                heightLeft -= pdfHeight;
            }
            pdf.save(`${fileName}.pdf`);
        } catch (error) {
            console.error("PDF Export failed:", error);
            alert("Sorry, there was an error creating the PDF.");
        } finally {
            root.unmount();
            document.body.removeChild(printContainer);
            setIsPdfExporting(false);
        }
    }, [isPdfExporting, narrative, reportData, fileName, reportTitle]);
    
    const renderCharts = (section: UaeConstructionReportSection) => {
        if (!section?.analysis?.charts || section.analysis.charts.length === 0) {
            return null;
        }

        const chartLayout = section.analysis.charts.length === 1 ? 'grid-cols-1' : 'grid-cols-2';

        return (
            <div className={`grid ${chartLayout}`} style={{gap: '1.5rem'}}>
                {section.analysis.charts.map((chart, index) => (
                    <div key={index} className="card" id={`chart-${section.id}-${index}`}>
                         <h4 style={{marginBottom: '1rem'}}>{chart.title}</h4>
                         {chart.type === 'bar' && <SimpleBarChart data={chart.data} currency={reportData.currency} />}
                         {chart.type === 'pie' && <SimplePieChart data={chart.data} />}
                         {chart.type === 'line' && <SimpleLineChart data={chart.data} currency={reportData.currency} />}
                    </div>
                ))}
            </div>
        );
    }
    
    const renderSectionContent = () => {
        if (!activeSectionData) {
            return (
                 <div className="card" style={{textAlign: 'center', padding: '4rem'}}>
                    <Spinner />
                    <h3 style={{marginTop: '1rem'}}>Generating Analysis...</h3>
                    <p style={{color: 'var(--color-text-secondary)'}}>The analysis for this section is being prepared.</p>
                 </div>
            );
        }
        
        const { analysis } = activeSectionData;

        if (progress[activeSectionId] === 'error') {
             return (
                <div className="card" style={{borderColor: 'var(--color-error)', backgroundColor: 'rgba(220, 38, 38, 0.05)'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: 'var(--color-error)'}}>
                         <AlertTriangleIcon style={{width: '24px', height: '24px'}}/>
                         <h3 style={{ margin: 0 }}>Analysis Failed</h3>
                    </div>
                    <p style={{color: 'var(--color-error)'}}>{analysis.narrative || 'The AI did not return a valid analysis for this section.'}</p>
                </div>
            );
        }
        
        return (
            <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}} data-active-section={activeSectionId}>
                 <h2 style={{margin: 0}}>{analysis.headline}</h2>
                 <div className="grid grid-cols-2 lg:grid-cols-4" style={{gap: '1rem'}}>
                    {analysis.keyMetrics?.map((metric, index) => (
                        <StatCard key={index} metric={metric} />
                    ))}
                </div>
                
                {activeSectionId === 'project_health_dashboard' && <ProjectHealthTable projects={reportData.projects} currency={reportData.currency} /> }

                {analysis.forecast && (
                     <div className="card">
                        <h3 style={{marginBottom: '1rem'}}>5-Year Forecast</h3>
                        <div style={{overflowX: 'auto'}}>
                            <table className="styled-table">
                                <thead>
                                    <tr>
                                        <th>Year</th>
                                        <th>Est. Revenue</th>
                                        <th>Est. Gross Profit</th>
                                        <th>Est. Gross Margin %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analysis.forecast.map((year, index) => (
                                        <tr key={index}>
                                            <td style={{fontWeight: 600}}>{year.year}</td>
                                            <td>{reportData.currency} {year.revenue.toLocaleString()}</td>
                                            <td>{reportData.currency} {year.grossProfit.toLocaleString()}</td>
                                            <td>{year.grossMargin.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {analysis.subcontractors && analysis.subcontractors.length > 0 && (
                    <SubcontractorTable data={analysis.subcontractors} currency={reportData.currency} />
                )}
                
                {renderCharts(activeSectionData)}
                
                <div className="card">
                    <NarrativeDisplay analysis={analysis} />
                </div>

                {reportData.qualitativeContext && (
                     <div className="card">
                        <h3 style={{marginBottom: '1rem'}}>Qualitative Context Provided to AI</h3>
                        <p style={{color: 'var(--color-text-secondary)', fontStyle: 'italic'}}>
                            "{reportData.qualitativeContext}"
                        </p>
                    </div>
                )}
            </div>
        )
    };

    if (isLoading && Object.values(progress).every(s => s === 'loading' || s === 'pending')) {
        return (
            <div className="card" style={{textAlign: 'center', padding: '4rem', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                <Spinner />
                <h3 style={{marginTop: '1rem'}}>Generating Full Report...</h3>
                <p style={{color: 'var(--color-text-secondary)'}}>The AI is analyzing the project portfolio. This may take a moment.</p>
            </div>
        );
    }

    return (
        <div id="report-container">
            <header style={{marginBottom: '1.5rem' }}>
                 <button onClick={onBackToInput} className="button button-secondary" style={{marginBottom: '1rem'}}>
                     <ArrowLeftIcon />
                     Back to Data Input
                 </button>
                 <h1 style={{margin: 0}}>{reportData.companyName}</h1>
                 <p style={{color: 'var(--color-text-secondary)', marginTop: '0.25rem', fontSize: '1.1rem'}}>{reportTitle}</p>
            </header>

             <div className="dashboard">
                <nav className="dashboard-nav">
                     <div className="card" style={{padding: '0.75rem'}}>
                        <h3 style={{padding: '0.5rem 0.5rem 0.75rem 0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.5rem'}}>Report Sections</h3>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                        {UAE_CONSTRUCTION_SECTIONS.map(section => {
                            if (section.id === 'five_year_forecast' && !reportData.forecastAssumptions.forecastEnabled) {
                                return null;
                            }
                            const Icon = section.icon;
                            const isActive = activeSectionId === section.id;
                            const status = progress[section.id];
                            
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSectionId(section.id)}
                                    className={`button ${isActive ? 'button-primary' : ''}`}
                                    style={{
                                      justifyContent: 'flex-start',
                                      width: '100%',
                                      backgroundColor: isActive ? '' : 'transparent',
                                      color: isActive ? '' : 'var(--color-text-secondary)',
                                      border: 'none',
                                      fontWeight: 500,
                                    }}
                                >
                                    <Icon style={{width: '18px', height: '18px'}}/>
                                    <span style={{flexGrow: 1, textAlign: 'left'}}>{section.name}</span>
                                    {status === 'loading' && <Spinner />}
                                    {status === 'success' && <CheckCircleIcon style={{color: 'var(--color-success)', width: '18px', height: '18px'}} />}
                                    {status === 'error' && <XIcon style={{color: 'var(--color-error)', width: '18px', height: '18px'}} />}
                                </button>
                            );
                        })}
                        </div>
                    </div>
                </nav>
            
                <div className="dashboard-content" id="report-content">
                    {renderSectionContent()}
                     <div style={{marginTop: '2rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'}}>
                        {narrative && <ExportControls 
                            narrative={narrative} 
                            companyName={reportData.companyName} 
                            reportData={reportData}
                            onPdfExport={handlePdfExport}
                            isPdfExporting={isPdfExporting}
                        />}
                        <div style={{textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-secondary)'}}>
                            <p style={{fontWeight: 600, margin: 0}}>Disclaimer</p>
                            <p style={{margin: '4px 0 0 0'}}>For informational purposes only. Not audit, legal, or tax advice. Verify all outputs.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UaeConstructionReportDashboard;
