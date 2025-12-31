import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './baseQuery'
import { transactionsApi } from './transactionsApi'
import { investmentsApi } from './investmentsApi'

export const syncApi = createApi({
  reducerPath: 'syncApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    syncTransactions: builder.mutation<{ message: string; transactionsSynced: number }, void>({
      query: () => ({
        url: '/sync',
        method: 'POST',
      }),
      // Invalidate accounts and transactions to refresh UI
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          // Invalidate transactions to refresh UI
          dispatch(transactionsApi.util.invalidateTags(['Transaction']))
        } catch {}
      },
    }),
    syncInvestments: builder.mutation<{ message: string; lastSyncedAt: string; alreadySynced?: boolean }, void>({
      query: () => ({
        url: '/sync/investments',
        method: 'POST',
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          // Invalidate investments to refresh UI
          dispatch(investmentsApi.util.invalidateTags(['Investment']))
        } catch {}
      },
    }),
  }),
})

export const { useSyncTransactionsMutation, useSyncInvestmentsMutation } = syncApi
