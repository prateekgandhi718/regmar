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
  amc: string
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
  ticker: string
  isin: string
  isEtf: boolean
  currentBalance: number
  frozenBalance: number
  pledgeBalance: number
  freeBalance: number
  marketPrice: number
  currentValue: number
  currentPercentage: number
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

export interface OptimizedAllocations {
  [ticker: string]: number // percentage (0–100)
}

export interface OptimizationMetrics {
  expectedAnnualReturn: number
  annualVolatility: number
  sharpeRatio: number
}

export interface UltimatePortfolioOptimizationResponse {
  allocations: OptimizedAllocations
  metrics: OptimizationMetrics
}

export interface OptimizePortfolioRequest {
  tickers: string[]
  period?: string
  riskFreeRate?: number
}

export const investmentsApi = createApi({
  reducerPath: 'investmentsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Investment', 'Optimization'],
  endpoints: (builder) => ({
    getMyInvestments: builder.query<InvestmentData | null, void>({
      query: () => '/investments/me',
      providesTags: ['Investment'],
    }),

    optimizeUltimatePortfolio: builder.mutation<UltimatePortfolioOptimizationResponse, OptimizePortfolioRequest>({
      query: (body) => ({
        url: '/optimize/ultimate-portfolio',
        method: 'POST',
        // 1. Transform Request: Add .NS to tickers before sending to server
        body: {
          ...body,
          tickers: body.tickers.map((ticker) => `${ticker}.NS`),
        },
      }),
      // 2. Transform Response: Strip .NS from keys before saving to store
      transformResponse: (response: UltimatePortfolioOptimizationResponse) => {
        const cleanAllocations: OptimizedAllocations = {}

        Object.entries(response.allocations).forEach(([key, value]) => {
          const cleanTicker = key.replace('.NS', '')
          cleanAllocations[cleanTicker] = value
        })

        return {
          ...response,
          allocations: cleanAllocations,
        }
      },
    }),
  }),
})

export const { useGetMyInvestmentsQuery, useOptimizeUltimatePortfolioMutation } = investmentsApi
