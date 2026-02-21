import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './baseQuery'

export interface NerEntity {
  label: string
  start: number
  end: number
  text: string
}

export interface NerFeedbackPayload {
  transactionId?: string
  emailText: string

  modelEntities?: NerEntity[]
  correctedEntities: NerEntity[]

  nerModelVersion?: string
}

export const nerTrainingApi = createApi({
  reducerPath: 'nerTrainingApi',
  baseQuery: baseQueryWithReauth,

  endpoints: (builder) => ({
    saveNerFeedback: builder.mutation<void, NerFeedbackPayload>({
      query: (body) => ({
        url: '/ner-training/save-feedback',
        method: 'POST',
        body: body,
      }),
    }),
  }),
});

export const { useSaveNerFeedbackMutation } = nerTrainingApi;
