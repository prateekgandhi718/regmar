import { configureStore, createSlice } from '@reduxjs/toolkit'

// Create a dummy slice to avoid empty reducer error
const dummySlice = createSlice({
  name: 'dummy',
  initialState: {},
  reducers: {},
})

export const store = configureStore({
  reducer: {
    dummy: dummySlice.reducer,
    // Add your real reducers here as you build features
  },
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({}),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
