import type { PayloadAction } from "@reduxjs/toolkit";
import { createAppSlice } from "../../app/createAppSlice";

export interface InstagramData {
  source_type: string;
  status_display: string;
  id: number;
  source: string;
  max_leads: number;
  scraped_leads: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InstagramDataSliceState {
  value: InstagramData | null;
  status: "idle" | "loading" | "failed";
  action: string | null;
}

const initialState: InstagramDataSliceState = {
  value: null,
  status: "idle",
  action: null,
};

export const instagramDataSlice = createAppSlice({
  name: "instagramData",
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<InstagramData>) => {
      state.value = action.payload;
    },
    setStatus: (
      state,
      action: PayloadAction<"idle" | "loading" | "failed">
    ) => {
      state.status = action.payload;
    },
    setAction: (state, action: PayloadAction<string>) => {
      state.action = action.payload;
    },
  },
  selectors: {
    selectData: (instagramData) => instagramData.value,
    selectStatus: (instagramData) => instagramData.status,
    selectAction: (instagramData) => instagramData.action,
  },
});

export const { setData, setAction, setStatus } = instagramDataSlice.actions;

// Selectors returned by `slice.selectors` take the root state as their first argument.
export const { selectData, selectStatus, selectAction } =
  instagramDataSlice.selectors;
