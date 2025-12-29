import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";
import { transactionsApi } from "./transactionsApi";

export const syncApi = createApi({
  reducerPath: "syncApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    syncTransactions: builder.mutation<{ message: string; transactionsSynced: number }, void>({
      query: () => ({
        url: "/sync",
        method: "POST",
      }),
      // Invalidate accounts and transactions to refresh UI
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Invalidate transactions to refresh UI
          dispatch(transactionsApi.util.invalidateTags(['Transaction']));
        } catch {}
      },
    }),
  }),
});

export const { useSyncTransactionsMutation } = syncApi;
