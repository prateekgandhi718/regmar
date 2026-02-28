import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './baseQuery'

export interface Domain {
  _id: string
  userId: string
  accountId: string
  fromEmail: string
  createdAt: string
  updatedAt: string
  __v: number
}

export interface Account {
  _id: string
  userId: string
  title: string
  currency: string
  accountNumber: string
  domainIds: Domain[]
  createdAt: string
  updatedAt: string
  __v: number
}

export interface EntityData {
  _id: string
  label: string
  start: number
  end: number
  text: string
}

export interface Transaction {
  _id: string

  accountId: Account
  domainId: Domain

  userId: string

  originalDate: string
  originalDescription: string
  originalAmount: number

  // ML classification
  type: 'credit' | 'debit'
  typeConfidence: number
  isTransactionConfidence?: number
  userType?: 'credit' | 'debit'
  nerModel: string
  entities: EntityData[]

  correctedEntities: EntityData[] | null

  refunded: boolean
  emailBody: string

  createdAt: string
  updatedAt: string

  // editable fields
  newDate?: string
  newDescription?: string
  newAmount?: number
  categoryId?: {
    _id: string
    name: string
    emoji: string
    color?: string
  }
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
