import {
  setData,
  setAction,
} from "../features/instagramData/instagramDataSlice";

export type TaskAction = "create" | "download" | "orderDetail" | "listOrders";

export interface AnonovaInput {
  taskSource?: string;
  taskType?: string;
  maxLeads?: number;
  action?: TaskAction;
  orderId?: string | number | null;
  page?: number;
}

export const runAnonovaExtraction = async (
  input: AnonovaInput
): Promise<any> => {
  const {
    taskSource = null,
    taskType = null,
    maxLeads = null,
    action = null,
    orderId = null,
    page = 1,
  } = input;

  let apiUrl: string;

  switch (action) {
    case "download":
      if (!orderId) throw new Error("Order ID is required for download");
      apiUrl = `/api/orders/${orderId}/download`;
      break;
    case "orderDetail":
      if (!orderId) throw new Error("Order ID is required for order details");
      apiUrl = `/api/orders/${orderId}`;
      break;
    case "listOrders":
      apiUrl = `/api/orders/list/?page=${page}`;
      break;
    default:
      // Default action is "create"
      apiUrl = `/api/orders/create/?taskSource=${encodeURIComponent(
        taskSource
      )}&taskType=${encodeURIComponent(taskType)}&maxLeads=${encodeURIComponent(
        String(maxLeads)
      )}`;
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

      if (!maxLeads || maxLeads < 100) {
        throw new Error("Please specify at least 100 leads to extract");
      }
    }

    // Start Creating Order
    console.log("Starting extraction with input:", input);

    const response = await fetch(apiUrl, {
      method: action === "create" ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": "db6667ea-e034-4edb-9ea3-fb0af39bdf3e",
      },
      body: action === "create" ? JSON.stringify(input) : null,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to perform the requested action"
      );
    }

    const data = await response.json();

    if (action === "create" || action === "orderDetail") {
      setData(data);
    } else {
      setAction(JSON.stringify(data));
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Anonova extraction error:", error.message);

      // Handle specific error types
      if (error.message.includes("404")) {
        throw new Error(
          "API endpoint not found. Please check your configuration."
        );
      } else if (error.message.includes("Source is required")) {
        throw new Error("Please enter a valid target.");
      } else if (error.message.includes("Source type is required")) {
        throw new Error("Please select a collection type (HT, FL, or FO).");
      } else if (error.message.includes("specify at least 100")) {
        throw new Error(error.message);
      }

      throw error;
    } else {
      console.error("Unknown Anonova extraction error:", error);
      throw new Error(
        "The extraction service is currently unavailable. Please try again later."
      );
    }
  }
};
