import { GoogleGenAI, Type, GenerateContentResponse, Chat, Content } from "@google/genai";
import { 
    ReportData, PeriodData, SectionAnalysis, ChatMessage,
    createInitialPeriod, QuantitativeData, AINarrativeResponse, DashboardAnalysis,
    Transaction, AIBookkeepingSummary, AIPnlSummary, AIBalanceSheetSummary,
    BankTransaction, MatchSuggestion, InsightCard, Invoice, Bill, Budgets, InventoryItem,
    CashFlowForecast, ManualAdjustment, RecurringTransaction, ChartOfAccount, AIBankFeedInsight,
    KPIDeepDiveResponse, Chart
} from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set. Please provide a valid Google AI API key.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- COMMON SCHEMAS & TYPES ---
const keyMetricSchema = {
    type: Type.OBJECT,
    properties: {
        label: { type: Type.STRING },
        value: { type: Type.STRING },
        change: { type: Type.NUMBER },
        trend: { type: Type.STRING, enum: ['positive', 'negative', 'neutral'] }
    },
    required: ['label', 'value']
};

const chartSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['bar', 'pie', 'line', 'waterfall'] },
        title: { type: Type.STRING },
        data: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.NUMBER },
                    series: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['positive', 'negative', 'total']}
                },
                required: ['label', 'value']
            }
        }
    },
    required: ['type', 'title', 'data']
};

const quantitativeDataSchema = {
    type: Type.OBJECT,
    properties: {
        keyMetrics: { type: Type.ARRAY, items: keyMetricSchema },
        charts: { type: Type.ARRAY, items: chartSchema },
    },
};

const sectionAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        headline: { type: Type.STRING, description: "A single, impactful headline for the section." },
        takeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 3-5 key takeaways." },
        narrative: { type: Type.STRING, description: "A detailed narrative analysis. Use markdown for subheadings like **Subheading**." },
        quantitativeData: quantitativeDataSchema,
    },
    required: ['headline', 'takeaways', 'narrative', 'quantitativeData']
};


// --- HELPERS ---
const safeParse = (value: string | number): number => {
    if (typeof value === 'number') return value;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
};
const format = (val: string | number) => typeof val === 'number' ? val.toLocaleString() : (val ? safeParse(val).toLocaleString() : '0');

// --- FINANCIAL MODULE LOGIC ---

const formatFinancialDataForPrompt = (data: PeriodData, currency: string): string => {
    const totalRevenue = safeParse(data.incomeStatement.revenueSaleOfGoods) + safeParse(data.incomeStatement.revenueServices) + safeParse(data.incomeStatement.revenueRental) + safeParse(data.incomeStatement.otherIncome);
    const totalCogs = safeParse(data.incomeStatement.materialCost) + safeParse(data.incomeStatement.directLabor) + safeParse(data.incomeStatement.subcontractorCosts) + safeParse(data.incomeStatement.directEquipmentCost) + safeParse(data.incomeStatement.otherDirectCosts);
    const grossProfit = totalRevenue - totalCogs;
    const totalOpex = safeParse(data.incomeStatement.staffSalariesAdmin) + safeParse(data.incomeStatement.rentExpenseAdmin) + safeParse(data.incomeStatement.utilities) + safeParse(data.incomeStatement.marketingAdvertising) + safeParse(data.incomeStatement.legalProfessionalFees) + safeParse(data.incomeStatement.otherGAndA);
    const operatingProfit = grossProfit - totalOpex - safeParse(data.incomeStatement.depreciationAmortization);
    const ebitda = operatingProfit + safeParse(data.incomeStatement.depreciationAmortization);
    const netIncome = operatingProfit - safeParse(data.incomeStatement.incomeTaxExpense);
    const totalCurrentAssets = safeParse(data.balanceSheet.cashAndBankBalances) + safeParse(data.balanceSheet.accountsReceivable) + safeParse(data.balanceSheet.inventory) + safeParse(data.balanceSheet.prepayments) + safeParse(data.balanceSheet.otherCurrentAssets);
    const totalNonCurrentAssets = safeParse(data.balanceSheet.propertyPlantEquipmentNet) + safeParse(data.balanceSheet.intangibleAssets) + safeParse(data.balanceSheet.investmentProperties) + safeParse(data.balanceSheet.longTermInvestments);
    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;
    const totalCurrentLiabilities = safeParse(data.balanceSheet.accountsPayable) + safeParse(data.balanceSheet.accruedExpenses) + safeParse(data.balanceSheet.shortTermLoans) + safeParse(data.balanceSheet.currentPortionOfLTDebt);
    const totalNonCurrentLiabilities = safeParse(data.balanceSheet.longTermLoans) + safeParse(data.balanceSheet.leaseLiabilities) + safeParse(data.balanceSheet.deferredTaxLiability);
    const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;
    const totalEquity = safeParse(data.balanceSheet.shareCapital) + safeParse(data.balanceSheet.retainedEarnings) + safeParse(data.balanceSheet.otherReserves);
    const workingCapital = totalCurrentAssets - totalLiabilities;
    const totalDebt = safeParse(data.balanceSheet.shortTermLoans) + safeParse(data.balanceSheet.currentPortionOfLTDebt) + safeParse(data.balanceSheet.longTermLoans);
    const cfo = safeParse(data.cashFlow.netIncome) + safeParse(data.cashFlow.depreciationAmortization) + safeParse(data.cashFlow.changesInWorkingCapital);
    const cfi = safeParse(data.cashFlow.capitalExpenditures) + safeParse(data.cashFlow.saleOfAssets);
    const cff = safeParse(data.cashFlow.issuanceOfDebt) + safeParse(data.cashFlow.repaymentOfDebt) + safeParse(data.cashFlow.issuanceOfEquity) + safeParse(data.cashFlow.dividendsPaid);

    return `
### Period: ${data.periodLabel}
- **P&L Summary (${currency})**: Total Revenue: ${format(totalRevenue)}, Gross Profit: ${format(grossProfit)}, Operating Profit: ${format(operatingProfit)}, EBITDA: ${format(ebitda)}, Net Income: ${format(netIncome)}
- **Balance Sheet Summary (${currency})**: Total Assets: ${format(totalAssets)}, Total Liabilities: ${format(totalLiabilities)}, Total Equity: ${format(totalEquity)}, Working Capital: ${format(workingCapital)}, Total Debt: ${format(totalDebt)}
- **Cash Flow Summary (${currency})**: CFO: ${format(cfo)}, CFI: ${format(cfi)}, CFF: ${format(cff)}
- **Other Data**: Shares Outstanding: ${format(data.sharesOutstanding)}
`.trim();
};

const getFinancialSectionInstructions = (sectionId: string): string => {
    const baseNarrativeInstruction = "Structure the detailed narrative with markdown bolding for subheadings (e.g., **Trend Analysis**, **Key Drivers**, **Implications**). Ensure Key Takeaways are ALWAYS provided. Your explanations should be educational, briefly defining key terms for a non-financial audience.";
    
    const instructions: { [key: string]: string } = {
        'executive_summary': `First, calculate these KPIs for the latest period: Total Revenue, Net Income, Operating Cash Flow, and Return on Equity (ROE). Then, generate one Chart: "Key Financials Trend" (Line chart with series for "Total Revenue", "Net Income", and "Operating Cash Flow"). Finally, write a high-level overview of the company's financial story across all periods. What are the most important trends? What is the overall trajectory and financial health? ${baseNarrativeInstruction}`,
        'profit_or_loss': `First, calculate these KPIs: Total Revenue, Gross Profit Margin, Net Income. Then, generate Chart 1 (Waterfall): "Profit & Loss Breakdown (Latest Period)". Steps should be Total Revenue, COGS, Gross Profit, Operating Expenses, Operating Profit, Tax, Net Income. Finally, analyze profitability trends. Explain revenue growth, discuss drivers for changes in Gross Profit, Operating Profit, and Net Income, and comment on margin trends. ${baseNarrativeInstruction}`,
        'financial_position': `First, calculate these KPIs: Total Assets, Working Capital, Debt-to-Equity Ratio. Then, generate two charts: Chart 1 (Bar): "Asset Composition (Current vs. Non-Current)" and Chart 2 (Pie): "Liability & Equity Composition (Latest Period)". Finally, analyze the company's financial health, capital structure, liquidity trends (Current Ratio), and leverage evolution (Debt-to-Equity ratio). ${baseNarrativeInstruction}`,
        'cash_flows': `First, calculate these KPIs: Operating Cash Flow, Investing Cash Flow, and Financing Cash Flow. Then, generate one Chart: "Cash Flow from Activities Trend" (Line chart with series for Operating, Investing, Financing). Finally, analyze cash generation and usage. Is the core business generating positive cash flow (CFO)? What are the main uses of cash? Is the overall cash balance growing? ${baseNarrativeInstruction}`,
        'key_ratios': `First, calculate these KPIs: Current Ratio (liquidity), Debt-to-Equity (leverage), Return on Equity (ROE), Return on Assets (ROA), Earnings Per Share (EPS), DSO, DIO, DPO, and the Cash Conversion Cycle. Then, analyze their trends. Explain what each ratio indicates about the company's liquidity, leverage, profitability, and operational efficiency over time. ${baseNarrativeInstruction}`,
        'common_size_analysis': `First, generate two Bar charts for the latest period: 1. "Common-Size Income Statement" (show major items like COGS, Gross Profit, OpEx, Net Income as % of Revenue). 2. "Common-Size Balance Sheet" (show major items like Cash, AR, Inventory, PPE, AP, Debt, Equity as % of Total Assets). Then, interpret these statements. What are the key structural components and how have they changed over time? ${baseNarrativeInstruction}`,
        'dupont_analysis': `First, calculate the three components of DuPont analysis for each period: Net Profit Margin (Profitability), Asset Turnover (Efficiency), and Equity Multiplier (Leverage), plus the resulting Return on Equity (ROE). Then, generate a Line chart: "DuPont Component Trends" showing series for all three components. Finally, deconstruct the ROE. Explain how each of the three levers has contributed to the changes in ROE over time. ${baseNarrativeInstruction}`,
        'scenario_analysis': `If quantitative scenario assumptions are provided, project the next period's pro-forma financials and calculate KPIs for Projected Revenue, Projected Net Income, and Projected EBITDA. If not, return empty arrays. Then, if projections exist, explain the outcomes and key drivers. **Crucially, use any provided qualitative assumptions to enrich your narrative**, explaining *why* the quantitative projections are plausible (e.g., 'The 10% revenue growth is supported by the planned new product launch.'). If no scenario data is provided, explain the importance of scenario analysis for strategic planning. ${baseNarrativeInstruction}`,
        'valuation_multiples': `If a market valuation is provided, calculate key valuation multiples for the latest period: Price/Earnings (P/E), Price/Sales (P/S), and EV/EBITDA (EV = Market Valuation + Total Debt - Cash). If not, return empty arrays. Then, use Google Search to find comparable trading multiples for the user-provided competitors. Compare the company's valuation to its peers. Is it overvalued, undervalued, or fairly valued, and why? ${baseNarrativeInstruction}`,
        'budget_vs_actuals': `If budget data exists, create KPIs for Revenue Variance (%), COGS Variance (%), and OpEx Variance (%). Generate a Bar chart: "Budget vs. Actuals" with series for Budget and Actual Revenue, COGS, and OpEx for the latest period. If no budget data, return empty arrays. Then, if data exists, perform a variance analysis. If not, explain the importance of variance analysis for management control. ${baseNarrativeInstruction}`,
        'revenue_deep_dive': `First, calculate KPIs for Period-over-Period Revenue Growth Rate. Then, if segment data exists, create a Pie Chart: "Revenue by Segment (Latest Period)"; otherwise, create a Bar Chart: "Revenue Composition (Goods vs. Services)". Finally, provide a detailed analysis of revenue, growth rates, and composition. ${baseNarrativeInstruction}`,
        'cost_and_margin_analysis': `First, calculate these KPIs: Gross Margin %, Operating Margin %, Net Margin %. Then, create a line chart: "Margin Trends" with series for each of the three margin types. Finally, analyze the company's cost structure, discussing COGS and OpEx as a percentage of revenue and explaining margin trends. ${baseNarrativeInstruction}`,
        'working_capital': `First, calculate these KPIs: Working Capital, Accounts Receivable Days, Accounts Payable Days, Inventory Days, and the Cash Conversion Cycle. Then, analyze Working Capital trends and its components, including the Cash Conversion Cycle, to assess short-term operational efficiency. ${baseNarrativeInstruction}`,
        'debt_and_leverage': `First, calculate these KPIs: Total Debt, Debt-to-Equity Ratio, Debt-to-EBITDA Ratio. Then, create a Pie chart: "Debt Composition (Short-term vs. Long-term)". Finally, analyze the company's total debt, its composition, and key leverage ratios, explaining if the leverage level is appropriate. ${baseNarrativeInstruction}`,
        'financial_risks': `Based on all provided financial data, identify and explain the top 3-5 financial risks facing the company (e.g., liquidity, profitability, leverage). No quantitative data generation is needed for this section. ${baseNarrativeInstruction}`,
        'esg_and_sustainability': `If ESG data is provided, create a Line Chart: "ESG Metric Trends" (series for CO2 Emissions, Water Usage) and KPIs for the latest values of all four ESG metrics. If not, return empty arrays. Then, if data exists, analyze the trends. If not, explain the growing importance of ESG metrics. ${baseNarrativeInstruction}`,
        'competitor_benchmarking': `First, generate bar charts comparing this company's latest Gross Margin %, Net Margin %, and Debt-to-Equity ratio against the industry averages you find via search. Then, use Google Search to find typical financial ratios for the **specific competitors provided by the user**. Compare these benchmarks to this company's latest period data to provide a targeted, contextual performance analysis. ${baseNarrativeInstruction}`,
        'report_methodology': `Explain the methodologies used in this report for Common-Size Analysis, DuPont Analysis, and Valuation Multiples. No quantitative data generation is needed. This adds transparency and credibility. ${baseNarrativeInstruction}`
    };
    return instructions[sectionId] || `Generate a placeholder analysis for section ${sectionId}. ${baseNarrativeInstruction}`;
};

// --- API CALL FUNCTIONS ---

export const generateBatchedSectionAnalysis = async (
    reportData: ReportData, 
    sectionIds: string[]
): Promise<Record<string, SectionAnalysis>> => {
    const systemInstruction = "You are a world-class senior financial analyst. Your analysis is balanced, insightful, and data-driven. You MUST generate all requested sections in a single response, adhering strictly to the provided JSON schema for the entire output.";
    
    const sectionsInstructions = sectionIds.map(id => `
---
**Instructions for '${id}':**
${getFinancialSectionInstructions(id)}
    `).join('\n');
    
    const useSearch = sectionIds.some(id => ['competitor_benchmarking', 'valuation_multiples'].includes(id));
    
    const promptData = reportData.periods.map(p => formatFinancialDataForPrompt(p, reportData.currency)).join('\n---\n');
    let additionalContext = '';
    if (sectionIds.includes('scenario_analysis') && reportData.scenario) {
        additionalContext += `**Scenario Assumptions (Quantitative):** Revenue Growth: ${reportData.scenario.revenueGrowth}%, COGS as % of Revenue: ${reportData.scenario.cogsPercentage}%, OpEx Growth: ${reportData.scenario.opexGrowth}%\n`;
        if (reportData.scenario.qualitativeAssumptions) {
            additionalContext += `**Scenario Assumptions (Qualitative):** ${reportData.scenario.qualitativeAssumptions}\n`;
        }
    }
    if (sectionIds.includes('valuation_multiples') && reportData.marketValuation) {
        additionalContext += `**Valuation Data:** Market Valuation: ${reportData.marketValuation}\n`;
    }
    if (useSearch && reportData.competitors.length > 0) {
        additionalContext += `When using Google Search, focus queries on these specific competitors: **${reportData.competitors.join(', ')}**.\n`;
    }

    const prompt = `
        **Task:** Perform a complete analysis (quantitative and narrative) for the following sections: **${sectionIds.join(', ')}**.
        **Context:**
        - **Industries:** ${reportData.industries.join(', ')}
        ${additionalContext}
        - **Data Summary:**
        ---
        ${promptData}
        ---
        ${sectionsInstructions}
        
        **Output Format:**
        Your entire output MUST be a single, valid JSON object that strictly adheres to the provided schema. The top-level keys must be the section IDs (${sectionIds.join(', ')}). Do not include any markdown formatting or explanatory text outside of the JSON structure.
    `;

    const properties: { [key: string]: any } = {};
    sectionIds.forEach(id => {
        properties[id] = sectionAnalysisSchema;
    });
    const batchedSchema = {
        type: Type.OBJECT,
        properties,
        required: sectionIds,
    };

    const config: any = {
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction,
            temperature: 0.1,
        }
    };
    
    if (useSearch) {
        config.config.tools = [{ googleSearch: {} }];
    } else {
        config.config.responseMimeType = "application/json";
        config.config.responseSchema = batchedSchema;
    }

    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const response = await ai.models.generateContent(config);
            if (!response.text) {
                throw new Error("The API returned an empty response.");
            }
            const analysisBatch: Record<string, SectionAnalysis> = JSON.parse(response.text);
            
            if (useSearch) {
                const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
                    ?.map(chunk => chunk.web)
                    .filter((web): web is { uri: string; title?: string } => !!web?.uri)
                    .map(web => ({ uri: web.uri, title: web.title || new URL(web.uri).hostname })) || [];
                
                sectionIds.forEach(id => {
                    if (['competitor_benchmarking', 'valuation_multiples'].includes(id) && analysisBatch[id]) {
                        analysisBatch[id].sources = sources;
                    }
                });
            }
            
            return analysisBatch;
        } catch (error) {
            console.error(`Gemini API call failed for batch (${sectionIds.join(', ')}) (Attempt ${attempt + 1}):`, error);
            attempt++;
            const isRateLimitError = error instanceof Error && (error.message.includes("429") || error.message.toLowerCase().includes("quota"));

            if (isRateLimitError && attempt < maxRetries) {
                const backoffTime = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                await delay(backoffTime);
            } else {
                 if (error instanceof Error && error.message.includes("API_KEY")) throw new Error("Invalid API Key.");
                 throw error; // Rethrow final error
            }
        }
    }
    throw new Error(`Failed to generate analysis for batch (${sectionIds.join(', ')}) after ${maxRetries} attempts.`);
};


export const generateDashboardSummary = async (fullReport: AINarrativeResponse): Promise<DashboardAnalysis> => {
    const summarySchema = {
        type: Type.OBJECT,
        properties: {
            cfoBriefing: { type: Type.STRING, description: "A 2-3 paragraph strategic summary from the perspective of a CFO. Start with the most important finding. Synthesize the key themes from the entire report." },
            strategicRecommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 3-5 specific, actionable strategic recommendations based on the analysis." }
        },
        required: ['cfoBriefing', 'strategicRecommendations']
    };

    const analysisContext = fullReport.sections.map(s => `
        **Section: ${s.name}**
        - Headline: ${s.analysis.headline}
        - Takeaways: ${s.analysis.takeaways.join('; ')}
    `).join('');

    const prompt = `
        **Task:** You are the Chief Financial Officer (CFO). You have just reviewed a comprehensive financial analysis report. Your task is to synthesize all the findings into a high-level strategic briefing for the board of directors.
        
        **Context:**
        Here are the headlines and key takeaways from every section of the report you just reviewed:
        ---
        ${analysisContext}
        ---

        **Instructions:**
        1.  **Synthesize, Don't Repeat:** Do not just list the takeaways. Find the connecting threads and tell a cohesive story about the company's performance, strengths, and weaknesses.
        2.  **Adopt the CFO Persona:** Write in a direct, authoritative, and strategic tone. Focus on the "so what?" of the data.
        3.  **Create Actionable Recommendations:** Your recommendations should be forward-looking and practical. What should the company do next based on this analysis?

        Provide your output in a valid JSON format adhering to the schema.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are a world-class Chief Financial Officer AI, skilled at synthesizing complex financial data into strategic insights.",
                responseMimeType: "application/json",
                responseSchema: summarySchema,
                temperature: 0.3
            }
        });
        if (!response.text) {
            throw new Error("The API returned an empty response for the dashboard summary.");
        }
        return JSON.parse(response.text);
    } catch (error) {
        console.error('Failed to generate dashboard summary:', error);
        throw new Error('Could not generate the final CFO Briefing.');
    }
};

// --- BOOKKEEPING MODULE ---
const transactionExtractionSchema = {
    type: Type.OBJECT,
    properties: {
        date: { type: Type.STRING, description: "The date of the transaction in YYYY-MM-DD format." },
        description: { type: Type.STRING, description: "A concise description of the transaction or merchant name." },
        amount: { type: Type.NUMBER, description: "The total amount of the transaction. Should be a positive number." },
        suggestedAccountId: { type: Type.STRING, description: "The most likely account ID from the provided list." },
    },
    required: ['date', 'description', 'amount', 'suggestedAccountId']
};

export const extractTransactionFromImage = async (
    imageFilePart: { inlineData: { data: string; mimeType: string; }; }
): Promise<{ date: string; description: string; amount: number; accountId: string; }> => {
    const accountListForPrompt = `
      'inc_sales': 'Sales Revenue', 'inc_consulting': 'Consulting Income', 'inc_interest': 'Interest Income', 'inc_other': 'Other Income',
      'exp_advertising': 'Advertising & Marketing', 'exp_bank_fees': 'Bank Fees', 'exp_cogs': 'Cost of Goods Sold',
      'exp_contractors': 'Contractors & Freelancers', 'exp_insurance': 'Insurance', 'exp_legal': 'Legal & Professional Services',
      'exp_meals': 'Meals & Entertainment', 'exp_office': 'Office Supplies & Expenses', 'exp_rent': 'Rent & Lease',
      'exp_repairs': 'Repairs & Maintenance', 'exp_salaries': 'Salaries & Wages', 'exp_software': 'Software & Subscriptions',
      'exp_travel': 'Travel Expenses', 'exp_utilities': 'Utilities', 'exp_other': 'Other Business Expenses'
    `;

    const prompt = `You are an expert bookkeeping assistant. Analyze the provided receipt image. Extract the transaction date, a clear description (merchant name and key items), and the total amount.
    
    Based on the description, suggest the most appropriate expense category by choosing its ID from the following list:
    ---
    ${accountListForPrompt}
    ---
    
    Return the data in a valid JSON format. The amount should be a positive number.
    If it looks like an income receipt (e.g., a payment confirmation to the user), you should still categorize it, perhaps as 'inc_sales' or 'inc_consulting', but the amount should remain positive.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ "text": prompt }, imageFilePart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: transactionExtractionSchema,
                temperature: 0.0,
            }
        });
        
        const extracted = JSON.parse(response.text);
        
        return {
            date: extracted.date,
            description: extracted.description,
            amount: extracted.amount,
            accountId: extracted.suggestedAccountId,
        };
    } catch (error) {
        console.error("Failed to extract transaction from image:", error);
        throw new Error("Could not read the receipt. Please try another image or enter the details manually.");
    }
};

export const generateBookkeepingSummary = async (transactions: Transaction[]): Promise<AIBookkeepingSummary> => {
    const bookkeepingSummarySchema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING, description: 'A 2-3 sentence overview of financial health for the period.' },
            observations: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A list of 3-4 key, data-driven observations.' },
            suggestion: { type: Type.STRING, description: 'One actionable suggestion for the user.' }
        },
        required: ['summary', 'observations', 'suggestion']
    };
    
    const transactionsString = JSON.stringify(transactions.map(t => ({ date: t.date, description: t.description, amount: t.amount, accountId: t.accountId })), null, 2);

    const prompt = `
        **Task:** Analyze the following list of financial transactions for the most recent month. Provide a concise summary of the user's financial health.
        
        **Transaction Data:**
        ---
        ${transactionsString}
        ---

        **Instructions:**
        1.  **Summarize:** Write a brief, high-level summary of income, expenses, and net profit.
        2.  **Observe:** Identify the most important trends or facts from the data. Examples: largest expense category, significant one-off transactions, or recurring spending patterns.
        3.  **Suggest:** Provide one simple, actionable piece of advice based on your analysis.
        4.  **Format:** Return the response in a valid JSON format adhering to the schema. Do not include any text outside the JSON structure.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are an expert accountant and financial advisor AI. Your goal is to provide clear, concise, and actionable insights based on a list of financial transactions. Analyze the data and summarize the user's financial health for the given period.",
                responseMimeType: "application/json",
                responseSchema: bookkeepingSummarySchema,
                temperature: 0.2,
            }
        });
        
        if (!response.text) {
            throw new Error("The API returned an empty response for the bookkeeping summary.");
        }
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Failed to generate bookkeeping summary:", error);
        throw new Error("Could not generate the AI financial summary. Please try again later.");
    }
};

export const generatePnlSummary = async (pnlData: { income: number; expenses: number; netProfit: number; breakdown: { name: string; amount: number; type: 'Income' | 'Expense' }[] }): Promise<AIPnlSummary> => {
    const pnlSummarySchema = {
        type: Type.OBJECT,
        properties: {
            headline: { type: Type.STRING, description: 'A single, insightful headline summarizing the key result of the P&L statement.' },
            takeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A list of 2-3 key, data-driven takeaways about profitability drivers.' },
        },
        required: ['headline', 'takeaways']
    };

    const pnlDataString = `
    - Total Income: ${pnlData.income.toFixed(2)}
    - Total Expenses: ${pnlData.expenses.toFixed(2)}
    - Net Profit: ${pnlData.netProfit.toFixed(2)}
    - Breakdown:
    ${pnlData.breakdown.map(item => `  - ${item.name} (${item.type}): ${item.amount.toFixed(2)}`).join('\n')}
    `;

    const prompt = `
        **Task:** You are an expert financial analyst. Analyze the following Profit & Loss (P&L) data for a given period. Provide a concise, insightful narrative summary.

        **P&L Data:**
        ---
        ${pnlDataString}
        ---

        **Instructions:**
        1.  **Headline:** Write a single, impactful headline that captures the main story of this P&L (e.g., "Strong Sales Drive Profitability Despite Rising Costs").
        2.  **Key Takeaways:** Identify the 2-3 most important drivers of the result. Focus on the largest income and expense categories. Be specific and reference the data.
        3.  **Format:** Return the response in a valid JSON format adhering to the schema. Do not include any text outside the JSON structure.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are an expert accountant AI. Your goal is to provide a clear, concise, and insightful analysis of a Profit & Loss statement.",
                responseMimeType: "application/json",
                responseSchema: pnlSummarySchema,
                temperature: 0.1,
            }
        });

        if (!response.text) {
            throw new Error("The API returned an empty response for the P&L summary.");
        }
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Failed to generate P&L summary:", error);
        throw new Error("Could not generate the AI financial analysis. Please try again later.");
    }
};

export const generateBalanceSheetSummary = async (bsData: { totalAssets: number; totalLiabilities: number; totalEquity: number; breakdown: { name: string; amount: number; type: 'Asset' | 'Liability' | 'Equity' }[] }): Promise<AIBalanceSheetSummary> => {
    const bsSummarySchema = {
        type: Type.OBJECT,
        properties: {
            headline: { type: Type.STRING, description: 'A single, insightful headline summarizing the key result of the Balance Sheet.' },
            takeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A list of 2-3 key, data-driven takeaways about financial position, liquidity, or leverage.' },
        },
        required: ['headline', 'takeaways']
    };

    const bsDataString = `
    - Total Assets: ${bsData.totalAssets.toFixed(2)}
    - Total Liabilities: ${bsData.totalLiabilities.toFixed(2)}
    - Total Equity: ${bsData.totalEquity.toFixed(2)}
    - Breakdown:
    ${bsData.breakdown.map(item => `  - ${item.name} (${item.type}): ${item.amount.toFixed(2)}`).join('\n')}
    `;

    const prompt = `
        **Task:** You are an expert financial analyst. Analyze the following Balance Sheet data for a specific date. Provide a concise, insightful narrative summary.

        **Balance Sheet Data:**
        ---
        ${bsDataString}
        ---

        **Instructions:**
        1.  **Headline:** Write a single, impactful headline that captures the main story of this Balance Sheet (e.g., "Solid Asset Base Supports Healthy Equity Position").
        2.  **Key Takeaways:** Identify the 2-3 most important insights. Focus on the composition of assets and liabilities, liquidity (Current Assets vs. Current Liabilities if possible), and leverage (Debt vs. Equity). Be specific and reference the data.
        3.  **Format:** Return the response in a valid JSON format adhering to the schema. Do not include any text outside the JSON structure.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are an expert accountant AI. Your goal is to provide a clear, concise, and insightful analysis of a Balance Sheet.",
                responseMimeType: "application/json",
                responseSchema: bsSummarySchema,
                temperature: 0.1,
            }
        });

        if (!response.text) {
            throw new Error("The API returned an empty response for the Balance Sheet summary.");
        }
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Failed to generate Balance Sheet summary:", error);
        throw new Error("Could not generate the AI financial analysis. Please try again later.");
    }
};


// --- PDF EXTRACTION ---
// (Schema definitions are omitted for brevity as they are unchanged)
const incomeStatementExtractionSchema = { type: Type.OBJECT, properties: { revenueSaleOfGoods: { type: Type.STRING }, revenueServices: { type: Type.STRING }, revenueRental: { type: Type.STRING }, otherIncome: { type: Type.STRING }, materialCost: { type: Type.STRING }, directLabor: { type: Type.STRING }, subcontractorCosts: { type: Type.STRING }, directEquipmentCost: { type: Type.STRING }, otherDirectCosts: { type: Type.STRING }, staffSalariesAdmin: { type: Type.STRING }, rentExpenseAdmin: { type: Type.STRING }, utilities: { type: Type.STRING }, marketingAdvertising: { type: Type.STRING }, legalProfessionalFees: { type: Type.STRING }, depreciationAmortization: { type: Type.STRING }, incomeTaxExpense: { type: Type.STRING }, otherGAndA: { type: Type.STRING }, } }; const balanceSheetExtractionSchema = { type: Type.OBJECT, properties: { cashAndBankBalances: { type: Type.STRING }, accountsReceivable: { type: Type.STRING }, inventory: { type: Type.STRING }, prepayments: { type: Type.STRING }, otherCurrentAssets: { type: Type.STRING }, propertyPlantEquipmentNet: { type: Type.STRING }, intangibleAssets: { type: Type.STRING }, investmentProperties: { type: Type.STRING }, longTermInvestments: { type: Type.STRING }, accountsPayable: { type: Type.STRING }, accruedExpenses: { type: Type.STRING }, shortTermLoans: { type: Type.STRING }, currentPortionOfLTDebt: { type: Type.STRING }, longTermLoans: { type: Type.STRING }, leaseLiabilities: { type: Type.STRING }, deferredTaxLiability: { type: Type.STRING }, shareCapital: { type: Type.STRING }, retainedEarnings: { type: Type.STRING }, otherReserves: { type: Type.STRING }, } }; const cashFlowExtractionSchema = { type: Type.OBJECT, properties: { netIncome: { type: Type.STRING }, depreciationAmortization: { type: Type.STRING }, changesInWorkingCapital: { type: Type.STRING }, capitalExpenditures: { type: Type.STRING }, saleOfAssets: { type: Type.STRING }, issuanceOfDebt: { type: Type.STRING }, repaymentOfDebt: { type: Type.STRING }, issuanceOfEquity: { type: Type.STRING }, dividendsPaid: { type: Type.STRING }, } }; const periodDataExtractionSchema = { type: Type.OBJECT, properties: { periodLabel: { type: Type.STRING, description: "The period label (e.g., '2023', 'Q4 2023', 'Dec 2023')" }, incomeStatement: incomeStatementExtractionSchema, balanceSheet: balanceSheetExtractionSchema, cashFlow: cashFlowExtractionSchema, }, required: ['periodLabel', 'incomeStatement', 'balanceSheet', 'cashFlow'] }; const pdfExtractionSchema = { type: Type.OBJECT, properties: { companyName: { type: Type.STRING, description: "The name of the company from the document." }, currency: { type: Type.STRING, description: "The reporting currency symbol or code (e.g., 'USD', '$', 'AED')." }, periods: { type: Type.ARRAY, description: "An array of financial data for each period found in the document. If there are multiple years, create an object for each.", items: periodDataExtractionSchema } }, required: ['companyName', 'currency', 'periods'] };
export const extractFinancialsFromPdf = async (
    pdfFilePart: { inlineData: { data: string; mimeType: string; }; }
): Promise<Partial<ReportData>> => {
    const prompt = `You are an expert financial data extraction tool. Analyze the provided PDF file which contains a company's financial statements. Your task is to meticulously extract data from the Income Statement, Balance Sheet, and Statement of Cash Flows for all periods present in the document.

**Instructions:**
1.  **Identify all periods:** Look for columns representing different years or quarters (e.g., 2023, 2022). Create a separate JSON object for each period.
2.  **Map line items:** Carefully map the financial line items from the document to the fields in the provided JSON schema. Use your accounting knowledge to handle variations in naming (e.g., "Turnover" or "Sales" should map to a revenue field, "Property, Plant & Equipment" to \`propertyPlantEquipmentNet\`).
3.  **Parse numbers correctly:** Extract only the numerical values. Convert them to a string format *without* any currency symbols, commas, or parentheses for negative numbers (use a minus sign instead, e.g., -1000).
4.  **Handle missing data:** If a specific line item is not found in the document for a period, you MUST return the corresponding JSON key with an empty string "" as its value. Do not omit any keys from the schema.
5.  **Detect metadata:** Identify and extract the company's name and the reporting currency (e.g., USD, AED, EUR).
6.  **Return valid JSON:** Your final output must be a single, valid JSON object that strictly adheres to the schema. Do not include any explanatory text or markdown formatting.`;

    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: { parts: [{ "text": prompt }, pdfFilePart] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: pdfExtractionSchema,
                    temperature: 0.0,
                }
            });

            const extractedData = JSON.parse(response.text);

            const processedPeriods = extractedData.periods.map((p: any) => {
                const newPeriod = createInitialPeriod();
                newPeriod.periodLabel = p.periodLabel || '';
                
                for (const statement of ['incomeStatement', 'balanceSheet', 'cashFlow'] as const) {
                    if (p[statement]) {
                        for (const key in newPeriod[statement]) {
                            if (Object.prototype.hasOwnProperty.call(p[statement], key)) {
                                const extractedValue = p[statement][key];
                                const targetField = (newPeriod[statement] as any)[key];

                                // Preserve array types to prevent crashes
                                if (Array.isArray(targetField)) {
                                    (newPeriod[statement] as any)[key] = Array.isArray(extractedValue) ? extractedValue : [];
                                } else {
                                    (newPeriod[statement] as any)[key] = String(extractedValue ?? '');
                                }
                            }
                        }
                    }
                }
                return newPeriod;
            });

            return {
                companyName: extractedData.companyName || '',
                currency: extractedData.currency || 'USD',
                periods: processedPeriods.sort((a,b) => b.periodLabel.localeCompare(a.periodLabel)), // Sort descending
            };
        } catch (error) {
            console.error(`PDF Extraction failed (Attempt ${attempt + 1}):`, error);
            attempt++;
            const isRateLimitError = error instanceof Error && (error.message.includes("429") || error.message.toLowerCase().includes("quota"));

            if (isRateLimitError && attempt < maxRetries) {
                const backoffTime = Math.pow(2, attempt) * 4000 + Math.random() * 1000; // Increased backoff
                await delay(backoffTime);
            } else {
                 if (error instanceof Error && error.message.includes("API_KEY")) throw new Error("Invalid API Key.");
                 const finalErrorMsg = isRateLimitError 
                    ? "The service is busy processing other requests. Please wait a moment and try importing the PDF again."
                    : "Failed to extract data from the PDF. The document might be unreadable, password-protected, or in an unsupported format.";
                 throw new Error(finalErrorMsg);
            }
        }
    }
    throw new Error(`Failed to extract data from PDF after ${maxRetries} attempts due to high service load.`);
};


// --- CHAT FUNCTIONALITY ---
let chat: Chat | null = null;
export const generateChatResponseStream = async (history: ChatMessage[], analysisContext: SectionAnalysis | undefined, reportData: ReportData) => {
    
    const dataSummary = `Company: ${reportData.companyName}, Active Entity: ${reportData.companyName}`; // Simplified for now

    const systemInstruction = `You are an expert financial analyst AI. You are in a chat session with a user who is viewing a financial report you generated.
    Your personality is helpful, concise, and data-driven.
    The user has provided a new message. You have the chat history, the full data summary of the report, and the specific analysis of the section the user is currently looking at.

    **RULES:**
    1.  **Use the provided context**: Base your answers on the chat history, the data summary, and the specific section analysis. Do not hallucinate new data.
    2.  **Be concise**: Get straight to the point.
    3.  **Reference the data**: When answering, refer to specific numbers or trends from the data summary to support your claims.
    4.  **If you don't know, say so**: If the user's question cannot be answered from the provided context, state that you do not have that information in the report.

    **FULL REPORT DATA SUMMARY:**
    ---
    ${dataSummary}
    ---
    
    **ANALYSIS OF CURRENTLY VIEWED SECTION:**
    ---
    ${analysisContext ? JSON.stringify(analysisContext, null, 2) : "No specific section is being viewed."}
    ---
    `;

    // Map our ChatMessage format to the SDK's Content format
    const sdkHistory: Content[] = history.slice(0, -1).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));
    
    const maxRetries = 2;
    let attempt = 0;
    while(attempt < maxRetries) {
        try {
            chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction },
                history: sdkHistory
            });
            
            const lastMessage = history[history.length - 1];
            const result = await chat.sendMessageStream({ message: lastMessage.content });
            return result;

        } catch (error) {
            console.error(`Chat API call failed (Attempt ${attempt + 1}):`, error);
            chat = null;
            attempt++;
             if (error instanceof Error && (error.message.includes("429") || error.message.toLowerCase().includes("quota")) && attempt < maxRetries) {
                await delay(1500);
            } else {
                throw new Error("Sorry, I encountered an error. Please try again.");
            }
        }
    }
    throw new Error("Sorry, the chat service is currently busy. Please try again in a moment.");
};

// --- BANKING RECONCILIATION ---
export const suggestTransactionMatch = async (
    bankTx: BankTransaction,
    bookTxs: Transaction[]
): Promise<MatchSuggestion | null> => {
    const matchSuggestionSchema = {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, enum: ['match', 'create', 'none'] },
            bookTransactionId: { type: Type.STRING, description: "The ID of the best matching book transaction. Only if type is 'match'." },
            suggestedAccountId: { type: Type.STRING, description: "The suggested account ID for creating a new transaction. Only if type is 'create'." },
        },
        required: ['type']
    };

    const bookTxsForPrompt = bookTxs.map(tx => ({
        id: tx.id,
        date: tx.date,
        description: tx.description,
        amount: tx.amount
    }));

     const accountListForPrompt = `
      'inc_sales': 'Sales Revenue', 'inc_consulting': 'Consulting Income', 'inc_interest': 'Interest Income', 'inc_other': 'Other Income',
      'exp_advertising': 'Advertising & Marketing', 'exp_bank_fees': 'Bank Fees', 'exp_cogs': 'Cost of Goods Sold',
      'exp_contractors': 'Contractors & Freelancers', 'exp_insurance': 'Insurance', 'exp_legal': 'Legal & Professional Services',
      'exp_meals': 'Meals & Entertainment', 'exp_office': 'Office Supplies & Expenses', 'exp_rent': 'Rent & Lease',
      'exp_repairs': 'Repairs & Maintenance', 'exp_salaries': 'Salaries & Wages', 'exp_software': 'Software & Subscriptions',
      'exp_travel': 'Travel Expenses', 'exp_utilities': 'Utilities', 'exp_other': 'Other Business Expenses'
    `;

    const prompt = `
        **Task:** You are an AI reconciliation assistant. Your job is to match a single bank transaction with a list of unreconciled book transactions.

        **Bank Transaction to Match:**
        ---
        ${JSON.stringify(bankTx, null, 2)}
        ---

        **List of Available Book Transactions:**
        ---
        ${JSON.stringify(bookTxsForPrompt, null, 2)}
        ---
        
        **Chart of Accounts for Categorization:**
        ---
        ${accountListForPrompt}
        ---

        **Instructions:**
        1.  **Find the best match:** Look for a book transaction that is a close match based on amount and date (within a few days). A similar description is a strong indicator. If you find a confident match, return \`{ "type": "match", "bookTransactionId": "..." }\`.
        2.  **Suggest creation:** If no good match exists, analyze the bank transaction description to suggest a category for creating a *new* book transaction. Choose the most logical account ID from the provided Chart of Accounts. Return \`{ "type": "create", "suggestedAccountId": "..." }\`.
        3.  **No suggestion:** If you cannot confidently match or categorize, return \`{ "type": "none" }\`.
        4.  **Important:** Only match against the provided book transactions. Only categorize using the provided account list. Your output must be valid JSON.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: matchSuggestionSchema,
                temperature: 0.0,
            }
        });
        
        const suggestion = JSON.parse(response.text) as MatchSuggestion | { type: 'none' };
        return suggestion.type === 'none' ? null : suggestion;

    } catch (error) {
        console.error("Failed to get reconciliation suggestion:", error);
        // Don't throw, just return null so the UI can handle it gracefully
        return null;
    }
};

// --- New Function for Proactive Bank Feed Analysis ---
export const analyzeBankFeed = async (
    unreconciledTxs: BankTransaction[],
    chartOfAccounts: ChartOfAccount[]
): Promise<AIBankFeedInsight[]> => {
    const insightSchema = {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['CREATE_RULE', 'RECURRING_PAYMENT'] },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            data: {
                type: Type.OBJECT,
                properties: {
                    keyword: { type: Type.STRING },
                    suggestedAccountId: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    frequency: { type: Type.STRING, enum: ['weekly', 'monthly'] },
                }
            }
        },
        required: ['id', 'type', 'title', 'description', 'data']
    };

    const txsForPrompt = unreconciledTxs.map(tx => ({
        description: tx.description,
        amount: tx.amount
    }));

    const accountsForPrompt = chartOfAccounts
        .filter(acc => acc.type === 'Expense' || acc.type === 'Income')
        .map(acc => `'${acc.id}': '${acc.name}'`)
        .join(', ');

    const prompt = `
        **Task:** You are an AI accounting assistant. Analyze the following list of unreconciled bank transactions to identify patterns and suggest automations.

        **Unreconciled Transactions:**
        ---
        ${JSON.stringify(txsForPrompt, null, 2)}
        ---

        **Available Categories (Chart of Accounts):**
        ---
        { ${accountsForPrompt} }
        ---

        **Instructions:**
        1.  **Identify recurring payments:** Look for transactions with the same or very similar descriptions and amounts that appear to be on a regular schedule (e.g., weekly, monthly). For these, generate an insight of type 'RECURRING_PAYMENT'.
        2.  **Suggest categorization rules:** Find groups of transactions with similar keywords in their descriptions (e.g., "Starbucks", "Uber", "Adobe") that are not yet automated. For these, generate an insight of type 'CREATE_RULE'. Suggest a keyword and the most logical category from the provided chart of accounts.
        3.  **Prioritize:** Generate a maximum of 3-4 of the most impactful insights. A rule that covers many transactions is more impactful than a one-off recurring payment.
        4.  **Format:** Your output must be a single, valid JSON array of insight objects, adhering to the schema.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.ARRAY, items: insightSchema },
                temperature: 0.2,
            }
        });
        if (!response.text) return [];
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Failed to analyze bank feed:", error);
        return [];
    }
};

export const generateKPIDeepDive = async (
    title: string,
    transactions: Transaction[]
): Promise<KPIDeepDiveResponse> => {
    const kpiDeepDiveSchema = {
        type: Type.OBJECT,
        properties: {
            narrative: { type: Type.STRING, description: "A 2-3 sentence narrative explaining the key drivers for this KPI, based on the provided transactions." },
            chart: chartSchema
        },
        required: ['narrative', 'chart']
    };

    const transactionData = transactions.map(t => ({ description: t.description, amount: t.amount, date: t.date })).slice(0, 50);

    const prompt = `
        **Task:** You are a financial analyst. A user wants to understand what is driving the KPI: "${title}".
        Analyze the provided list of transactions that contribute to this KPI.

        **Transaction Data:**
        ---
        ${JSON.stringify(transactionData, null, 2)}
        ---

        **Instructions:**
        1.  **Narrative:** Write a short, insightful narrative explaining the main contributors or trends within this data. For example, if analyzing expenses, point out the largest transaction or most frequent vendor.
        2.  **Chart:** Create a single, appropriate chart to visualize the data. A 'bar' or 'pie' chart is usually best for this. The chart should show the top 5-7 contributors. Group smaller items into an 'Other' category if necessary.
        3.  **Format:** Return a single, valid JSON object adhering to the schema.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: kpiDeepDiveSchema,
                temperature: 0.1,
            }
        });
        if (!response.text) {
            throw new Error("The API returned an empty response for the KPI deep dive.");
        }
        return JSON.parse(response.text);
    } catch (error) {
        console.error(`Failed to generate KPI deep dive for "${title}":`, error);
        throw new Error(`Could not generate the AI analysis for ${title}.`);
    }
};

export const generateBusinessInsights = async (
    transactions: Transaction[],
    invoices: Invoice[],
    bills: Bill[],
    budgets: Budgets,
    inventory: InventoryItem[]
): Promise<InsightCard[]> => {
    const insightCardSchema = {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, enum: ['cash_flow', 'overdue', 'budget', 'large_expense', 'inventory', 'general'] },
            severity: { type: Type.STRING, enum: ['Critical', 'Warning', 'Info'] },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            link: { type: Type.STRING, description: "A relative path to navigate to, e.g., 'bookkeeping/sales'." },
        },
        required: ['type', 'severity', 'title', 'description']
    };

    const dataContext = `
        - Recent Transactions: ${transactions.length} entries
        - Overdue Invoices: ${invoices.filter(i => i.status === 'Overdue').length}
        - Overdue Bills: ${bills.filter(b => b.status === 'Overdue').length}
        - Budgets are set for ${Object.keys(budgets).length} expense accounts.
        - Inventory is tracked for ${inventory.length} items.
    `;

    const prompt = `
        **Task:** You are an AI business advisor. Analyze the following summary of a company's financial data to identify the top 3-5 most important insights.

        **Data Context:**
        ---
        ${dataContext}
        ---

        **Instructions:**
        1.  **Identify Risks & Opportunities:** Look for potential issues (e.g., cash flow shortfalls, overdue items, budget overruns) or positive trends.
        2.  **Be Actionable:** Frame your insights with clear titles and descriptions that explain *why* it's important.
        3.  **Assign Severity:** Use 'Critical' for urgent issues, 'Warning' for potential problems, and 'Info' for helpful observations.
        4.  **Provide a Link:** Suggest a relevant page for the user to investigate further. Use one of: 'bookkeeping/dashboard', 'bookkeeping/sales', 'bookkeeping/purchases', 'bookkeeping/budgets', 'bookkeeping/inventory', 'bookkeeping/forecast'.
        5.  **Format:** Return a valid JSON array of insight objects. If no significant insights are found, return an empty array.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.ARRAY, items: insightCardSchema },
                temperature: 0.3,
            }
        });
        if (!response.text) {
            return [];
        }
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Failed to generate business insights:", error);
        throw new Error("Could not generate AI insights at this time.");
    }
};

export const generateCashFlowForecast = async (
    startingBalance: number,
    recentTransactions: Transaction[],
    invoices: Invoice[],
    bills: Bill[],
    recurring: RecurringTransaction[],
    manualAdjustments: ManualAdjustment[]
): Promise<CashFlowForecast> => {
     const forecastPeriodSchema = {
        type: Type.OBJECT,
        properties: {
            week: { type: Type.STRING, description: "Label for the week, e.g., 'Jul 15-21'" },
            inflows: { type: Type.NUMBER },
            outflows: { type: Type.NUMBER },
            netChange: { type: Type.NUMBER },
            endingBalance: { type: Type.NUMBER }
        },
        required: ['week', 'inflows', 'outflows', 'netChange', 'endingBalance']
    };
    const cashFlowForecastSchema = {
        type: Type.OBJECT,
        properties: {
            narrative: { type: Type.STRING, description: "A 2-3 sentence summary of the forecast, highlighting key upcoming cash movements." },
            startingBalance: { type: Type.NUMBER },
            forecast: { type: Type.ARRAY, items: forecastPeriodSchema }
        },
        required: ['narrative', 'startingBalance', 'forecast']
    };

    const dataForPrompt = {
        startingBalance,
        openInvoices: invoices.filter(i => i.status !== 'Paid').map(i => ({ dueDate: i.dueDate, amountDue: i.lineItems.reduce((s,li) => s + li.quantity * li.unitPrice, 0) - (i.payments?.reduce((s,p) => s+p.amount,0) || 0) })),
        openBills: bills.filter(b => b.status === 'Awaiting Payment' || b.status === 'Overdue').map(b => ({ dueDate: b.dueDate, amount: b.lineItems.reduce((s,li) => s + li.quantity * li.unitPrice, 0) })),
        recurring,
        manualAdjustments
    };

    const prompt = `
        **Task:** Create an 8-week cash flow forecast.
        
        **Data:**
        ---
        ${JSON.stringify(dataForPrompt, null, 2)}
        ---

        **Instructions:**
        1.  **Starting Point:** Begin with the provided 'startingBalance'.
        2.  **Project Weekly:** For each of the next 8 weeks, calculate expected inflows (from open invoices, recurring income) and outflows (from open bills, recurring expenses). Include any manual adjustments in their respective weeks.
        3.  **Calculate Balances:** For each week, calculate the net change and the ending balance. The ending balance of one week is the starting balance for the next.
        4.  **Narrative:** Write a brief summary explaining the main drivers of the cash flow changes over the forecast period.
        5.  **Format:** Return a single, valid JSON object.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: cashFlowForecastSchema,
                temperature: 0.1,
            }
        });
        if (!response.text) {
            throw new Error("The API returned an empty forecast response.");
        }
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Failed to generate cash flow forecast:", error);
        throw new Error("Could not generate the AI cash flow forecast.");
    }
};