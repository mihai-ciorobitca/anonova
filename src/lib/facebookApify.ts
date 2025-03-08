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
  minDelay?: number;
  maxDelay?: number;
  facebookScrapeType?: string;
  facebookScrapeValue?: string;
  proxyConfiguration?: {
    useApifyProxy: boolean;
  };
}

// Multiple Scraper
export const runFacebookMultiple = async (
  input: FacebookInput
): Promise<any> => {
  const {
    facebookScrapeType = "",
    facebookScrapeValue = "",
    taskType = "",
    minDelay = 1, // Default minimum delay
    maxDelay = 7, // Default maximum delay
    action = "create",
    orderId = null,
    platform = "facebook",
  } = input;

  // Validate inputs early
  if (action === "create") {
    if (!facebookScrapeValue) throw new Error("Search URL is required");
    if (facebookScrapeValue.length === 0) throw new Error("At least one URL is required");
  }

  let apiUrl: string;
  let requestBody: any;

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
        facebookScrapeValue || ""
      )}&taskType=${encodeURIComponent(
        taskType || ""
      )}&platform=${encodeURIComponent(platform)}`;

      // Dynamically construct the request body based on scrape type
      requestBody = {
        action: facebookScrapeType,
        minDelay,
        maxDelay,
        proxy: {
          useApifyProxy: true,
          apifyProxyGroups: ["RESIDENTIAL"],
          apifyProxyCountry: "US",
        },
      };

      // Assign the correct input field for the selected facebookScrapeType
      switch (facebookScrapeType) {
        case "scrapeProfiles":
          requestBody["scrapeProfiles.profileUrls"] = [facebookScrapeValue];
          break;
        case "scrapePeopleSearch":
          requestBody["scrapePeopleSearch.searchUrl"] = facebookScrapeValue;
          break;
        case "scrapeGroupMembers":
          requestBody["scrapeGroupMembers.groupUrl"] = facebookScrapeValue;
          break;
        case "scrapePosts":
          requestBody["scrapePosts.groupUrl"] = facebookScrapeValue;
          break;
        case "scrapeComments":
          requestBody["scrapeComments.postUrl"] = facebookScrapeValue;
          break;
        default:
          throw new Error("Invalid scrape type");
      }
      break;
  }

  try {
    if (action === "create") {
      console.log("Starting extraction with input:", input);
    }

    const response = await fetch(apiUrl, {
      method: action === "create" ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer apify_api_Q2SPHdCfgTUswvlR8JFtdnNwuanfKV3yHUIU",
      },
      body: action === "create" ? JSON.stringify(requestBody) : null,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to perform the requested action");
    }

    const data = await response.json(); // Read response correctly

    if (!data || !data.data) {
      throw new Error("No data returned from Facebook extraction.");
    }

    return data.data;
  } catch (error) {
    console.error("Facebook extraction error:", error?.message || error);

    throw new Error("The extraction service is currently unavailable. Please try again later.");
  }
};


// Basic Parameters
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
        "Authorization": "Bearer apify_api_Q2SPHdCfgTUswvlR8JFtdnNwuanfKV3yHUIU",
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