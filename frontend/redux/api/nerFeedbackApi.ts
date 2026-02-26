import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './baseQuery'
import { EntityData, transactionsApi } from './transactionsApi'

export interface NerEntity {
  label: string
  start: number
  end: number
  text: string
  _id?: string
}

export interface NerFeedbackPayload {
  transactionId?: string
  emailText: string

  modelEntities?: NerEntity[]
  correctedEntities: NerEntity[]

  nerModelVersion?: string
}

export interface NerFeedbackResponse {
  _id: string
  transactionId: string
  userId: string
  emailText: string
  modelEntities: NerEntity[]
  correctedEntities: NerEntity[]
  reviewed: boolean
  source: string
  usedForTraining: boolean
  trainedAt: string | null
  createdAt: string
  updatedAt: string
}

export const nerTrainingApi = createApi({
  reducerPath: 'nerTrainingApi',
  baseQuery: baseQueryWithReauth,

  endpoints: (builder) => ({
    saveNerFeedback: builder.mutation<NerFeedbackResponse, NerFeedbackPayload>({
      query: (body) => ({
        url: '/ner-training/save-feedback',
        method: 'POST',
        body: body,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data: feedbackResponse } = await queryFulfilled;

          // Perform a manual update on the 'getTransactions' cache
          dispatch(
            transactionsApi.util.updateQueryData(
              'getTransactions', 
              undefined, // This matches the argument of your useGetTransactionsQuery()
              (draft) => {
                const transaction = draft.find(
                  (t) => t._id === feedbackResponse.transactionId
                );

                if (transaction) {
                  transaction.correctedEntities = feedbackResponse.correctedEntities as EntityData[];
                }
              }
            )
          );
        } catch {
          // If the mutation fails, we don't update the cache
        }
      },
    }),
  }),
});

export const { useSaveNerFeedbackMutation } = nerTrainingApi;
