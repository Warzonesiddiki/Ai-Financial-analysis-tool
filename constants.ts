
import {
    SummaryIcon, TrendingUpIcon, ScaleIcon, RepeatIcon, DollarSignIcon,
    PieChartIcon, TargetIcon, PercentIcon, DropletIcon, LandmarkIcon,
    ShieldIcon, GlobeIcon, UsersIcon, ShuffleIcon, HardHatIcon, ActivityIcon,
    ZapIcon, PackageIcon, TrendingDownIcon, UserPlusIcon, UserMinusIcon
} from './components/icons';

export const REPORT_SECTIONS = [
    { id: 'executive_summary', name: 'Executive Summary', icon: SummaryIcon },
    { id: 'profit_or_loss', name: 'Profit or Loss', icon: TrendingUpIcon },
    { id: 'financial_position', name: 'Financial Position', icon: ScaleIcon },
    { id: 'cash_flows', name: 'Cash Flows', icon: RepeatIcon },
    { id: 'key_ratios', name: 'Key Ratios', icon: PercentIcon },
    { id: 'budget_vs_actuals', name: 'Budget vs. Actuals', icon: TargetIcon },
    { id: 'revenue_deep_dive', name: 'Revenue Deep Dive', icon: DollarSignIcon },
    { id: 'cost_and_margin_analysis', name: 'Cost & Margin Analysis', icon: PieChartIcon },
    { id: 'working_capital', name: 'Working Capital', icon: DropletIcon },
    { id: 'debt_and_leverage', name: 'Debt & Leverage', icon: LandmarkIcon },
    { id: 'financial_risks', name: 'Financial Risks', icon: ShieldIcon },
    { id: 'esg_and_sustainability', name: 'ESG & Sustainability', icon: GlobeIcon },
    { id: 'competitor_benchmarking', name: 'Competitor Benchmarking', icon: UsersIcon },
    { id: 'market_and_ma_outlook', name: 'Market & M&A Outlook', icon: ShuffleIcon },
];

export const INDUSTRY_OPTIONS = [
    "Technology",
    "SaaS",
    "Healthcare",
    "Retail",
    "E-commerce",
    "Manufacturing",
    "Financial Services",
    "Professional Services",
    "Real Estate",
    "Energy",
    "Utilities",
    "Telecommunications",
    "Media & Entertainment"
];

export const SAAS_REPORT_SECTIONS = [
    { id: 'summary_dashboard', name: 'Summary Dashboard', icon: SummaryIcon },
    { id: 'mrr_deep_dive', name: 'MRR Deep Dive', icon: TrendingUpIcon },
    { id: 'customer_analysis', name: 'Customer Analysis', icon: UsersIcon },
    { id: 'unit_economics', name: 'Unit Economics (LTV/CAC)', icon: DollarSignIcon },
    { id: 'churn_analysis', name: 'Churn & Retention', icon: RepeatIcon },
    { id: 'magic_number', name: 'SaaS Magic Number', icon: ZapIcon },
    { id: 'revenue_composition', name: 'Revenue Composition', icon: PieChartIcon },
];

export const UAE_CONSTRUCTION_SECTIONS = [
    { id: 'executive_summary', name: 'Executive Summary', icon: SummaryIcon },
    { id: 'project_health_dashboard', name: 'Project Health Dashboard', icon: HardHatIcon },
    { id: 'portfolio_financials', name: 'Portfolio Financials', icon: TrendingUpIcon },
    { id: 'five_year_forecast', name: '5-Year Forecast', icon: DollarSignIcon },
    { id: 'risk_assessment', name: 'Risk Assessment', icon: ShieldIcon },
    { id: 'subcontractor_analysis', name: 'Subcontractor Analysis', icon: UsersIcon },
    { id: 'market_outlook', name: 'UAE Market Outlook', icon: GlobeIcon },
];

export const PROFESSIONAL_SERVICES_SECTIONS = [
    { id: 'executive_summary', name: 'Executive Summary', icon: SummaryIcon },
    { id: 'firm_profitability', name: 'Firm Profitability', icon: TrendingUpIcon },
    { id: 'service_line_analysis', name: 'Service Line Analysis', icon: PieChartIcon },
    { id: 'team_utilization', name: 'Team & Utilization', icon: UsersIcon },
    { id: 'client_concentration', name: 'Client Concentration', icon: TargetIcon },
];

export const AP_AR_SECTIONS = [
    { id: 'working_capital_summary', name: 'Working Capital Summary', icon: SummaryIcon },
    { id: 'cash_conversion_cycle', name: 'Cash Conversion Cycle', icon: RepeatIcon },
    { id: 'ar_aging_analysis', name: 'AR Aging & Collections', icon: TrendingUpIcon },
    { id: 'ap_aging_analysis', name: 'AP Aging & Payments', icon: TrendingDownIcon },
];

export const INVENTORY_SECTIONS = [
    { id: 'inventory_summary', name: 'Inventory Summary', icon: SummaryIcon },
    { id: 'inventory_turnover', name: 'Inventory Turnover', icon: RepeatIcon },
    { id: 'abc_analysis', name: 'ABC Analysis', icon: PieChartIcon },
    { id: 'stock_status', name: 'Stock Status & Obsoleteness', icon: PackageIcon },
    { id: 'reorder_recommendations', name: 'Reorder Recommendations', icon: ShuffleIcon },
];

export const HR_SECTIONS = [
    { id: 'workforce_summary', name: 'Workforce Summary', icon: SummaryIcon },
    { id: 'headcount_analysis', name: 'Headcount Analysis', icon: UsersIcon },
    { id: 'hires_vs_terminations', name: 'Hires vs. Terminations', icon: UserPlusIcon },
    { id: 'turnover_analysis', name: 'Turnover Analysis', icon: UserMinusIcon },
    { id: 'payroll_analysis', name: 'Payroll Analysis', icon: DollarSignIcon },
    { id: 'productivity_metrics', name: 'Productivity Metrics', icon: ActivityIcon },
];

export const CASH_FLOW_FORECAST_SECTIONS = [
    { id: 'forecast_summary', name: 'Forecast Summary', icon: SummaryIcon },
    { id: 'cash_runway', name: 'Cash Runway', icon: DropletIcon },
    { id: 'inflow_analysis', name: 'Inflow Analysis', icon: TrendingUpIcon },
    { id: 'outflow_analysis', name: 'Outflow Analysis', icon: TrendingDownIcon },
];