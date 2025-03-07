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

const API_BASE = "/api/apify";

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
      const error = await response.json();
      throw new Error(error.error || "Failed to start extraction");
    }

    const runData = await response.json();

    if (!runData.data?.id) {
      throw new Error("No run ID returned from Apify");
    }

    const runId = runData.data.id;
    console.log("Extraction started with run ID:", runId);

    // Poll for completion
    let isComplete = false;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let lastStatus = "";

    while (!isComplete && attempts < maxAttempts) {
      console.log(
        `Checking status (attempt ${attempts + 1}/${maxAttempts})...`
      );
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds

      const statusResponse = await fetch(`${API_BASE}/run/${runId}`);
      if (!statusResponse.ok) {
        const error = await statusResponse.json();
        throw new Error(error.error || "Failed to check status");
      }

      const statusData = await statusResponse.json();

      const status = statusData.data?.status;
      lastStatus = status;

      if (status === "FAILED") {
        console.error("Extraction failed:", statusData.data?.errorMessage);
        throw new Error(statusData.data?.errorMessage || "Extraction failed");
      }

      if (status === "SUCCEEDED") {
        console.log("Extraction completed successfully");
        isComplete = true;

        // Dataset is now included in the status response
        if (!Array.isArray(statusData.data?.dataset)) {
          console.error("Invalid dataset format:", statusData.data?.dataset);
          throw new Error("Invalid dataset format received from server");
        }

        // Transform the data to match our interface
        const transformedData: ExtractedData[] = statusData.data.dataset.map(
          (item) => ({
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
          })
        );

        console.log(`Successfully extracted ${transformedData.length} records`);
        return transformedData;
      } else if (
        status === "RUNNING" ||
        status === "READY" ||
        status === "CREATED"
      ) {
        console.log(`Extraction status: ${status}`);
        // Continue polling
      } else {
        console.error("Unexpected status:", status);
        throw new Error(`Unexpected status: ${status}`);
      }

      attempts++;
    }

    if (!isComplete) {
      console.error(
        "Extraction timed out after",
        maxAttempts,
        "attempts. Last status:",
        lastStatus
      );
      throw new Error(`Extraction timed out. Last status: ${lastStatus}`);
    }

    throw new Error("Extraction failed to complete");
  } catch (error) {
    if (error instanceof Error) {
      console.error("Extraction error:", error.message);
      // Check for specific error types
      if (error.message.includes("404")) {
        throw new Error(
          "API endpoint not found. Please check your configuration."
        );
      }
      throw error;
    } else {
      console.error("Unknown extraction error:", error);
      throw new Error(
        "An unexpected error occurred during extraction. Please try again."
      );
    }
  }
};
