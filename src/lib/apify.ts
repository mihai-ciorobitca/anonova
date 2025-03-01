export interface ApifyInput {
  keyword: string;
  language?: string;
  country?: string;
  maxLeads?: number;
  proxyConfiguration?: {
    useApifyProxy: boolean;
  };
}

export interface ApifyExtractedData {
  lead: string;
  username?: string;
  userLink: string;
  emails: string[];
  phones: string[];
  summary?: string;
}

interface ApiResponse<T> {
  data: T;
  error?: {
    type?: string;
    message?: string;
  };
}

interface RunData {
  id: string;
}

interface StatusData {
  status: string;
  dataset?: any[];
  errorMessage?: string;
}

const API_BASE = "/api/apify";
const MAX_ATTEMPTS = 30;
const POLL_INTERVAL = 10000; // 10 seconds

export const runApifyExtraction = async (
  input: ApifyInput
): Promise<ApifyExtractedData[]> => {
  try {
    // Validate input
    if (!input.keyword) {
      throw new Error("Keyword is required");
    }

    // Start the Actor run
    console.log("Starting extraction with input:", input);
    const response = await fetch(`${API_BASE}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorResponse: ApiResponse<null> = await response.json();

      // Handle specific Apify errors
      if (errorResponse.error?.type === "actor-is-not-rented") {
        throw new Error(
          "Service temporarily unavailable. Please try again later or contact support."
        );
      }

      throw new Error(
        errorResponse.error?.message || "Failed to start extraction"
      );
    }

    const runData: ApiResponse<RunData> = await response.json();

    if (!runData.data?.id) {
      throw new Error("No run ID returned from Apify");
    }

    const runId = runData.data.id;
    console.log("Extraction started with run ID:", runId);

    // Poll for completion
    let isComplete = false;
    let attempts = 0;
    let lastStatus = "";

    while (!isComplete && attempts < MAX_ATTEMPTS) {
      console.log(
        `Checking status (attempt ${attempts + 1}/${MAX_ATTEMPTS})...`
      );
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL)); // Wait 10 seconds

      const statusResponse = await fetch(`${API_BASE}/run/${runId}`);
      if (!statusResponse.ok) {
        const errorResponse: ApiResponse<null> = await statusResponse.json();
        throw new Error(
          errorResponse.error?.message || "Failed to check status"
        );
      }

      const statusData: ApiResponse<StatusData> = await statusResponse.json();

      const status = statusData.data?.status;
      lastStatus = status;

      if (status === "FAILED") {
        console.error("Extraction failed:", statusData.data?.errorMessage);
        throw new Error(statusData.data?.errorMessage || "Extraction failed");
      }

      if (status === "SUCCEEDED") {
        console.log("Extraction completed successfully");
        isComplete = true;

        if (!Array.isArray(statusData.data?.dataset)) {
          console.error("Invalid dataset format:", statusData.data?.dataset);
          throw new Error("Invalid dataset format received from server");
        }

        const transformedData: ApifyExtractedData[] =
          statusData.data.dataset.map((item) => ({
            lead: item.lead || "",
            username: item.username || "",
            userLink: item.userLink || "",
            emails: Array.isArray(item.emails)
              ? item.emails
              : [item.emails].filter(Boolean),
            phones: Array.isArray(item.phones)
              ? item.phones
              : [item.phones].filter(Boolean),
            summary: item.summary || undefined,
          }));

        console.log(`Successfully extracted ${transformedData.length} records`);
        return transformedData;
      } else if (
        status === "RUNNING" ||
        status === "READY" ||
        status === "CREATED"
      ) {
        console.log(`Extraction status: ${status}`);
      } else {
        console.error("Unexpected status:", status);
        throw new Error(`Unexpected status: ${status}`);
      }

      attempts++;
    }

    if (!isComplete) {
      console.error(
        "Extraction timed out after",
        MAX_ATTEMPTS,
        "attempts. Last status:",
        lastStatus
      );
      throw new Error(`Extraction timed out. Last status: ${lastStatus}`);
    }

    throw new Error("Extraction failed to complete");
  } catch (error) {
    if (error instanceof Error) {
      console.error("Extraction error:", error);
      if (error.message.includes("404")) {
        throw new Error(
          "API endpoint not found. Please check your configuration."
        );
      }
      // Return a user-friendly error message
      if (error.message.includes("Service temporarily unavailable")) {
        throw error;
      }
      throw error;
    } else {
      console.error("Unknown extraction error:", error);
      throw new Error(
        "The extraction service is currently unavailable. Please try again later."
      );
    }
  }
};
