import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export interface LinkedAccount {
  id: string;
  email: string;
  provider: string;
  isActive: boolean;
}

export const linkedAccountsApi = createApi({
  reducerPath: "linkedAccountsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["LinkedAccount"],
  endpoints: (builder) => ({
    getLinkedAccounts: builder.query<LinkedAccount[], void>({
      query: () => "/linked-accounts",
      providesTags: ["LinkedAccount"],
    }),
    linkGmailAccount: builder.mutation<LinkedAccount, { email: string; appPassword: string }>({
      query: (body) => ({
        url: "/linked-accounts/gmail",
        method: "POST",
        body,
      }),
      invalidatesTags: ["LinkedAccount"],
    }),
    unlinkAccount: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/linked-accounts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["LinkedAccount"],
    }),
  }),
});

export const {
  useGetLinkedAccountsQuery,
  useLinkGmailAccountMutation,
  useUnlinkAccountMutation,
} = linkedAccountsApi;

