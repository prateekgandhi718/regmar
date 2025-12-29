import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  email: string
  name?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
}

const getSafeUser = () => {
  if (typeof window === 'undefined') return null
  const user = localStorage.getItem('user')
  if (!user) return null
  try {
    return JSON.parse(user)
  } catch (error) {
    console.error('Error parsing user from localStorage', error)
    localStorage.removeItem('user')
    return null
  }
}

const initialState: AuthState = {
  user: getSafeUser(),
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
  refreshToken: typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, { payload: { user, accessToken, refreshToken } }: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>) => {
      state.user = user
      state.accessToken = accessToken
      state.refreshToken = refreshToken

      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
      }
    },
    updateAccessToken: (state, { payload: { accessToken, refreshToken } }: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = accessToken
      state.refreshToken = refreshToken
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
      }
    },
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null

      if (typeof window !== 'undefined') {
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
    },
  },
})

export const { setCredentials, updateAccessToken, logout } = authSlice.actions

export default authSlice.reducer

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user
export const selectCurrentToken = (state: { auth: AuthState }) => state.auth.accessToken
