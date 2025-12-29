import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export interface Transaction {
  _id: string;
  accountId: {
    _id: string;
    title: string;
    icon?: string;
  };
  userId: string;
  date: string;
  description: string;
  originalAmount: number;
  newAmount?: number;
  type: 'credit' | 'debit';
  refunded: boolean;
  categoryId?: {
    _id: string;
    name: string;
    emoji: string;
    color?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const transactionsApi = createApi({
  reducerPath: "transactionsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Transaction"],
  endpoints: (builder) => ({
    getTransactions: builder.query<Transaction[], void>({
      query: () => "/transactions",
      providesTags: ["Transaction"],
    }),
    tagTransaction: builder.mutation<Transaction, { id: string; categoryId: string }>({
      query: ({ id, categoryId }) => ({
        url: `/transactions/${id}/tag`,
        method: "PATCH",
        body: { categoryId },
      }),
      invalidatesTags: ["Transaction"],
    }),
  }),
});

export const { useGetTransactionsQuery, useTagTransactionMutation } = transactionsApi;

