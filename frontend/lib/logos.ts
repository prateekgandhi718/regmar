const DOMAIN_MAPPING: Record<string, string> = {
  // Axis Bank
  'axis.bank.in': 'axisbank.com',
  'axisbank.com': 'axisbank.com',
  'axisbank.in': 'axisbank.com',
  
  // HDFC Bank
  'hdfcbank.net': 'hdfcbank.com',
  'hdfcbank.com': 'hdfcbank.com',
  
  // ICICI Bank
  'icicibank.com': 'icicibank.com',
  'icicibank.org': 'icicibank.com',
  
  // SBI
  'sbi.co.in': 'sbi.co.in',
  'onlinesbi.com': 'sbi.co.in',
  'sbicard.com': 'sbicard.com',
  
  // Kotak
  'kotak.com': 'kotak.com',
  
  // Yes Bank
  'yesbank.in': 'yesbank.in',
  'yesbank.com': 'yesbank.in',
  
  // IDFC First
  'idfcfirstbank.com': 'idfcfirstbank.com',
  
  // IndusInd
  'indusind.com': 'indusind.com',
  
  // RBL
  'rblbank.com': 'rblbank.com',
  
  // Federal Bank
  'federalbank.co.in': 'federalbank.co.in',
  
  // PNB
  'pnb.co.in': 'pnbindia.in',
  'pnbindia.in': 'pnbindia.in',
  
  // Bank of Baroda
  'bankofbaroda.com': 'bankofbaroda.in',
  'bankofbaroda.in': 'bankofbaroda.in',
  
  // South Indian Bank
  'sib.co.in': 'southindianbank.com',
  
  // IDBI
  'idbi.com': 'idbibank.in',
  'idbibank.in': 'idbibank.in',
  
  // Bank of India
  'bankofindia.co.in': 'bankofindia.co.in',
  
  // Canara Bank
  'canarabank.com': 'canarabank.com',
  
  // Standard Chartered
  'sc.com': 'sc.com',
  
  // HSBC
  'hsbc.co.in': 'hsbc.co.in',
  'hsbc.com': 'hsbc.com',
}

export const getLogoUrl = (emailOrDomain: string | undefined) => {
  const publicKey = process.env.NEXT_PUBLIC_LOGO_DEV_KEY
  
  if (!emailOrDomain) {
    return `https://img.logo.dev/gmail.com?token=${publicKey}`
  }

  // Extract domain from email if present
  const domain = emailOrDomain.includes('@') ? emailOrDomain.split('@')[1] : emailOrDomain
  
  // Check mapping, otherwise use the cleaned domain
  const mappedDomain = DOMAIN_MAPPING[domain.toLowerCase()] || domain
  
  return `https://img.logo.dev/${mappedDomain}?token=${publicKey}`
}
