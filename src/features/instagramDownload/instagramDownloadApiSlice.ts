import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface DownloadLink {
  href: string;
  download: string;
}

export const instagramDownloadApiSlice = createApi({
  reducerPath: "instagramDownloadApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://src-marketing101.com/api/orders/download",
    prepareHeaders: (headers) => {
      headers.set("accept", "application/json");
      headers.set("X-API-Key", "db6667ea-e034-4edb-9ea3-fb0af39bdf3e");
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getOrderDownloadLinkById: builder.query<DownloadLink, number>({
      query: (id) => `/${id}`,
      transformResponse: (response: string) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(response, "text/html");
        const link = doc.querySelector("a");
        if (link) {
          return {
            href: link.getAttribute("href") || "",
            download: link.getAttribute("download") || "",
          };
        }
        throw new Error("Invalid response format");
      },
      providesTags: (result, error, id) => [{ type: "Instagram", id }],
    }),
  }),
  tagTypes: ["Instagram"],
});

export const { useGetOrderDownloadLinkByIdQuery } = instagramDownloadApiSlice;
