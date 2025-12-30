import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './baseQuery'

export interface Domain {
  _id: string
  userId: string
  accountId: string
  fromEmail: string
  subject?: string
  regexIds: string[]
}

export interface Account {
  _id: string
  userId: string
  title: string
  icon?: string
  currency: string
  accountNumber?: string
  domainIds: Domain[] // Populated in backend
  createdAt: string
  updatedAt: string
}

export const accountsApi = createApi({
  reducerPath: 'accountsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Account'],
  endpoints: (builder) => ({
    getAccounts: builder.query<Account[], void>({
      query: () => '/accounts',
      providesTags: ['Account'],
    }),
    addAccount: builder.mutation<Account, Partial<Account & { domainNames: string[] }>>({
      query: (body) => ({
        url: '/accounts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Account'],
    }),
    updateAccount: builder.mutation<Account, { id: string } & Partial<Account & { domainNames: string[] }>>({
      query: ({ id, ...body }) => ({
        url: `/accounts/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Account'],
    }),
    deleteAccount: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/accounts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Account'],
    }),
  }),
})

export const { useGetAccountsQuery, useAddAccountMutation, useUpdateAccountMutation, useDeleteAccountMutation } = accountsApi
