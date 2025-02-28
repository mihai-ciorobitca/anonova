import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface Instagram {
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

export const instagramApiSlice = createApi({
  reducerPath: "instagramApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://src-marketing101.com/api/orders",
    prepareHeaders: (headers) => {
      headers.set("accept", "application/json");
      headers.set("X-API-Key", "db6667ea-e034-4edb-9ea3-fb0af39bdf3e");
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getOrderById: builder.query<Instagram, number>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "Instagram", id }],
    }),
  }),
  tagTypes: ["Instagram"],
});

export const { useGetOrderByIdQuery } = instagramApiSlice;
