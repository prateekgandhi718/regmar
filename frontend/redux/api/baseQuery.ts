import { fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { RootState } from '../store'
import { logout, updateAccessToken } from '../features/authSlice'

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result.error && result.error.status === 401) {
    // try to get a new token
    const refreshToken = (api.getState() as RootState).auth.refreshToken

    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh-token',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions,
      )

      if (refreshResult.data) {
        const { accessToken, refreshToken: newRefreshToken } = refreshResult.data as { accessToken: string; refreshToken: string }
        api.dispatch(updateAccessToken({ accessToken, refreshToken: newRefreshToken }))

        // retry the initial query
        result = await baseQuery(args, api, extraOptions)
      } else {
        api.dispatch(logout())
      }
    } else {
      api.dispatch(logout())
    }
  }

  return result
}
