import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './baseQuery'

export interface Category {
  _id: string
  name: string
  emoji: string
  color?: string
}

export const categoriesApi = createApi({
  reducerPath: 'categoriesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Category'],
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], void>({
      query: () => '/master/categories',
      providesTags: ['Category'],
    }),
  }),
})

export const { useGetCategoriesQuery } = categoriesApi
