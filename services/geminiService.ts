
import { GoogleGenAI, Type, GenerateContentResponse, Chat, Content } from "@google/genai";
import { 
    ReportData, PeriodData, SectionAnalysis, ChatMessage,
    createInitialPeriod, QuantitativeData,
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


// --- HELPERS ---
const safeParse = (value: string | number): number => {
    if (typeof value === 'number') return value;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
};
const format = (val: string | number) => typeof val === 'number' ? val.toLocaleString() : (val ? safeParse(val).toLocaleString() : '0');

// --- MULTI-MODEL PERSONA ---
const getModelPersonaSystemPrompt = (persona: string): string => {
    switch (persona) {
        case 'gpt-4o':
            return "You will emulate the persona of OpenAI's GPT-4o. Your analysis should be comprehensive, multi-faceted, and highly structured. Use clear headings and subheadings. The tone should be authoritative and professional, like a top-tier consulting report.";
        case 'claude-3-sonnet':
            return "You will emulate the persona of Anthropic's Claude 3 Sonnet. Your analysis should be balanced, nuanced, and very easy to understand. The tone should be conversational yet professional, focusing on clear explanations of complex topics and providing a well-rounded perspective.";
        case 'gemini-2.5-flash':
        default:
            return "You are a world-class senior financial analyst. Your analysis is balanced, insightful, and data-driven, representing the native capabilities of Google's Gemini model.";
    }
};

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
    const workingCapital = totalCurrentAssets - totalCurrentLiabilities;
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

const getFinancialSectionInstructions = (sectionId: string): { quant: string, narrative: string } => {
    const baseNarrativeInstruction = "Structure the detailed narrative with markdown bolding for subheadings (e.g., **Trend Analysis**, **Key Drivers**, **Implications**). Ensure Key Takeaways are ALWAYS provided, even for placeholder sections. Your explanations should be educational, briefly defining key terms for a non-financial audience.";
    
    const instructions: { [key: string]: { quant: string, narrative: string } } = {
        'executive_summary': {
            quant: `Calculate these KPIs for the latest period: Total Revenue, Net Income, Operating Cash Flow, and Return on Equity (ROE). Generate one Chart: "Key Financials Trend" (Line chart with series for "Total Revenue", "Net Income", and "Operating Cash Flow").`,
            narrative: `Using the provided quantitative data, write a high-level overview of the company's financial story across all periods. What are the most important trends? What is the overall trajectory and financial health? ${baseNarrativeInstruction}`
        },
        'profit_or_loss': {
            quant: `Calculate these KPIs: Total Revenue, Gross Profit Margin, Net Income. Generate Chart 1 (Waterfall): "Profit & Loss Breakdown (Latest Period)". Steps should be Total Revenue, COGS, Gross Profit, Operating Expenses, Operating Profit, Tax, Net Income.`,
            narrative: `Using the quantitative data, analyze profitability trends. Explain revenue growth. Discuss drivers for changes in Gross Profit, Operating Profit, and Net Income. Are margins improving or declining, and why? ${baseNarrativeInstruction}`
        },
        'financial_position': {
            quant: `Calculate these KPIs: Total Assets, Working Capital, Debt-to-Equity Ratio. Generate Chart 1 (Bar): "Asset Composition (Current vs. Non-Current)". Generate Chart 2 (Pie): "Liability & Equity Composition (Latest Period)".`,
            narrative: `Using the quantitative data, analyze the company's financial health and capital structure. Discuss liquidity trends (Current Ratio). Explain leverage evolution (Debt-to-Equity ratio). What does the composition of assets and liabilities tell you? ${baseNarrativeInstruction}`
        },
        'cash_flows': {
            quant: `Calculate these KPIs: Operating Cash Flow, Investing Cash Flow, and Financing Cash Flow. Generate one Chart: "Cash Flow from Activities Trend" (Line chart with series for Operating, Investing, Financing).`,
            narrative: `Using the quantitative data, analyze cash generation and usage. Explain if the core business is generating positive cash flow (CFO). What are the main uses of cash? Is the overall cash balance growing? ${baseNarrativeInstruction}`
        },
        'key_ratios': {
            quant: `Calculate these KPIs: Current Ratio (liquidity), Debt-to-Equity (leverage), Return on Equity (ROE), Return on Assets (ROA), and Earnings Per Share (EPS). Calculate DSO, DIO, DPO, and the Cash Conversion Cycle.`,
            narrative: `Using the calculated ratios, analyze their trends. Explain what each ratio indicates about the company's liquidity, leverage, profitability, and operational efficiency over time. ${baseNarrativeInstruction}`
        },
        'common_size_analysis': {
            quant: `Generate two Bar charts for the latest period: 1. "Common-Size Income Statement" (show major items like COGS, Gross Profit, OpEx, Net Income as % of Revenue). 2. "Common-Size Balance Sheet" (show major items like Cash, AR, Inventory, PPE, AP, Debt, Equity as % of Total Assets).`,
            narrative: `Using the quantitative data, interpret the common-size statements. What are the key structural components of the P&L and Balance Sheet? How have these structures changed over time? What insights does this provide into the business model and financial strategy? ${baseNarrativeInstruction}`
        },
        'dupont_analysis': {
            quant: `Calculate the three components of DuPont analysis for each period: Net Profit Margin (Profitability), Asset Turnover (Efficiency), and Equity Multiplier (Leverage). Also calculate the resulting Return on Equity (ROE). Generate a Line chart: "DuPont Component Trends" showing series for all three components.`,
            narrative: `Using the quantitative data, deconstruct the Return on Equity (ROE). Explain how each of the three levers (Profitability, Efficiency, Leverage) has contributed to the changes in ROE over time. Which driver is having the biggest impact? ${baseNarrativeInstruction}`
        },
        'scenario_analysis': {
            quant: `Based on the user's scenario assumptions and the latest period's data, project the next period's pro-forma financials. Calculate and return KPIs for Projected Revenue, Projected Net Income, and Projected EBITDA. If no assumptions provided, return empty arrays.`,
            narrative: `If quantitative data exists, explain the projected outcomes based on the user's assumptions. Discuss the potential impact on profitability and the key drivers of the forecasted change. If no assumptions, use the placeholder strategy: explain the importance of scenario analysis for strategic planning and decision-making. ${baseNarrativeInstruction}`
        },
        'valuation_multiples': {
            quant: `Calculate key valuation multiples for the latest period: Price/Earnings (P/E), Price/Sales (P/S), and EV/EBITDA. EV = Market Valuation + Total Debt - Cash. If valuation is not provided, return empty arrays.`,
            narrative: `Using the calculated multiples, analyze the company's valuation. Use Google Search to find comparable trading multiples for the user-provided competitors. Compare the company's valuation to its peers. Is it overvalued, undervalued, or fairly valued, and why? ${baseNarrativeInstruction}`
        },
        'budget_vs_actuals': {
            quant: `If budget data exists, create KPIs for Revenue Variance (%), COGS Variance (%), and OpEx Variance (%). Generate a Bar chart: "Budget vs. Actuals" with series for Budget and Actual Revenue, COGS, and OpEx for the latest period. If no budget data, return empty arrays for KPIs and charts.`,
            narrative: `If quantitative data exists, perform a variance analysis. Analyze key variances and explain their impact. If no data, use the placeholder strategy: explain the importance of variance analysis for management control and decision-making. ${baseNarrativeInstruction}`
        },
        'revenue_deep_dive': {
            quant: `Calculate KPIs for Period-over-Period Revenue Growth Rate. If segment data exists, create a Pie Chart: "Revenue by Segment (Latest Period)". If no segment data, create a Bar Chart: "Revenue Composition (Goods vs. Services)".`,
            narrative: `Using the quantitative data, provide a detailed analysis of revenue. Analyze growth rates and composition. If segment data exists, analyze performance by segment, identifying key contributors. ${baseNarrativeInstruction}`
        },
        'cost_and_margin_analysis': {
            quant: `Calculate these KPIs: Gross Margin %, Operating Margin %, Net Margin %. Create a line chart: "Margin Trends" with series for each of the three margin types.`,
            narrative: `Using the quantitative data, analyze the company's cost structure. Discuss COGS and OpEx as a percentage of revenue. Analyze margin trends and explain what is driving expansion or contraction. ${baseNarrativeInstruction}`
        },
        'working_capital': {
            quant: `Calculate these KPIs: Working Capital, Accounts Receivable Days, Accounts Payable Days, Inventory Days. Calculate the Cash Conversion Cycle.`,
            narrative: `Using the quantitative data, analyze Working Capital trends and its components. Discuss the Cash Conversion Cycle. Explain if the company is managing its short-term operational assets and liabilities efficiently. ${baseNarrativeInstruction}`
        },
        'debt_and_leverage': {
            quant: `Calculate these KPIs: Total Debt, Debt-to-Equity Ratio, Debt-to-EBITDA Ratio. Create a Pie chart: "Debt Composition (Short-term vs. Long-term)".`,
            narrative: `Using the quantitative data, analyze the company's total debt, its composition, and key leverage ratios. Explain if the leverage level is appropriate for the company's industry and risk profile. ${baseNarrativeInstruction}`
        },
        'financial_risks': {
            quant: ``, // No quantitative data needed for this section
            narrative: `Based on all provided financial data, identify and explain the top 3-5 financial risks facing the company. These could include liquidity risk (e.g., from low cash), profitability risk (e.g., from declining margins), or leverage risk (e.g., from high debt). ${baseNarrativeInstruction}`
        },
        'esg_and_sustainability': {
            quant: `If ESG data is provided, create a Line Chart: "ESG Metric Trends" with series for CO2 Emissions and Water Usage. Create KPIs for the latest values of all four ESG metrics. If no data, return empty arrays.`,
            narrative: `If quantitative data exists, analyze the trends for each metric. Explain what these trends indicate about the company's sustainability and social performance. If no data, use the placeholder strategy explaining the growing importance of ESG metrics. ${baseNarrativeInstruction}`
        },
        'competitor_benchmarking': {
            quant: `If user has provided competitors, generate bar charts comparing this company's latest Gross Margin %, Net Margin %, and Debt-to-Equity ratio against the industry averages you will find via search.`,
            narrative: `Using Google Search, find typical financial ratios (Gross Margin %, Net Margin %, Debt-to-Equity) for the **specific competitors provided by the user**. Compare these benchmarks to this company's latest period data to provide a targeted, contextual performance analysis. Explain how the company stacks up against its peers. ${baseNarrativeInstruction}`
        },
        'report_methodology': {
            quant: ``,
            narrative: `Explain the methodologies used in this report for the key analytical frameworks. Cover Common-Size Analysis (defining base figures), DuPont Analysis (breaking down the formula), and Valuation Multiples (defining P/E, P/S, EV/EBITDA). This adds transparency and credibility. ${baseNarrativeInstruction}`
        }
    };
    return instructions[sectionId] || { quant: '', narrative: `Generate a placeholder analysis for section ${sectionId}. ${baseNarrativeInstruction}`};
};

// --- API CALL FUNCTIONS ---

const performApiCall = async <T>(config: any, sectionId: string): Promise<T> => {
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const response = await ai.models.generateContent(config);
            if (!response.text) {
                throw new Error("The API returned an empty response.");
            }
            return JSON.parse(response.text) as T;
        } catch (error) {
            console.error(`Gemini API call failed for section ${sectionId} (Attempt ${attempt + 1}):`, error);
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
    throw new Error(`Failed to generate analysis for section ${sectionId} after ${maxRetries} attempts.`);
};


// --- PASS 1: QUANTITATIVE ANALYSIS ---
export const generateQuantitativeData = async (
    reportData: ReportData, 
    sectionId: string
): Promise<QuantitativeData> => {
    const promptData = reportData.periods.map(p => formatFinancialDataForPrompt(p, reportData.currency)).join('\n---\n');
    const { quant: sectionInstructions } = getFinancialSectionInstructions(sectionId);

    if (!sectionInstructions) { 
        return { keyMetrics: [], charts: [] };
    }
    
    let additionalContext = '';
    if (sectionId === 'scenario_analysis' && reportData.scenario) {
        additionalContext += `**Scenario Assumptions:** Revenue Growth: ${reportData.scenario.revenueGrowth}%, COGS as % of Revenue: ${reportData.scenario.cogsPercentage}%, OpEx Growth: ${reportData.scenario.opexGrowth}%\n`;
    }
     if (sectionId === 'valuation_multiples' && reportData.marketValuation) {
        additionalContext += `**Valuation Data:** Market Valuation: ${reportData.marketValuation}\n`;
    }

    const prompt = `
        **Task:** Perform quantitative analysis for the **'${sectionId}'** section.
        **Context:**
        - **Industries:** ${reportData.industries.join(', ')}
        ${additionalContext}
        - **Data Summary:**
        ---
        ${promptData}
        ---
        **Instructions for '${sectionId}':**
        ${sectionInstructions}
        
        **Output Format:**
        The output MUST be a single, valid JSON object that strictly adheres to the provided schema. Do not include any markdown formatting.
    `;

    const result = await performApiCall<QuantitativeData>({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            temperature: 0.0,
            responseMimeType: "application/json",
            responseSchema: quantitativeDataSchema,
        },
    }, sectionId);

    return {
        keyMetrics: result.keyMetrics || [],
        charts: result.charts || [],
    };
};

// --- PASS 2: NARRATIVE SYNTHESIS ---
export const generateNarrative = async (
    quantitativeData: QuantitativeData,
    reportData: ReportData, 
    sectionId: string,
    persona: string
): Promise<Omit<SectionAnalysis, 'quantitativeData'>> => {
    
    const systemInstruction = getModelPersonaSystemPrompt(persona);
    const { narrative: sectionInstructions } = getFinancialSectionInstructions(sectionId);
    const useSearch = sectionId === 'competitor_benchmarking' || sectionId === 'valuation_multiples';
     const quantContext = `
        **PRE-CALCULATED DATA (for your reference):**
        ---
        ${JSON.stringify(quantitativeData, null, 2)}
        ---
    `;
    
    let competitorContext = '';
    if (useSearch && reportData.competitors.length > 0) {
        competitorContext = `When using Google Search, focus your queries on these specific competitors: **${reportData.competitors.join(', ')}**.`;
    }

    const prompt = `
        **Task:** Write the narrative analysis for the **'${sectionId}'** section.
        **Context:**
        - **Industries:** ${reportData.industries.join(', ')}
        ${competitorContext}
        ${quantitativeData.keyMetrics || quantitativeData.charts ? quantContext : ''}

        **Instructions for '${sectionId}':**
        ${sectionInstructions}

        **Output Format:**
        Provide a text-only response. Structure your response strictly with these headings on new lines:
        - **HEADLINE:** A single, impactful headline.
        - **TAKEAWAYS:** A bulleted list of 3-5 key takeaways, each on a new line starting with '* '.
        - **NARRATIVE:** A detailed narrative in multiple paragraphs.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { 
            tools: useSearch ? [{ googleSearch: {} }] : [],
            systemInstruction
        },
    });

    const text = response.text;
    if (!text) throw new Error("The API returned an empty response for narrative generation.");
    
    const headlineMatch = text.match(/^HEADLINE:(.*)$/m);
    const takeawaysMatch = text.match(/^TAKEAWAYS:(.*?)NARRATIVE:/ms);
    const narrativeMatch = text.match(/^NARRATIVE:(.*)$/ms);

    const headline = headlineMatch ? headlineMatch[1].trim() : `Analysis for ${sectionId}`;
    const takeaways = takeawaysMatch ? takeawaysMatch[1].trim().split('\n').filter(t => t.trim().startsWith('*')).map(t => t.replace(/^\*\s*/, '').trim()) : [];
    const narrative = narrativeMatch ? narrativeMatch[1].trim() : text.replace(/^HEADLINE:.*$/m, '').replace(/^TAKEAWAYS:.*$/ms, '').trim();

    return {
        headline,
        takeaways,
        narrative,
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map(chunk => chunk.web)
            .filter((web): web is { uri: string; title?: string } => !!web?.uri)
            .map(web => ({ uri: web.uri, title: web.title || new URL(web.uri).hostname })) || []
    };
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

            // Post-processing to ensure all keys are present and values are strings
            const processedPeriods = extractedData.periods.map((p: any) => {
                const newPeriod = createInitialPeriod();
                newPeriod.periodLabel = p.periodLabel || '';
                
                for (const statement of ['incomeStatement', 'balanceSheet', 'cashFlow'] as const) {
                    if (p[statement]) {
                        for (const key in newPeriod[statement]) {
                            if (Object.prototype.hasOwnProperty.call(p[statement], key)) {
                                (newPeriod[statement] as any)[key] = String(p[statement][key] ?? '');
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
    
    const dataSummary = JSON.stringify(reportData, null, 2);

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