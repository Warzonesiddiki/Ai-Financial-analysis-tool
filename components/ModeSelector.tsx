import React from 'react';
import { BriefcaseIcon, HardHatIcon, ActivityIcon, LandmarkIcon, ReceiptIcon, PackageIcon, UsersIcon, DropletIcon } from './icons';

interface ModeSelectorProps {
    onSelect: (mode: 'financial' | 'construction' | 'saas' | 'services' | 'apar' | 'inventory' | 'hr' | 'cash_flow_forecast') => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelect }) => {
    
    const modes = [
        { 
            id: 'financial', 
            icon: BriefcaseIcon, 
            title: 'Comprehensive Financial Analysis', 
            description: 'For businesses with standard Income Statements, Balance Sheets, and Cash Flow data. Ideal for most industries like retail, manufacturing, and services.' 
        },
        { 
            id: 'saas', 
            icon: ActivityIcon, 
            title: 'SaaS & Subscription Analysis', 
            description: 'Analyzes key subscription metrics like MRR, Churn, LTV:CAC, and Magic Number. Perfect for SaaS, software, and other recurring revenue businesses.' 
        },
        {
            id: 'apar',
            icon: ReceiptIcon,
            title: 'AP/AR & Working Capital Analysis',
            description: 'A core ERP module. Analyze invoice aging, customer credit risk, and cash conversion cycles to optimize working capital. Ideal for any business managing receivables and payables.'
        },
         {
            id: 'inventory',
            icon: PackageIcon,
            title: 'Inventory Management Analysis',
            description: 'A classic ERP module. Perform ABC analysis, calculate turnover, identify obsolete stock, and get reorder recommendations. For retail, e-commerce, and manufacturing.'
        },
        {
            id: 'hr',
            icon: UsersIcon,
            title: 'HR & Payroll Analysis',
            description: 'Analyze headcount, turnover, payroll costs, and productivity metrics. A core ERP module for understanding your workforce dynamics and efficiency.'
        },
        { 
            id: 'cash_flow_forecast', 
            icon: DropletIcon, 
            title: 'Short-Term Cash Flow Forecast', 
            description: 'A forward-looking tool to project your cash balance over the next 13 weeks. Plan for inflows, outflows, and manage your cash runway proactively.' 
        },
        { 
            id: 'construction', 
            icon: HardHatIcon, 
            title: 'UAE Construction Project Analysis', 
            description: 'A specialized tool for project-based businesses, focusing on contract value, invoicing, costs, and retention. Tailored for construction and engineering in the UAE.' 
        },
        {
            id: 'services',
            icon: LandmarkIcon,
            title: 'Professional Services Firm Analysis',
            description: 'For consulting, accounting, or audit firms. Analyzes service line profitability, staff utilization, and client concentration. Includes UAE compliance context.'
        }
    ];

    return (
        <div style={{ maxWidth: '1200px', margin: '2rem auto' }}>
            <header style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                <h2>Select an Analysis Module</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                    Choose the specialized tool that best fits your business model and data.
                </p>
            </header>

            <div className="grid grid-cols-3" style={{gap: '2rem'}}>
                {modes.map(mode => {
                    const Icon = mode.icon;
                    return (
                        <div key={mode.id} className="mode-selector-card" onClick={() => onSelect(mode.id as any)}>
                            <Icon width={48} height={48} />
                            <h3 style={{marginTop: '1.5rem'}}>{mode.title}</h3>
                            <p style={{ color: 'var(--color-text-secondary)', flexGrow: 1, minHeight: '100px' }}>
                               {mode.description}
                            </p>
                            <button className="button button-secondary" style={{width: '100%', marginTop: '1rem'}}>Select Module</button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ModeSelector;