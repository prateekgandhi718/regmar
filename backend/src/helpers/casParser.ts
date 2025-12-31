export interface ParsedCAS {
  casId: string;
  statementPeriod: string;
  summary: {
    totalValue: number;
    equityValue: number;
    mfFolioValue: number;
    mfDematValue: number;
  };
  historicalValuation: Array<{
    monthYear: string;
    value: number;
    changeValue: number;
    changePercentage: number;
  }>;
  mutualFunds: Array<{
    name: string;
    isin: string;
    folio: string;
    type: 'Regular' | 'Direct';
    units: number;
    nav: number;
    investedValue: number;
    currentValue: number;
    unrealizedPnL: number;
    unrealizedPnLPercentage: number;
  }>;
  stocks: Array<{
    name: string;
    isin: string;
    currentBalance: number;
    frozenBalance: number;
    pledgeBalance: number;
    freeBalance: number;
    marketPrice: number;
    currentValue: number;
  }>;
}

const parseAmount = (val: string | undefined): number => {
  if (!val || val === '--' || val.toLowerCase() === 'n.a') return 0;
  const cleaned = val.replace(/[^\d.-]/g, '').trim();
  return parseFloat(cleaned) || 0;
};

const cleanName = (name: string): string => {
  return name
    .replace(/\s+/g, ' ')
    .replace(/(?:Page \d+ of \d+|CAS ID: [A-Z0-9]+|Statement for the period|Portfolio Valuation|Portfolio Value|INR\) Loss\(%\)|Scheme Name|ISIN|Folio No\.|Bal NAV|Valuation|Invested|Profit\/Loss|Cumulative Amount|Closing Balance|Opening Balance|Transaction Description|Amount|Asset Class|Value in|Changes in|Account Details|Grand Total)/gi, '')
    .replace(/[A-Z0-9]{12}/g, '') 
    .replace(/\d{1,}\.\d{2,}/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const parseCASText = (fullText: string): ParsedCAS | null => {
  try {
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    const result: ParsedCAS = {
      casId: '',
      statementPeriod: '',
      summary: {
        totalValue: 0,
        equityValue: 0,
        mfFolioValue: 0,
        mfDematValue: 0,
      },
      historicalValuation: [],
      mutualFunds: [],
      stocks: [],
    };

    // 1. Metadata
    const casIdMatch = fullText.match(/CAS ID:\s*([A-Z0-9]+)/i);
    if (casIdMatch) result.casId = casIdMatch[1];

    const periodMatch = fullText.match(/Statement for the period from\s+(.+?)\s+to\s+(.+?)(?:\s|$)/i);
    if (periodMatch) result.statementPeriod = `${periodMatch[1]} - ${periodMatch[2]}`;

    // 2. Section Based Parsing
    let currentSection: 'NONE' | 'HISTORICAL' | 'SUMMARY' | 'STOCKS' | 'MFS' = 'NONE';
    let lastIsinIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lower = line.toLowerCase();

      // Section Transitions
      if (lower.includes('valuation for year') || (lower.includes('month-year') && lower.includes('changes'))) {
        currentSection = 'HISTORICAL';
        continue;
      } else if (lower.includes('assets class') || (lower.includes('equity') && lower.includes('%') && lower.includes('value'))) {
        currentSection = 'SUMMARY';
        continue;
      } else if (lower.includes('holding statement as on') || (lower.includes('isin') && lower.includes('security') && lower.includes('current balance'))) {
        currentSection = 'STOCKS';
        lastIsinIdx = -1;
        continue;
      } else if (lower.includes('mutual fund units held as on')) {
        currentSection = 'MFS';
        lastIsinIdx = -1;
        continue;
      }

      if (currentSection === 'HISTORICAL') {
        const histMatch = line.match(/^([A-Z][a-z]{2}\s+\d{4})\s+([\d,]+\.\d+)/);
        if (histMatch) {
          const parts = line.split(/\s{2,}/).filter(p => p.length > 0);
          if (parts.length >= 2) {
            result.historicalValuation.push({
              monthYear: parts[0],
              value: parseAmount(parts[1]),
              changeValue: parseAmount(parts[2]),
              changePercentage: parseAmount(parts[3])
            });
          }
        } else if (result.historicalValuation.length > 0 && !lower.includes('asset class')) {
           // End historical section if we find something else
           // But let's keep it until next section transition
        }
      } else if (currentSection === 'SUMMARY') {
        const amountMatch = line.match(/([\d,]+\.\d+)/);
        if (amountMatch) {
          const val = parseAmount(amountMatch[1]);
          if (lower.includes('mutual fund folios')) result.summary.mfFolioValue = val;
          else if (lower.includes('equity') && !lower.includes('mutual')) result.summary.equityValue = val;
          else if (lower.includes('demat form')) result.summary.mfDematValue = val;
          else if (lower.includes('total') && !lower.includes('isins')) result.summary.totalValue = val;
        }
      } else if (currentSection === 'STOCKS') {
        const isinMatch = line.match(/(INE[A-Z0-9]{9}|INF[A-Z0-9]{9})/);
        if (isinMatch && line.match(/[\d,]+\.\d+/)) {
          const isin = isinMatch[1];
          const parts = line.split(/\s{2,}/).filter(p => p.length > 0);
          const idxInParts = parts.findIndex(p => p.includes(isin));
          
          if (idxInParts !== -1 && parts.length >= idxInParts + 4) {
             let nameParts = [];
             for (let j = Math.max(lastIsinIdx + 1, i - 2); j < i; j++) {
               if (!lines[j].includes('---') && !lines[j].includes('Page')) nameParts.push(lines[j]);
             }
             nameParts.push(parts[0].replace(isin, '').trim());
             
             result.stocks.push({
               isin,
               name: cleanName(nameParts.join(' ')),
               currentBalance: parseAmount(parts[idxInParts + 1]),
               frozenBalance: parseAmount(parts[idxInParts + 2]),
               pledgeBalance: parseAmount(parts[idxInParts + 3]),
               freeBalance: parseAmount(parts[idxInParts + 5]),
               marketPrice: parseAmount(parts[idxInParts + 6]),
               currentValue: parseAmount(parts[idxInParts + 7])
             });
             lastIsinIdx = i;
          }
        }
      } else if (currentSection === 'MFS') {
        const isinMatch = line.match(/(INF[A-Z0-9]{9})/);
        if (isinMatch && line.match(/[\d,]+\.\d+/)) {
          const isin = isinMatch[1];
          const parts = line.split(/\s{2,}/).filter(p => p.length > 0);
          const idxInParts = parts.findIndex(p => p.includes(isin));

          if (idxInParts !== -1 && parts.length >= idxInParts + 5) {
             let nameParts = [];
             for (let j = Math.max(lastIsinIdx + 1, i - 2); j < i; j++) {
                if (!lines[j].includes('---') && !lines[j].includes('Page')) nameParts.push(lines[j]);
             }
             nameParts.push(parts[0].replace(isin, '').trim());

             const fullName = cleanName(nameParts.join(' '));
             result.mutualFunds.push({
               isin,
               name: fullName,
               folio: parts[idxInParts + 1],
               units: parseAmount(parts[idxInParts + 2]),
               nav: parseAmount(parts[idxInParts + 3]),
               investedValue: parseAmount(parts[idxInParts + 4]),
               currentValue: parseAmount(parts[idxInParts + 5]),
               unrealizedPnL: parseAmount(parts[idxInParts + 6]),
               unrealizedPnLPercentage: parseAmount(parts[idxInParts + 7]),
               type: fullName.toLowerCase().includes('direct') ? 'Direct' : 'Regular'
             });
             lastIsinIdx = i;
          }
        }
      }
    }

    // Final fallback for total value
    if (result.summary.totalValue === 0) {
      const totalMatch = fullText.match(/Total Portfolio Value\s+(?:across investments\s+)?(?:₹|`|Rs\.)?\s*([\d,]+\.\d+)/i);
      if (totalMatch) result.summary.totalValue = parseAmount(totalMatch[1]);
    }

    return result;
  } catch (error) {
    console.error('Final Refined CAS Parsing Error:', error);
    return null;
  }
};
