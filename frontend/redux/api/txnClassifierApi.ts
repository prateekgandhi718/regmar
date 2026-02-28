import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './baseQuery'
import { transactionsApi } from './transactionsApi'

export interface TxnClassifierFeedbackPayload {
  transactionId?: string
  emailText: string
  sourceDomain?: string
  isTransaction: boolean
  txnType?: 'credit' | 'debit'
  modelConfidence?: number
  typeConfidence?: number
  classifierModelVersion?: string
  typeModelVersion?: string
}

export const txnClassifierApi = createApi({
  reducerPath: 'txnClassifierApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    saveTxnClassifierFeedback: builder.mutation<any, TxnClassifierFeedbackPayload>({
      query: (body) => ({
        url: '/txn-classifier/feedback',
        method: 'POST',
        body,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          if (arg.isTransaction === false && arg.transactionId) {
            dispatch(
              transactionsApi.util.updateQueryData(
                'getTransactions',
                undefined,
                (draft) => draft.filter((t) => t._id !== arg.transactionId),
              ),
            )
          }
          if (arg.isTransaction === true && arg.transactionId && arg.txnType) {
            dispatch(
              transactionsApi.util.updateQueryData(
                'getTransactions',
                undefined,
                (draft) => {
                  const txn = draft.find((t) => t._id === arg.transactionId)
                  if (txn) txn.userType = arg.txnType
                },
              ),
            )
          }
        } catch {
          // no-op
        }
      },
    }),
  }),
})

export const { useSaveTxnClassifierFeedbackMutation } = txnClassifierApi
