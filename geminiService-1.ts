import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ReportData, PeriodData, SectionAnalysis } from "../types";

// Ensure the API key is available.
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set. Please provide a valid Google AI API key.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const keyMetricSchema = {
    type: Type.OBJECT,
    properties: {
        label: { type: Type.STRING, description: "The name of the Key Performance Indicator (e.g., 'Gross Margin')." },
        value: { type: Type.STRING, description: "The formatted value of the KPI for the latest period (e.g., '45.2%' or '$1.2M')." },
        change: { type: Type.NUMBER, description: "The percentage change from the previous period (e.g., 15.2 for +15.2% or -5 for -5%). Omit if single period." },
        trend: { type: Type.STRING, enum: ['positive', 'negative', 'neutral'], description: "The qualitative assessment of the trend." }
    },
    required: ['label', 'value']
};

const chartSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['bar', 'pie', 'line'], description: "The type of chart to render." },
        title: { type: Type.STRING, description: "The title of the chart." },
        data: {
            type: Type.ARRAY,
            description: "Data points for the chart.",
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING, description: "Label for the data point (e.g., period label or category)." },
                    value: { type: Type.NUMBER, description: "Numerical value for the data point." },
                    series: { type: Type.STRING, description: "Optional series name for multi-line charts."}
                },
                required: ['label', 'value']
            }
        }
    },
    required: ['type', 'title', 'data']
};

const sectionAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        headline: { type: Type.STRING, description: "A single, impactful headline summarizing the key finding for this section." },
        takeaways: {
            type: Type.ARRAY,
            description: "An array of 3-5 bullet points highlighting the most critical findings and trends. For placeholder sections, explain what takeaways would normally appear here.",
            items: { type: Type.STRING }
        },
        narrative: {
            type: Type.STRING,
            description: "A detailed analysis. Explain drivers, analyze changes and trends, offer hypotheses, and suggest recommendations. Use Markdown for lists. For placeholder sections, describe the purpose of this section, what it analyzes, and what data would be required to populate it."
        },
        keyMetrics: {
            type: Type.ARRAY,
            description: "An array of 2-4 critical Key Performance Indicators (KPIs) for this section to be displayed prominently. Provide the value for the latest period and the change from the prior period.",
            items: keyMetricSchema
        },
        charts: {
            type: Type.ARRAY,
            description: "An array of chart objects to visualize the data in this section. Generate multiple charts (e.g., a line chart for trends AND a pie chart for composition) where appropriate.",
            items: chartSchema
        }
    },
    required: ["headline", "takeaways", "narrative"]
};

const safeParse = (value: string): number => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
};


const formatDataForPrompt = (data: PeriodData, currency: string): string => {
    const format = (val: string | number) => typeof val === 'number' ? val.toLocaleString() : (val ? safeParse(val).toLocaleString() : '0');

    // Calculate totals to help the AI
    const totalRevenue = safeParse(data.incomeStatement.revenueSaleOfGoods) + safeParse(data.incomeStatement.revenueServices) + safeParse(data.incomeStatement.revenueRental) + safeParse(data.incomeStatement.otherIncome);
    const totalCogs = safeParse(data.incomeStatement.materialCost) + safeParse(data.incomeStatement.directLabor) + safeParse(data.incomeStatement.subcontractorCosts) + safeParse(data.incomeStatement.directEquipmentCost) + safeParse(data.incomeStatement.otherDirectCosts);
    const grossProfit = totalRevenue - totalCogs;
    const totalOpex = safeParse(data.incomeStatement.staffSalariesAdmin) + safeParse(data.incomeStatement.rentExpenseAdmin) + safeParse(data.incomeStatement.utilities) + safeParse(data.incomeStatement.marketingAdvertising) + safeParse(data.incomeStatement.legalProfessionalFees) + safeParse(data.incomeStatement.otherGAndA);
    const preTaxProfit = grossProfit - totalOpex;
    const netIncome = preTaxProfit - safeParse(data.incomeStatement.incomeTaxExpense);
    
    // Balance Sheet totals
    const totalCurrentAssets = safeParse(data.balanceSheet.cashAndBankBalances) + safeParse(data.balanceSheet.accountsReceivable) + safeParse(data.balanceSheet.inventory) + safeParse(data.balanceSheet.prepayments) + safeParse(data.balanceSheet.otherCurrentAssets);
    const totalCurrentLiabilities = safeParse(data.balanceSheet.accountsPayable) + safeParse(data.balanceSheet.accruedExpenses) + safeParse(data.balanceSheet.shortTermLoans) + safeParse(data.balanceSheet.currentPortionOfLTDebt);
    const workingCapital = totalCurrentAssets - totalCurrentLiabilities;
    const totalDebt = safeParse(data.balanceSheet.shortTermLoans) + safeParse(data.balanceSheet.currentPortionOfLTDebt) + safeParse(data.balanceSheet.longTermLoans);
    const totalEquity = safeParse(data.balanceSheet.shareCapital) + safeParse(data.balanceSheet.retainedEarnings) + safeParse(data.balanceSheet.otherReserves);
    const totalAssets = totalCurrentAssets + safeParse(data.balanceSheet.propertyPlantEquipmentNet) + safeParse(data.balanceSheet.intangibleAssets) + safeParse(data.balanceSheet.investmentProperties) + safeParse(data.balanceSheet.longTermInvestments);


    const hasSegments = data.segments && data.segments.length > 0 && data.segments.some(s => s.name);
    const segmentsSummary = hasSegments ? `\n- **Segments**: ` + data.segments.map(s => `${s.name}: Rev ${format(s.revenue)}, Profit ${format(s.profit)}`).join('; ') : '';

    const hasBudget = data.budget && (data.budget.revenue || data.budget.cogs || data.budget.opex);
    const budgetSummary = hasBudget ? `\n- **Budget**: Revenue ${format(data.budget.revenue)}, COGS ${format(data.budget.cogs)}, OpEx ${format(data.budget.opex)}` : '';
    
    const hasEsg = data.esg && (data.esg.co2Emissions || data.esg.waterUsage || data.esg.employeeTurnover || data.esg.genderDiversity);
    const esgSummary = hasEsg ? `\n- **ESG**: CO2 ${format(data.esg.co2Emissions)}t, Water ${format(data.esg.waterUsage)}m³, Turnover ${data.esg.employeeTurnover}%, Diversity ${data.esg.genderDiversity}%` : '';

    return `
### Period: ${data.periodLabel}
- **P&L Summary (${currency})**:
  - Total Revenue: ${format(totalRevenue)}
  - COGS: ${format(totalCogs)}
  - Gross Profit: ${format(grossProfit)}
  - Operating Profit: ${format(preTaxProfit)}
  - Net Income: ${format(netIncome)}
  - D&A: ${format(data.incomeStatement.depreciationAmortization)}
- **Balance Sheet Summary (${currency})**:
  - Accounts Receivable: ${format(data.balanceSheet.accountsReceivable)}
  - Inventory: ${format(data.balanceSheet.inventory)}
  - Accounts Payable: ${format(data.balanceSheet.accountsPayable)}
  - Working Capital: ${format(workingCapital)}
  - Total Debt: ${format(totalDebt)}
  - Total Equity: ${format(totalEquity)}
  - Total Assets: ${format(totalAssets)}
  - Short-term Debt: ${format(safeParse(data.balanceSheet.shortTermLoans) + safeParse(data.balanceSheet.currentPortionOfLTDebt))}
  - Long-term Debt: ${format(data.balanceSheet.longTermLoans)}
  - Lease Liabilities: ${format(data.balanceSheet.leaseLiabilities)}
- **Cash Flow Summary (${currency})**:
  - Capital Expenditures: ${format(data.cashFlow.capitalExpenditures)}
  - Income Tax Paid: ${format(data.incomeStatement.incomeTaxExpense)}
${budgetSummary}${segmentsSummary}${esgSummary}
`.trim();
};

const getSectionSpecificInstructions = (sectionId: string): string => {
    const instructions: { [key: string]: string } = {
        'exec_summary': 'High-level overview of the story across the periods. What are the key trends? What is the overall trajectory? Top KPIs: Revenue Growth, Net Profit Margin, Operating Cash Flow. Tailor the summary to the specified industries.',
        'pnl_statement': 'Analyze profitability trends. How is revenue growing/shrinking? Are margins improving? Explain drivers. KPIs: Total Revenue, Gross Profit, Net Income. Chart 1 (Line): "Revenue vs. Net Income Trend". Series: "Revenue", "Net Income". Chart 2 (Pie): "Operating Expense Composition (Latest Period)". Slices for major OpEx categories.',
        'balance_sheet': 'Analyze financial health. How is liquidity (Current Ratio) and leverage (Debt-to-Equity) evolving? KPIs: Total Assets, Total Liabilities, Total Equity. Chart 1 (Bar): "Current vs. Non-Current Assets Trend". Chart 2 (Pie): "Asset Composition (Latest Period)".',
        'cash_flow_statement': 'Analyze cash generation. Is operating cash flow improving? What are the main uses of cash? KPIs: Operating, Investing, and Financing Cash Flow. Chart: "Cash Flow from Activities Trend" (Line chart with series for Operating, Investing, Financing).',
        'gross_profit_analysis': 'Analyze the Gross Profit Margin trend (Gross Profit / Total Revenue). Is it stable, improving, or declining? Hypothesize why (e.g., pricing power, input cost changes). KPIs: Gross Profit, Gross Profit Margin %. Chart: Line chart of Gross Profit Margin %.',
        'ebitda_analysis': 'Reconcile Operating Profit to EBITDA (Operating Profit + Depreciation & Amortization). Analyze EBITDA margin trend. KPIs: EBITDA, EBITDA Margin %. Chart: Bar chart comparing Operating Profit and EBITDA across periods.',
        'net_profit_analysis': 'Analyze the Net Profit Margin trend (Net Income / Total Revenue). How effectively is the company converting revenue to bottom-line profit? KPIs: Net Income, Net Profit Margin %. Chart: Line chart of Net Profit Margin %.',
        'working_capital_analysis': 'Analyze the Working Capital trend. Calculate and analyze the Cash Conversion Cycle (CCC) trend. CCC = DSO (Days Sales Outstanding from Avg AR/Rev*365) + DIO (Days Inventory Outstanding from Avg Inv/COGS*365) - DPO (Days Payables Outstanding from Avg AP/COGS*365). Analyze the components. KPIs: Working Capital, DSO, DPO. Chart: Line chart showing Working Capital trend.',
        'capex_analysis': 'Analyze Capital Expenditures. Compare Capex to Depreciation & Amortization. Is the company investing for growth (Capex > D&A)? KPIs: Capex, D&A, Capex as % of Revenue. Chart: Bar chart comparing Capex and D&A across periods.',
        'debt_analysis': 'Analyze the total debt level and its composition (short-term vs. long-term). Calculate and analyze the Debt-to-Equity ratio trend. KPIs: Total Debt, Short-Term Debt, Long-Term Debt, Debt-to-Equity Ratio. Chart: Stacked Bar chart showing Short-Term and Long-Term debt composition across periods.',
        'cogs_analysis': 'If budget data is available, perform a variance analysis (Actual vs. Budget). Otherwise, analyze COGS as a % of revenue. KPIs: Total COGS, COGS as % of Revenue.',
        'opex_analysis': 'If budget data is available, perform a variance analysis. Otherwise, analyze OpEx as a % of revenue. KPIs: Total OpEx, OpEx as % of Revenue.',
        'segment_reporting': 'If segment data is provided, analyze the performance of each segment. Which is most profitable? Which is fastest growing? Chart: Bar chart comparing Revenue and Profit by segment for the latest period. If no data, use placeholder strategy.',
        'ratio_analysis': 'Calculate and analyze trends for key industry-specific ratios. For tech/SaaS: Rule of 40. For retail: Inventory Turnover. For all: Current Ratio, Debt-to-Equity, GPM, NPM. Chart: Line chart comparing key ratios.',
        'common_size_analysis': 'Generate a vertical common size P&L (as % of Total Revenue) and Balance Sheet (as % of Total Assets) for all periods. Analyze key shifts in composition. Chart: Stacked bar chart for P&L composition.',
        'tax_analysis': 'Calculate and analyze the effective tax rate (Income Tax Expense / Pre-Tax Profit). Is it stable? Why might it be changing? Chart: Line chart of effective tax rate trend.',
        'lease_analysis': 'Analyze the Lease Liabilities trend on the balance sheet. Is the company taking on more leases? Chart: Bar chart of Lease Liabilities.',
        'esg_metrics': 'If ESG data is provided, analyze the trends. Is the company improving its sustainability metrics? KPIs: CO2 Emissions, Employee Turnover. Benchmark against industry standards if possible. If no data, use placeholder strategy.',
        'competitor_benchmarking': 'Use the industry context to provide high-level commentary on typical performance benchmarks for the selected industries. Use placeholder strategy as no direct competitor data is provided.',
    };
    return instructions[sectionId] || `Use the "Intelligent Placeholder" strategy. Explain the purpose of the '${sectionId}' section and the data needed. Mention its relevance to the specified industries.`;
};


export const generateSectionAnalysis = async (reportData: ReportData, sectionId: string): Promise<SectionAnalysis> => {
    
    const financialDataSummary = reportData.periods.map(p => formatDataForPrompt(p, reportData.currency)).join('\n---\n');
    const sectionInstruction = getSectionSpecificInstructions(sectionId);
    const industryContext = reportData.industries.length > 0 ? `The company operates in the following industries: **${reportData.industries.join(', ')}**. Please tailor your analysis, KPIs, and benchmarks accordingly.` : 'No specific industry was provided.';

    const prompt = `
You are a world-class senior financial analyst acting as a specialized module. Your job is to analyze ONLY the following section: **${sectionId}**.
The output must be a single, valid JSON object that strictly adheres to the provided schema. Do not include any markdown formatting like \`\`\`json in your response.

**Analysis Context:**
- **Company Industries:** ${industryContext}
- **Financial Data Summary (Currency: ${reportData.currency}, Period Type: ${reportData.periodType}):**
---
${financialDataSummary}
---

**Instructions for the '${sectionId}' section - VERY IMPORTANT:**
1.  **Focus on this section ONLY.** Perform a **comparative analysis across all provided periods**. For single-period reports, analyze composition.
2.  **Incorporate Industry Context:** Your analysis *must* reflect the provided company industries. Use industry-specific knowledge to select relevant KPIs and provide insightful commentary.
3.  **Use DATA-DRIVEN ANALYSIS first.** If specific data is provided for this section, use it for a deep, quantitative analysis.
4.  **Use INTELLIGENT PLACEHOLDERS as a fallback:** If data is insufficient for this section (e.g., all relevant numbers are 0), you MUST still generate the section. For these placeholders:
    -   **Headline:** State that the section requires more data (e.g., "Debt & Leverage Analysis Requires Debt Schedule Data").
    -   **Takeaways:** List the typical KPIs or questions this section would answer, mentioning their relevance to the specified industries.
    -   **Narrative:** Explain the section's purpose, why it's important for the specified industries, and what specific data points are needed.
5.  **Generate KPIs:** Provide 2-4 critical Key Performance Indicators for the 'keyMetrics' array, including value for the latest period and % change from prior.
6.  **Generate Charts:** For sections with data, generate relevant charts (line for trends, pie for composition, bar for comparison).
7.  **Follow these specific guidelines:** ${sectionInstruction}

Analyze the data and provide the analysis for the **'${sectionId}'** section.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: sectionAnalysisSchema,
                temperature: 0.2,
            },
        });

        const text = response.text;
        
        if (!text) {
          throw new Error("The API returned an empty response. This may be due to safety settings or an issue with the prompt.");
        }

        return JSON.parse(text) as SectionAnalysis;
        
    } catch (error) {
        console.error(`Gemini API call failed for section ${sectionId}:`, error);
        if (error instanceof Error) {
            if (error.message.includes("API_KEY")) {
                 throw new Error("Invalid API Key. Please ensure your Google AI API key is configured correctly.");
            }
            // Add specific check for rate limit errors
            if (error.message.includes("429") || error.message.toLowerCase().includes("resource_exhausted") || error.message.toLowerCase().includes("quota")) {
                throw new Error(`API rate limit hit for section '${sectionId}'. The service is busy. Please wait a moment and try generating again.`);
            }
        }
        throw new Error(`Failed to generate analysis for section ${sectionId}. The model may have returned an invalid format or an error occurred.`);
    }
};