import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './baseQuery'

export interface InvestmentSummary {
  totalValue: number
  equityValue: number
  mfFolioValue: number
  mfDematValue: number
}

export interface HistoricalValuation {
  _id: string
  monthYear: string
  value: number
  changeValue: number
  changePercentage: number
}

export interface MutualFund {
  _id: string
  name: string
  isin: string
  folio: string
  type: 'Regular' | 'Direct'
  units: number
  nav: number
  investedValue: number
  currentValue: number
  unrealizedPnL: number
  unrealizedPnLPercentage: number
}

export interface Stock {
  _id: string
  name: string
  isin: string
  currentBalance: number
  frozenBalance: number
  pledgeBalance: number
  freeBalance: number
  marketPrice: number
  currentValue: number
}

export interface InvestmentData {
  _id: string
  userId: string
  pan: string
  lastSyncedAt: string
  casId: string
  statementPeriod: string
  summary: InvestmentSummary
  historicalValuation: HistoricalValuation[]
  mutualFunds: MutualFund[]
  stocks: Stock[]
  createdAt: string
  updatedAt: string
}

export const investmentsApi = createApi({
  reducerPath: 'investmentsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Investment'],
  endpoints: (builder) => ({
    getMyInvestments: builder.query<InvestmentData | null, void>({
      query: () => '/investments/me',
      providesTags: ['Investment'],
    }),
  }),
})

export const { useGetMyInvestmentsQuery } = investmentsApi
