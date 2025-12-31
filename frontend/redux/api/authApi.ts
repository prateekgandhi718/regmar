import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from './baseQuery'

export interface User {
  id: string
  email: string
  name?: string
  pan?: string
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getMe: builder.query<User, void>({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation<User, { name?: string; pan?: string }>({
      query: (body) => ({
        url: '/users/profile',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    requestOtp: builder.mutation<{ message: string }, { email: string; mode: 'login' | 'signup' }>({
      query: (credentials) => ({
        url: '/auth/request-otp',
        method: 'POST',
        body: credentials,
      }),
    }),
    verifyOtp: builder.mutation<{ accessToken: string; refreshToken: string; user: User }, { email: string; otp: string; name?: string }>({
      query: (credentials) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body: credentials,
      }),
    }),
  }),
})

export const { 
  useRequestOtpMutation, 
  useVerifyOtpMutation, 
  useGetMeQuery, 
  useUpdateProfileMutation 
} = authApi
