
import React, { useState, useCallback } from 'react';
import { UaeProjectReportData, ProjectData, ProjectYearData, createInitialProject, createInitialProjectYear } from '../types';
import { Spinner } from './Spinner';
import { AlertTriangleIcon, TrashIcon, XIcon } from './icons';
import CollapsibleSection from './CollapsibleSection';
import { demoUaeConstructionReportData } from '../demoData';

interface UaeConstructionDataInputProps {
    reportData: UaeProjectReportData;
    setReportData: React.Dispatch<React.SetStateAction<UaeProjectReportData>>;
    onGenerate: () => void;
    isLoading: boolean;
    error: string | null;
    onBack: () => void;
}

const UaeConstructionDataInput: React.FC<UaeConstructionDataInputProps> = ({ reportData, setReportData, onGenerate, isLoading, error, onBack }) => {

    const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setReportData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLoadDemoData = useCallback(() => {
        setReportData(demoUaeConstructionReportData);
    }, [setReportData]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReportData(prev => ({ ...prev, companyLogo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProjectChange = (projectId: string, field: keyof Omit<ProjectData, 'id' | 'financials'>, value: string) => {
        setReportData(prev => ({
            ...prev,
            projects: prev.projects.map(p => p.id === projectId ? { ...p, [field]: value } : p)
        }));
    };

    const addProject = () => {
        setReportData(prev => ({
            ...prev,
            projects: [...prev.projects, createInitialProject()]
        }));
    };

    const removeProject = (projectId: string) => {
        if (reportData.projects.length <= 1) return;
        setReportData(prev => ({
            ...prev,
            projects: prev.projects.filter(p => p.id !== projectId)
        }));
    };

    const handleProjectYearChange = (projectId: string, yearId: string, field: keyof Omit<ProjectYearData, 'id' | 'grossProfit'>, value: string) => {
        setReportData(prev => ({
            ...prev,
            projects: prev.projects.map(p => {
                if (p.id === projectId) {
                    const newFinancials = p.financials.map(fy => {
                        if (fy.id === yearId) {
                            const updated = { ...fy, [field]: value };
                            if (field === 'revenue' || field === 'costOfSales') {
                                const revenue = parseFloat(updated.revenue) || 0;
                                const cost = parseFloat(updated.costOfSales) || 0;
                                updated.grossProfit = (revenue - cost).toString();
                            }
                            return updated;
                        }
                        return fy;
                    });
                    return { ...p, financials: newFinancials };
                }
                return p;
            })
        }));
    };
    
    const addProjectYear = (projectId: string) => {
        setReportData(prev => ({
            ...prev,
            projects: prev.projects.map(p => {
                if (p.id === projectId) {
                    const lastYear = p.financials.length > 0 ? parseInt(p.financials[0].year) : new Date().getFullYear() - 1;
                    const newYear = createInitialProjectYear((lastYear + 1).toString());
                    const sorted = [...p.financials, newYear].sort((a,b) => parseInt(b.year) - parseInt(a.year));
                    return { ...p, financials: sorted };
                }
                return p;
            })
        }));
    };

    const removeProjectYear = (projectId: string, yearId: string) => {
        setReportData(prev => ({
            ...prev,
            projects: prev.projects.map(p => {
                if (p.id === projectId) {
                    if (p.financials.length <= 1) return p;
                    return { ...p, financials: p.financials.filter(fy => fy.id !== yearId) };
                }
                return p;
            })
        }));
    };

    const handleForecastChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setReportData(prev => ({
            ...prev,
            forecastAssumptions: {
                ...prev.forecastAssumptions,
                [name]: type === 'checkbox' ? checked : value
            }
        }));
    };
    
    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h2>UAE Construction Project Analysis - Data Input</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                    Enter financials for multiple projects over multiple years to get a detailed portfolio analysis and forecast.
                </p>
            </header>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <button onClick={onBack} className="button button-secondary">Back to Selector</button>
                    <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                         <button onClick={handleLoadDemoData} className="button button-secondary">Load Demo Data</button>
                        <button onClick={onGenerate} disabled={isLoading} className="button button-primary" style={{ minWidth: '220px' }}>
                            {isLoading ? <Spinner /> : <span>Analyze & Generate Report</span>}
                        </button>
                    </div>
                </div>
                {error && (
                    <div className="card" style={{ borderColor: 'var(--color-error)', backgroundColor: '#fef2f2', marginTop: '1rem' }}>
                        <h4 style={{ color: 'var(--color-error)' }}><AlertTriangleIcon style={{ display: 'inline-block', marginRight: '8px' }} /> Error</h4>
                        <p style={{ color: '#b91c1c' }}>{error}</p>
                    </div>
                )}
            </div>
            
            <div className="card">
                <CollapsibleSection title="Company Setup & Forecast" defaultOpen>
                     <div className="grid grid-cols-2" style={{ marginTop: '1rem', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="companyName">Company Name</label>
                            <input type="text" name="companyName" id="companyName" value={reportData.companyName} onChange={handleCompanyChange} className="input" />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="currency">Currency</label>
                            <input type="text" name="currency" id="currency" value={reportData.currency} onChange={handleCompanyChange} className="input" />
                        </div>
                        <div className="form-group">
                             <label className="form-label">Company Logo</label>
                             <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                                <div style={{width: '64px', height: '64px', border: '1px solid var(--color-border)', borderRadius: '4px', display:'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb'}}>
                                    {reportData.companyLogo ? <img src={reportData.companyLogo} alt="Company Logo" style={{height: '100%', width:'100%', objectFit: 'contain', padding: '4px'}} /> : <span style={{fontSize:'12px', color: 'var(--color-text-secondary)'}}>No Logo</span>}
                                </div>
                                <input type="file" onChange={handleLogoChange} accept="image/png, image/jpeg" />
                             </div>
                        </div>
                    </div>
                    <div className="form-group" style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1rem'}}>
                         <input type="checkbox" id="forecastEnabled" name="forecastEnabled" checked={reportData.forecastAssumptions.forecastEnabled} onChange={handleForecastChange} style={{width: 'auto'}}/>
                         <label htmlFor="forecastEnabled" style={{fontWeight: 500}}>Enable 5-Year AI Forecast</label>
                     </div>
                     {reportData.forecastAssumptions.forecastEnabled && (
                        <div className="grid grid-cols-2">
                            <div className="form-group">
                                <label className="form-label" htmlFor="revenueGrowthRate">Assumed Annual Portfolio Growth Rate (%)</label>
                                <input type="number" name="revenueGrowthRate" id="revenueGrowthRate" value={reportData.forecastAssumptions.revenueGrowthRate} onChange={handleForecastChange} className="input" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="expectedMargin">Expected Portfolio Gross Margin (%)</label>
                                <input type="number" name="expectedMargin" id="expectedMargin" value={reportData.forecastAssumptions.expectedMargin} onChange={handleForecastChange} className="input" />
                            </div>
                        </div>
                     )}
                </CollapsibleSection>
                
                <CollapsibleSection title="Project Portfolio" defaultOpen>
                    {reportData.projects.map(project => (
                        <div key={project.id} className="card" style={{marginBottom: '1rem', backgroundColor: '#f9fafb'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem'}}>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Downtown Tower" 
                                    value={project.name}
                                    onChange={(e) => handleProjectChange(project.id, 'name', e.target.value)}
                                    className="input"
                                    style={{fontSize: '1.1rem', fontWeight: '600', border: 'none', padding: '0'}}
                                />
                                {reportData.projects.length > 1 &&
                                    <button onClick={() => removeProject(project.id)} className="button button-secondary"><TrashIcon width="16" height="16" /></button>
                                }
                            </div>
                            
                            <div className="grid grid-cols-3" style={{gap: '1rem'}}>
                                <div className="form-group">
                                    <label className="form-label">Total Contract Value</label>
                                    <input type="number" value={project.totalContractValue} onChange={(e) => handleProjectChange(project.id, 'totalContractValue', e.target.value)} className="input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Completion %</label>
                                    <input type="number" value={project.completionPercentage} onChange={(e) => handleProjectChange(project.id, 'completionPercentage', e.target.value)} className="input" />
                                </div>
                                <div className="form-group" style={{gridColumn: 'span 3'}}>
                                    <label className="form-label">Key Milestone / Risk</label>
                                    <input type="text" value={project.keyMilestoneOrRisk} onChange={(e) => handleProjectChange(project.id, 'keyMilestoneOrRisk', e.target.value)} className="input" />
                                </div>
                            </div>


                            <CollapsibleSection title="Annual Financials">
                                 <div className="grid" style={{ gridTemplateColumns: '1fr 2fr 2fr 2fr auto', gap: '1rem', alignItems: 'center', marginTop: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                                    <span>Year</span><span>Revenue</span><span>Cost of Sales</span><span>Gross Profit</span><span></span>
                                </div>
                                {project.financials.map(fy => (
                                    <div key={fy.id} className="grid" style={{ gridTemplateColumns: '1fr 2fr 2fr 2fr auto', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <input type="number" placeholder="YYYY" value={fy.year} onChange={e => handleProjectYearChange(project.id, fy.id, 'year', e.target.value)} className="input" style={{ fontWeight: 600 }} />
                                        <input type="number" value={fy.revenue} onChange={e => handleProjectYearChange(project.id, fy.id, 'revenue', e.target.value)} className="input" />
                                        <input type="number" value={fy.costOfSales} onChange={e => handleProjectYearChange(project.id, fy.id, 'costOfSales', e.target.value)} className="input" />
                                        <input type="number" value={fy.grossProfit} readOnly disabled className="input" />
                                        {project.financials.length > 1 && 
                                            <button onClick={() => removeProjectYear(project.id, fy.id)} className="button button-tertiary" style={{ padding: '0.25rem' }}><XIcon width="14" height="14" /></button>
                                        }
                                    </div>
                                ))}
                                <button onClick={() => addProjectYear(project.id)} className="button button-tertiary" style={{ marginTop: '0.5rem' }}>+ Add Year</button>
                            </CollapsibleSection>
                        </div>
                    ))}
                    <button onClick={addProject} className="button button-tertiary" style={{ marginTop: '1rem', border: '1px dashed var(--color-border)', width: '100%', padding: '1rem' }}>+ Add Project to Portfolio</button>
                </CollapsibleSection>
            </div>
        </div>
    );
};

export default UaeConstructionDataInput;
