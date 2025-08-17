// types.ts
import React from 'react';

// --- SHARED & BASE TYPES ---

export interface KeyMetric {
    label: string;
    value: string;
    change?: number; // percentage change from prior period
    trend?: 'positive' | 'negative' | 'neutral';
}

export interface ChartDataPoint {
  label: string;
  value: number;
  series?: string;
  type?: 'positive' | 'negative' | 'total'; // For waterfall
}
export interface Chart {
  type: 'bar' | 'pie' | 'line' | 'waterfall';
  title: string;
  data: ChartDataPoint[];
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export interface QuantitativeData {
    keyMetrics?: KeyMetric[];
    charts?: Chart[];
}

export interface SectionAnalysis {
  headline: string;
  takeaways: string[];
  narrative: string;
  quantitativeData: QuantitativeData;
  sources?: GroundingSource[];
  confidence?: 'High' | 'Medium' | 'Low';
}

export interface ChatMessage {
    role: 'user' | 'model' | 'loading';
    content: string;
}

// --- COMPREHENSIVE FINANCIAL ANALYSIS TYPES ---

export interface SegmentData {
    id: string;
    name: string;
    revenue: string;
    profit: string;
}

export interface EsgData {
    co2Emissions: string; // in tonnes
    waterUsage: string; // in cubic meters
    employeeTurnover: string; // percentage
    genderDiversity: string; // percentage female/non-binary
}

export interface BudgetData {
    revenue: string;
    cogs: string;
    opex: string;
}

export interface BankAccount {
  id: string;
  name: string;
  balance: string;
}

export interface PpeItem {
  id:string;
  description: string;
  cost: string;
  accumulatedDepreciation: string;
}

export interface IncomeStatementData {
  revenueSaleOfGoods: string;
  revenueServices: string;
  revenueRental: string;
  otherIncome: string;
  materialCost: string;
  directLabor: string;
  subcontractorCosts: string;
  directEquipmentCost: string;
  otherDirectCosts: string;
  staffSalariesAdmin: string;
  rentExpenseAdmin: string;
  utilities: string;
  marketingAdvertising: string;
  legalProfessionalFees: string;
  depreciationAmortization: string;
  incomeTaxExpense: string;
  otherGAndA: string;
}

export interface BalanceSheetData {
  bankAccounts: BankAccount[];
  cashAndBankBalances: string;
  accountsReceivable: string;
  inventory: string;
  prepayments: string;
  otherCurrentAssets: string;
  ppeSchedule: PpeItem[];
  propertyPlantEquipmentNet: string;
  intangibleAssets: string;
  investmentProperties: string;
  longTermInvestments: string;
  accountsPayable: string;
  accruedExpenses: string;
  shortTermLoans: string;
  currentPortionOfLTDebt: string;
  longTermLoans: string;
  leaseLiabilities: string;
  deferredTaxLiability: string;
  shareCapital: string;
  retainedEarnings: string;
  otherReserves: string;
}

export interface CashFlowData {
  netIncome: string;
  depreciationAmortization: string;
  changesInWorkingCapital: string;
  capitalExpenditures: string;
  saleOfAssets: string;
  issuanceOfDebt: string;
  repaymentOfDebt: string;
  issuanceOfEquity: string;
  dividendsPaid: string;
}

export interface PeriodData {
  periodLabel: string;
  sharesOutstanding: string;
  incomeStatement: IncomeStatementData;
  balanceSheet: BalanceSheetData;
  cashFlow: CashFlowData;
  segments: SegmentData[];
  esg: EsgData;
  budget: BudgetData;
}

export interface ScenarioData {
    revenueGrowth: string;
    cogsPercentage: string;
    opexGrowth: string;
}

export interface ReportData {
  companyName: string;
  currency: string;
  periodType: 'Monthly' | 'Yearly';
  periods: PeriodData[];
  industries: string[];
  companyLogo?: string;
  scenario: ScenarioData;
  marketValuation: string;
  competitors: string[];
}

export interface ReportSection {
    id: string;
    name: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    analysis: SectionAnalysis;
}

export interface AINarrativeResponse {
  sections: ReportSection[];
}

// --- INITIAL STATE FACTORIES ---

export const createInitialPeriod = (): PeriodData => ({
  periodLabel: new Date().getFullYear().toString(),
  sharesOutstanding: '',
  incomeStatement: {
    revenueSaleOfGoods: '', revenueServices: '', revenueRental: '', otherIncome: '',
    materialCost: '', directLabor: '', subcontractorCosts: '', directEquipmentCost: '', otherDirectCosts: '',
    staffSalariesAdmin: '', rentExpenseAdmin: '', utilities: '', marketingAdvertising: '', legalProfessionalFees: '', depreciationAmortization: '', incomeTaxExpense: '', otherGAndA: '',
  },
  balanceSheet: {
    bankAccounts: [], cashAndBankBalances: '', accountsReceivable: '', inventory: '', prepayments: '', otherCurrentAssets: '',
    ppeSchedule: [], propertyPlantEquipmentNet: '', intangibleAssets: '', investmentProperties: '', longTermInvestments: '',
    accountsPayable: '', accruedExpenses: '', shortTermLoans: '', currentPortionOfLTDebt: '', longTermLoans: '', leaseLiabilities: '', deferredTaxLiability: '',
    shareCapital: '', retainedEarnings: '', otherReserves: '',
  },
  cashFlow: {
    netIncome: '', depreciationAmortization: '', changesInWorkingCapital: '',
    capitalExpenditures: '', saleOfAssets: '',
    issuanceOfDebt: '', repaymentOfDebt: '', issuanceOfEquity: '', dividendsPaid: '',
  },
  segments: [],
  esg: { co2Emissions: '', waterUsage: '', employeeTurnover: '', genderDiversity: '' },
  budget: { revenue: '', cogs: '', opex: '' }
});

export const initialReportData: ReportData = {
    companyName: 'Phoenix G',
    currency: 'USD',
    periodType: 'Yearly',
    periods: [createInitialPeriod()],
    industries: [],
    companyLogo: '',
    scenario: {
        revenueGrowth: '',
        cogsPercentage: '',
        opexGrowth: '',
    },
    marketValuation: '',
    competitors: [],
};