import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './baseQuery'

export interface Transaction {
  _id: string
  accountId: {
    _id: string
    title: string
    accountNumber: string
    icon?: string
    domainIds: {
      _id: string
      fromEmail: string
    }[]
  }
  userId: string
  originalDate: string
  newDate?: string
  originalDescription: string
  newDescription?: string
  originalAmount: number
  newAmount?: number
  type: 'credit' | 'debit'
  refunded: boolean
  categoryId?: {
    _id: string
    name: string
    emoji: string
    color?: string
  }
  createdAt: string
  updatedAt: string
}

export const transactionsApi = createApi({
  reducerPath: 'transactionsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Transaction'],
  endpoints: (builder) => ({
    getTransactions: builder.query<Transaction[], void>({
      query: () => '/transactions',
      providesTags: ['Transaction'],
    }),
    updateTransaction: builder.mutation<Transaction, { id: string; [key: string]: string | number | boolean | undefined | null }>({
      query: ({ id, ...body }) => ({
        url: `/transactions/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Transaction'],
    }),
    deleteTransaction: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/transactions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Transaction'],
    }),
  }),
})

export const { useGetTransactionsQuery, useUpdateTransactionMutation, useDeleteTransactionMutation } = transactionsApi
