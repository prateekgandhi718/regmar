import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { authApi } from './api/authApi'
import { accountsApi } from './api/accountsApi'
import { linkedAccountsApi } from './api/linkedAccountsApi'
import { syncApi } from './api/syncApi'
import { transactionsApi } from './api/transactionsApi'
import { categoriesApi } from './api/categoriesApi'
import { investmentsApi } from './api/investmentsApi'
import { nerTrainingApi } from './api/nerFeedbackApi'
import { txnClassifierApi } from './api/txnClassifierApi'
import authReducer from './features/authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [accountsApi.reducerPath]: accountsApi.reducer,
    [linkedAccountsApi.reducerPath]: linkedAccountsApi.reducer,
    [syncApi.reducerPath]: syncApi.reducer,
    [transactionsApi.reducerPath]: transactionsApi.reducer,
    [categoriesApi.reducerPath]: categoriesApi.reducer,
    [investmentsApi.reducerPath]: investmentsApi.reducer,
    [nerTrainingApi.reducerPath]: nerTrainingApi.reducer,
    [txnClassifierApi.reducerPath]: txnClassifierApi.reducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware, 
      accountsApi.middleware, 
      linkedAccountsApi.middleware, 
      syncApi.middleware, 
      transactionsApi.middleware, 
      categoriesApi.middleware,
      investmentsApi.middleware,
      nerTrainingApi.middleware,
      txnClassifierApi.middleware,
    ),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
