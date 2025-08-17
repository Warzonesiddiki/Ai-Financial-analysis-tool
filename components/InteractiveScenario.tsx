
import React, { useState, useMemo } from 'react';
import { SectionAnalysis, PeriodData } from '../types';
import { StatCard } from './StatCard';

interface InteractiveScenarioProps {
    initialAnalysis: SectionAnalysis;
    latestPeriod: PeriodData;
    currency: string;
}

const safeParse = (value: string | number): number => {
    if (typeof value === 'number') return value;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
};

const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        notation: 'compact',
        compactDisplay: 'short'
    }).format(value);
};

const InteractiveScenario: React.FC<InteractiveScenarioProps> = ({ initialAnalysis, latestPeriod, currency }) => {
    const initialRevenueGrowth = initialAnalysis.quantitativeData?.keyMetrics?.find(m => m.label.includes('Projected Revenue')) ? parseFloat(initialAnalysis.quantitativeData.keyMetrics[0].value.replace(/[^0-9.-]+/g,"")) : 10;
    
    const [revenueGrowth, setRevenueGrowth] = useState(10);
    const [cogsPercentage, setCogsPercentage] = useState(45);
    const [opexGrowth, setOpexGrowth] = useState(5);

    const proFormaData = useMemo(() => {
        const lastRevenue = safeParse(latestPeriod.incomeStatement.revenueSaleOfGoods) + safeParse(latestPeriod.incomeStatement.revenueServices) + safeParse(latestPeriod.incomeStatement.revenueRental) + safeParse(latestPeriod.incomeStatement.otherIncome);
        const lastOpex = safeParse(latestPeriod.incomeStatement.staffSalariesAdmin) + safeParse(latestPeriod.incomeStatement.rentExpenseAdmin) + safeParse(latestPeriod.incomeStatement.utilities) + safeParse(latestPeriod.incomeStatement.marketingAdvertising) + safeParse(latestPeriod.incomeStatement.legalProfessionalFees) + safeParse(latestPeriod.incomeStatement.otherGAndA);
        const lastDepreciation = safeParse(latestPeriod.incomeStatement.depreciationAmortization);
        const lastTax = safeParse(latestPeriod.incomeStatement.incomeTaxExpense);

        const projectedRevenue = lastRevenue * (1 + revenueGrowth / 100);
        const projectedCogs = projectedRevenue * (cogsPercentage / 100);
        const projectedGrossProfit = projectedRevenue - projectedCogs;
        const projectedOpex = lastOpex * (1 + opexGrowth / 100);
        
        const projectedOperatingProfit = projectedGrossProfit - projectedOpex - lastDepreciation;
        const projectedEbitda = projectedOperatingProfit + lastDepreciation;
        const projectedNetIncome = projectedOperatingProfit - lastTax; // Simplified tax calculation

        return {
            projectedRevenue: { label: 'Projected Revenue', value: formatCurrency(projectedRevenue, currency) },
            projectedNetIncome: { label: 'Projected Net Income', value: formatCurrency(projectedNetIncome, currency) },
            projectedEbitda: { label: 'Projected EBITDA', value: formatCurrency(projectedEbitda, currency) },
        };
    }, [revenueGrowth, cogsPercentage, opexGrowth, latestPeriod, currency]);

    return (
        <div className="card">
            <h4 style={{ marginBottom: '1.5rem' }}>Interactive What-If Analysis</h4>
            <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
                <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Revenue Growth</span>
                        <span style={{fontWeight: 700, color: 'var(--color-primary)'}}>{revenueGrowth}%</span>
                    </label>
                    <input type="range" min=" -20" max="50" value={revenueGrowth} onChange={e => setRevenueGrowth(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>COGS (% of Revenue)</span>
                        <span style={{fontWeight: 700, color: 'var(--color-primary)'}}>{cogsPercentage}%</span>
                    </label>
                    <input type="range" min="20" max="80" value={cogsPercentage} onChange={e => setCogsPercentage(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>OpEx Growth</span>
                        <span style={{fontWeight: 700, color: 'var(--color-primary)'}}>{opexGrowth}%</span>
                    </label>
                    <input type="range" min="-10" max="30" value={opexGrowth} onChange={e => setOpexGrowth(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
            </div>
            <div className="grid grid-cols-3" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                <StatCard metric={proFormaData.projectedRevenue} />
                <StatCard metric={proFormaData.projectedNetIncome} />
                <StatCard metric={proFormaData.projectedEbitda} />
            </div>
        </div>
    );
};

export default InteractiveScenario;
