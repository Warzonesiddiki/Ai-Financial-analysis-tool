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

export interface DashboardAnalysis {
  cfoBriefing: string;
  strategicRecommendations: string[];
}

export interface ChatMessage {
    role: 'user' | 'model' | 'loading';
    content: string;
}

// --- NEW MULTI-ENTITY & TAX ---
export interface Entity {
    id: string;
    name: string;
    parentId?: string;
    currency: string;
    taxJurisdiction: string; // e.g., 'UAE', 'KSA', 'US-CA'
    primaryLocationId?: string; // For inventory
}

export interface TaxCode {
    id: string;
    name: string; // e.g., 'VAT 5%', 'Sales Tax 8.25%'
    rate: number; // e.g., 0.05 for 5%
    jurisdiction: string;
}
export interface KPIDeepDiveResponse {
    narrative: string;
    chart: Chart;
}

// --- NEW MULTI-CURRENCY ---
export interface CurrencyExchangeRate {
    from: string; // e.g., 'USD'
    to: string;   // e.g., 'AED'
    rate: number;
    date: string; // YYYY-MM-DD
}

// --- NEW MULTI-LOCATION INVENTORY ---
export interface Location {
    id: string;
    name: string;
    address: string;
    entityId: string;
}

export interface StockTransfer {
    id: string;
    fromLocationId: string;
    toLocationId: string;
    date: string;
    items: { productId: string; quantity: number; }[];
    status: 'Pending' | 'Completed';
    entityId: string;
}

// --- NEW GOODS RECEIPT ---
export interface GoodsReceiptNoteLineItem {
    id: string;
    purchaseOrderLineId: string;
    productId: string;
    quantityOrdered: number;
    quantityReceived: number;
}

export interface GoodsReceiptNote {
    id: string;
    purchaseOrderId: string;
    locationId: string;
    receiptDate: string;
    status: 'Pending' | 'Completed';
    lineItems: GoodsReceiptNoteLineItem[];
    entityId: string;
}


// --- AUTOMATION & GOVERNANCE TYPES ---

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface AIPolicy {
  id: 'autoCategorizeConfidence' | 'autoReconcileLimit';
  name: string;
  description: string;
  value: number;
  type: 'percentage' | 'currency';
}

export type NotificationType = 'info' | 'warning' | 'action_required' | 'success';

export interface Notification {
  id: string;
  timestamp: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  link?: string;
}

export interface ApprovalWorkflowRule {
    id: string;
    minAmount: number;
    maxAmount?: number; // Optional, for ranges
    requiredApprovers: string[]; // For simplicity, using roles as strings
}

export interface ApprovalWorkflow {
    id: string;
    name: string;
    rules: ApprovalWorkflowRule[];
}


// --- BOOKKEEPING MODULE TYPES ---

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';

export interface ChartOfAccount {
  id: string;
  accountNumber?: string;
  name: string;
  type: AccountType;
  description: string;
  parentId?: string;
  isArchived?: boolean;
}

export interface ReportAccountNode extends ChartOfAccount {
    children: ReportAccountNode[];
    total: number;
    depth: number;
}


export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  accountId: string; // foreign key to ChartOfAccount
  amount: number; // in transaction currency
  entityId: string;
  currency: string; // e.g., USD, AED
  exchangeRate: number; // rate to base currency
  baseCurrencyAmount: number; // amount in base currency
  attachmentUrl?: string; // URL to the receipt/invoice
  attachmentFilename?: string;
  reconciliationStatus?: 'reconciled' | 'unreconciled';
  matchedBankTxId?: string;
  reviewedBy?: 'user' | 'ai';
  confidenceScore?: number;
}

export interface AIBookkeepingSummary {
  summary: string;
  observations: string[];
  suggestion: string;
}

export interface CategorizationRule {
  id: string;
  keyword: string; // The text to look for in a transaction description
  accountId: string; // The account to assign if the keyword is found
}

export type ActivityAction = 'create' | 'update' | 'delete';

export interface ActivityLogEntry {
  id: string;
  timestamp: string; // ISO 8601 format
  action: ActivityAction;
  description: string;
}

export interface AIPnlSummary {
  headline: string;
  takeaways: string[];
}

export interface AIBalanceSheetSummary {
  headline: string;
  takeaways: string[];
}

export type Budgets = Record<string, number>; // key: accountId

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  description: string;
  accountId: string;
  amount: number; // same sign convention as Transaction
  frequency: Frequency;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  nextDueDate: string; // YYYY-MM-DD
  entityId: string;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue';

export interface Customer {
  id: string;
  name: string;
  email: string;
  address: string;
  defaultPaymentTerms?: string;
  entityId: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  productId?: string;
  taxCodeId?: string;
}

export interface ApprovalStep {
  approver: string; // Can be a user ID or a role like 'Manager'
  decision: 'Approved' | 'Rejected' | 'Pending';
  timestamp: string;
  notes?: string;
}

export interface InvoicePayment {
    id: string;
    date: string;
    amount: number;
    reference?: string;
}

export interface Invoice {
  id: string; // e.g., INV-001
  customerId: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  lineItems: InvoiceLineItem[];
  status: InvoiceStatus;
  entityId: string;
  currency: string;
  exchangeRate: number;
  baseCurrencyAmount: number;
  approvalHistory?: ApprovalStep[];
  payments?: InvoicePayment[];
}

export type BillStatus = 'Draft' | 'Awaiting Approval' | 'Awaiting Payment' | 'Processing Payment' | 'Paid' | 'Overdue';

export type PurchaseOrderStatus = 'Draft' | 'Awaiting Approval' | 'Approved' | 'Partially Received' | 'Fully Received' | 'Closed' | 'Rejected';

export interface Vendor {
  id: string;
  name: string;
  email: string;
  address: string;
  defaultGLAccount?: string;
  entityId: string;
}

export interface PurchaseOrderLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  accountId: string;
  productId?: string;
  taxCodeId?: string;
}

export interface PurchaseOrder {
  id: string; // e.g., PO-001
  vendorId: string;
  poDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  lineItems: PurchaseOrderLineItem[];
  status: PurchaseOrderStatus;
  entityId: string;
  currency: string;
  exchangeRate: number;
  baseCurrencyAmount: number;
  approvalHistory?: ApprovalStep[];
}

export interface BillLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  accountId: string; // Foreign key to an Expense ChartOfAccount
  productId?: string;
  purchaseOrderLineId?: string;
  taxCodeId?: string;
}

export interface Bill {
  id: string; // e.g., BILL-001
  vendorId: string;
  billDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  lineItems: BillLineItem[];
  status: BillStatus;
  entityId: string;
  currency: string;
  exchangeRate: number;
  baseCurrencyAmount: number;
  approvalHistory?: ApprovalStep[];
  purchaseOrderId?: string;
  goodsReceiptNoteId?: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  bankAccountId: string;
  status?: 'reconciled' | 'unreconciled';
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  purchasePrice: number;
  salePrice: number;
  reorderPoint?: number;
  entityId: string;
}

export interface InventoryItem {
  productId: string;
  locationId: string;
  quantity: number;
}

export type MatchSuggestion = {
    type: 'match';
    bookTransactionId: string;
} | {
    type: 'create';
    suggestedAccountId: string;
};

export type PayType = 'salary' | 'hourly';

export interface Employee {
  id: string;
  name: string;
  email: string;
  payType: PayType;
  payRate: number; // Annual salary or hourly rate
  entityId: string;
}

export interface EmployeePayment {
  employeeId: string;
  hoursWorked?: number; // Only for hourly
  grossPay: number;
}

export interface PayRun {
  id: string;
  payPeriodStart: string; // YYYY-MM-DD
  payPeriodEnd: string; // YYYY-MM-DD
  paymentDate: string; // YYYY-MM-DD
  status: 'draft' | 'approved';
  payments: EmployeePayment[];
  entityId: string;
}

export type InsightType = 'cash_flow' | 'overdue' | 'budget' | 'large_expense' | 'inventory' | 'general';
export type InsightSeverity = 'Critical' | 'Warning' | 'Info';

export interface InsightCard {
    type: InsightType;
    severity: InsightSeverity;
    title: string;
    description: string;
    link?: string; // e.g., 'bookkeeping/sales'
}

export interface ManualAdjustment {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive for inflow, negative for outflow
}

export interface ForecastPeriod {
  week: string; // e.g., "Jul 15-21"
  inflows: number;
  outflows: number;
  netChange: number;
  endingBalance: number;
}

export interface CashFlowForecast {
  narrative: string;
  startingBalance: number;
  forecast: ForecastPeriod[];
}

export interface StatementOfCashFlowsData {
    // Operating
    netIncome: number;
    depreciationAndAmortization: number;
    changeInAccountsReceivable: number;
    changeInInventory: number;
    changeInAccountsPayable: number;
    cashFromOperations: number;
    // Investing
    cashFromInvesting: number;
    // Financing
    cashFromFinancing: number;
    // Summary
    netChangeInCash: number;
    startCash: number;
    endCash: number;
}

// New types for Banking AI Analysis
export type AIBankFeedInsightType = 'CREATE_RULE' | 'RECURRING_PAYMENT';

export interface AIBankFeedInsight {
  id: string;
  type: AIBankFeedInsightType;
  title: string;
  description: string;
  data: {
    keyword?: string; // for CREATE_RULE
    suggestedAccountId?: string; // for CREATE_RULE
    amount?: number; // for RECURRING_PAYMENT
    frequency?: 'weekly' | 'monthly'; // for RECURRING_PAYMENT
  };
}

// New types for Payment Processing
export interface PaymentRun {
    id: string;
    creationDate: string;
    paymentDate: string;
    status: 'Pending' | 'Processing' | 'Completed';
    billIds: string[];
    entityId: string;
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
    qualitativeAssumptions?: string;
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
  dashboardAnalysis?: DashboardAnalysis;
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
        qualitativeAssumptions: '',
    },
    marketValuation: '',
    competitors: [],
};