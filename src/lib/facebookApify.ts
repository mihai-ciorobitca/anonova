import {
  setData,
  setAction,
} from "../features/instagramData/instagramDataSlice";

export type TaskAction = "create" | "download" | "orderDetail";

export interface FacebookInput {
  taskSource?: string;
  taskType?: string;
  emailDomains?: string[];
  action?: TaskAction;
  maxLeads?: number;
  platform?: string;
  orderId?: string | number | null;
  proxyConfiguration?: {
    useApifyProxy: boolean;
  };
}

export const runFacebookExtraction = async (
  input: FacebookInput
): Promise<any> => {
  const {
    taskSource = "",
    taskType = "",
    emailDomains = [],
    maxLeads = null,
    action = "create",
    orderId = null,
    platform = "facebook",
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
      apiUrl = `/api/facebook/apify/orders/download/${orderId}`;
      break;
    case "orderDetail":
      if (!orderId) throw new Error("Order ID is required for order details");
      apiUrl = `/api/facebook/apify/orders/run/${orderId}`;
      break;
    default:
      // Default action is "create"
      apiUrl = `/api/facebook/apify/orders/create/?taskSource=${encodeURIComponent(
        taskSource || ""
      )}&taskType=${encodeURIComponent(
        taskType || ""
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
        "Authorization": "Bearer apify_api_Ld0KCy7mJtMt1nZbJsDuOjF2b8akAd1yd9ak",
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

    const responseText = await response.text(); // Read raw response
    // console.log("Facebook API Response:", responseText); // Log full response

    if (!response.ok) {
      throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${responseText}`);
    }

    const data = JSON.parse(responseText);

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
      console.error("Facebook extraction error:", error.message);

      // Handle specific error types
      if (error.message.includes("404")) {
        throw new Error(
          "API endpoint not found. Please check your configuration."
        );
      } else if (error.message.includes("Source is required")) {
        throw new Error("Please enter a valid target.");
      } 

      throw error;
    } else {
      console.error("Unknown Facebook extraction error:", error);
      throw new Error(
        "The extraction service is currently unavailable. Please try again later."
      );
    }
  }
};