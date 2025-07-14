import { configureStore } from "@reduxjs/toolkit"
import productReducer from "./slices/productSlice"
import orderReducer from "./slices/orderSlice"
import adminReducer from "./slices/adminSlice"
import uiReducer from "./slices/uiSlice"

export const store = configureStore({
  reducer: {
    products: productReducer,
    order: orderReducer,
    admin: adminReducer,
    ui: uiReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
