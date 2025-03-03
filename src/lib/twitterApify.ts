import {
  setData,
  setAction,
} from "../features/instagramData/instagramDataSlice";

export type TaskAction = "create" | "download" | "orderDetail";

export interface TwitterInput {
  taskSource?: string;
  taskType?: string;
  emailDomains?: string[];
  action?: TaskAction;
  language?: string;
  country?: string;
  maxLeads?: number;
  platform?: string;
  orderId?: string | number | null;
  proxyConfiguration?: {
    useApifyProxy: boolean;
  };
}

export const runTwitterExtraction = async (
  input: TwitterInput
): Promise<any> => {
  const {
    taskSource = "",
    taskType = "email",
    emailDomains = [],
    maxLeads = 10,
    action = "create",
    orderId = null,
    language = "en",
    country = "us",
    platform = "twitter",
  } = input;

  // Validate inputs early
  if (action === "create") {
    if (!taskSource) throw new Error("Search keyword is required");
    if (emailDomains.length === 0) throw new Error("At least one email domain is required");
  }

  let apiUrl: string;

  switch (action) {
    case "download":
      if (!orderId) throw new Error("Order ID is required for download");
      apiUrl = `/api/twitter/apify/orders/download/${orderId}`;
      break;
    case "orderDetail":
      if (!orderId) throw new Error("Order ID is required for order details");
      apiUrl = `/api/twitter/apify/orders/run/${orderId}`;
      break;
    default:
      // Default action is "create"
      apiUrl = `/api/twitter/apify/orders/create/?taskSource=${encodeURIComponent(
        taskSource || ""
      )}&taskType=${encodeURIComponent(
        taskType || ""
      )}&language=${encodeURIComponent(language)}&country=${encodeURIComponent(
        country
      )}&maxLeads=${encodeURIComponent(
        String(maxLeads)
      )}&platform=${encodeURIComponent(platform)}`;
      break;
  }

  try {
    if (action === "create") {
      // Validate input
      if (!taskSource) {
        throw new Error("Source is required");
      }

      if (!taskType) {
        throw new Error("Source type is required");
      }

      if (!maxLeads || maxLeads < 10) {
        throw new Error("Please specify at least 10 leads to extract");
      }
    }

    // Start Creating Order
    console.log("Starting extraction with input:", input);

    const response = await fetch(apiUrl, {
      method: action === "create" ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer apify_api_tfh1ugK6JvsOYcGsEfcDEaZUPWCDQE4C7B4I",
      },
      body: action === "create" ? JSON.stringify({
        keyword: taskSource,
        emailDomains: Array.isArray(emailDomains)
          ? emailDomains.map((d: string) => d.replace("@", ""))
          : [],
        maxResults: maxLeads,
        proxyConfiguration: { useApifyProxy: true }
      }) : null
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to perform the requested action"
      );
    }

    const data = await response.json();

    if (action !== "download") {
      const resultData = data.data;

      if (action === "create" || action === "orderDetail") {
        setData(resultData);
      } else {
        setAction(JSON.stringify(resultData));
      }

      return resultData;
    } else {
      return data;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Twitter extraction error:", error.message);

      // Handle specific error types
      if (error.message.includes("404")) {
        throw new Error(
          "API endpoint not found. Please check your configuration."
        );
      } else if (error.message.includes("Source is required")) {
        throw new Error("Please enter a valid target.");
      } else if (error.message.includes("Source type is required")) {
        throw new Error("Please select a collection type (HT, FL, or FO).");
      }

      throw error;
    } else {
      console.error("Unknown Twitter extraction error:", error);
      throw new Error(
        "The extraction service is currently unavailable. Please try again later."
      );
    }
  }
};