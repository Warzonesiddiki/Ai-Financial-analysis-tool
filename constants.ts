
import {
    SummaryIcon, TrendingUpIcon, ScaleIcon, RepeatIcon, DollarSignIcon,
    PieChartIcon, TargetIcon, PercentIcon, DropletIcon, LandmarkIcon,
    ShieldIcon, GlobeIcon, UsersIcon, LayersIcon, ActivityIcon, ZapIcon,
    BookIcon, BriefcaseIcon
} from './components/icons';

export const REPORT_SECTIONS = [
    { id: 'executive_summary', name: 'Executive Summary', icon: SummaryIcon },
    { id: 'profit_or_loss', name: 'Profit or Loss', icon: TrendingUpIcon },
    { id: 'financial_position', name: 'Financial Position', icon: ScaleIcon },
    { id: 'cash_flows', name: 'Cash Flows', icon: RepeatIcon },
    { id: 'common_size_analysis', name: 'Common-Size Analysis', icon: LayersIcon },
    { id: 'dupont_analysis', name: 'DuPont Analysis', icon: ActivityIcon },
    { id: 'key_ratios', name: 'Key Ratios', icon: PercentIcon },
    { id: 'scenario_analysis', name: 'Scenario Analysis', icon: ZapIcon },
    { id: 'valuation_multiples', name: 'Valuation Multiples', icon: BriefcaseIcon },
    { id: 'budget_vs_actuals', name: 'Budget vs. Actuals', icon: TargetIcon },
    { id: 'revenue_deep_dive', name: 'Revenue Deep Dive', icon: DollarSignIcon },
    { id: 'cost_and_margin_analysis', name: 'Cost & Margin Analysis', icon: PieChartIcon },
    { id: 'working_capital', name: 'Working Capital', icon: DropletIcon },
    { id: 'debt_and_leverage', name: 'Debt & Leverage', icon: LandmarkIcon },
    { id: 'financial_risks', name: 'Financial Risks', icon: ShieldIcon },
    { id: 'esg_and_sustainability', name: 'ESG & Sustainability', icon: GlobeIcon },
    { id: 'competitor_benchmarking', name: 'Competitor Benchmarking', icon: UsersIcon },
    { id: 'report_methodology', name: 'Report Methodology', icon: BookIcon },
];

export const REPORT_SECTION_BATCHES = [
  { 
    name: 'Executive Summary & Methodology', 
    sections: ['executive_summary', 'report_methodology'] 
  },
  { 
    name: 'Core Financial Statements', 
    sections: ['profit_or_loss', 'financial_position', 'cash_flows'] 
  },
  { 
    name: 'Ratio & Performance Analysis', 
    sections: ['key_ratios', 'dupont_analysis', 'common_size_analysis', 'working_capital'] 
  },
  { 
    name: 'Business Operations Deep Dive', 
    sections: ['revenue_deep_dive', 'cost_and_margin_analysis', 'budget_vs_actuals', 'debt_and_leverage'] 
  },
  { 
    name: 'Strategic & Forward-Looking Analysis', 
    sections: ['financial_risks', 'competitor_benchmarking', 'valuation_multiples', 'scenario_analysis', 'esg_and_sustainability'] 
  },
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