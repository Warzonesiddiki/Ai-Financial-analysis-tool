import React, { useState, useMemo } from 'react';
import { InventoryNarrativeResponse, InventoryReportData, InventoryReportSection, ABCAnalysisResult, InventoryRecommendation } from '../types';
import { Spinner } from './Spinner';
import { StatCard } from './StatCard';
import { ArrowLeftIcon, AlertTriangleIcon, CheckCircleIcon, XIcon } from './icons';
import { INVENTORY_SECTIONS } from '../constants';
import { NarrativeDisplay } from './NarrativeDisplay';
import { SimplePieChart } from './charts/SimplePieChart';

type ProgressState = { [key: string]: 'pending' | 'loading' | 'success' | 'error' };

interface InventoryReportDashboardProps {
    narrative: InventoryNarrativeResponse | null;
    reportData: InventoryReportData;
    isLoading: boolean;
    progress: ProgressState;
    onBackToInput: () => void;
}

const ABCTable: React.FC<{ title: string, data: ABCAnalysisResult[], currency: string }> = ({ title, data, currency }) => (
    <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>{title}</h3>
        <table className="styled-table">
            <thead>
                <tr>
                    <th>Category</th>
                    <th>SKU</th>
                    <th>Description</th>
                    <th>Value</th>
                    <th>% of Total</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item, index) => (
                    <tr key={index}>
                        <td style={{ fontWeight: 600, textAlign: 'center' }}>
                            <span style={{
                                backgroundColor: item.category === 'A' ? 'var(--color-error)' : item.category === 'B' ? 'var(--color-warning)' : 'var(--color-success)',
                                color: 'white',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '0.8rem'
                            }}>{item.category}</span>
                        </td>
                        <td style={{ fontFamily: 'monospace' }}>{item.sku}</td>
                        <td>{item.description}</td>
                        <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(item.value)}</td>
                        <td>{item.percentageOfTotalValue.toFixed(1)}%</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const RecommendationTable: React.FC<{ data: InventoryRecommendation[] }> = ({ data }) => (
    <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Reorder Recommendations</h3>
        <table className="styled-table">
            <thead>
                <tr>
                    <th>SKU</th>
                    <th>Recommendation</th>
                    <th>Reason</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item, index) => (
                    <tr key={index}>
                        <td style={{ fontFamily: 'monospace' }}>{item.sku}</td>
                        <td style={{ fontWeight: 600 }}>{item.recommendation}</td>
                        <td>{item.reason}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


const InventoryReportDashboard: React.FC<InventoryReportDashboardProps> = ({ narrative, reportData, isLoading, progress, onBackToInput }) => {
    const [activeSectionId, setActiveSectionId] = useState<string>(INVENTORY_SECTIONS[0].id);

    const activeSectionData = useMemo(() => {
        return narrative?.sections.find(s => s.id === activeSectionId);
    }, [narrative?.sections, activeSectionId]);

    const renderSectionContent = () => {
        if (!activeSectionData || !activeSectionData.analysis) {
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
                    <p style={{color: 'var(--color-error)'}}>{analysis.narrative || "The AI could not generate an analysis for this section."}</p>
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

                {analysis.charts && analysis.charts[0] && (
                    <div className="card"><SimplePieChart data={analysis.charts[0].data} /></div>
                )}
                
                {analysis.abcAnalysisResults && <ABCTable title="ABC Analysis Results" data={analysis.abcAnalysisResults} currency={reportData.currency} />}
                {analysis.inventoryRecommendations && <RecommendationTable data={analysis.inventoryRecommendations} />}

                <div className="card">
                    <NarrativeDisplay analysis={analysis} />
                </div>
            </div>
        );
    };

    return (
        <div id="report-container">
            <header style={{marginBottom: '1.5rem'}}>
                 <button onClick={onBackToInput} className="button button-secondary" style={{marginBottom: '1rem'}}>
                     <ArrowLeftIcon />
                     Back to Data Input
                 </button>
                 <h1 style={{margin: 0}}>{reportData.companyName}</h1>
                 <p style={{color: 'var(--color-text-secondary)', marginTop: '0.25rem', fontSize: '1.1rem'}}>Inventory Management Analysis (as of {reportData.periods[0].periodLabel})</p>
            </header>

            <div className="dashboard">
                <nav className="dashboard-nav">
                     <div className="card" style={{padding: '0.75rem'}}>
                        <h3 style={{padding: '0.5rem 0.5rem 0.75rem 0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.5rem'}}>Report Sections</h3>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                        {INVENTORY_SECTIONS.map(section => {
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
                                    {status === 'pending' ? <span style={{fontSize: '0.8rem', color: 'var(--color-text-secondary)'}}></span> : null}
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
                </div>
            </div>
        </div>
    );
};

export default InventoryReportDashboard;