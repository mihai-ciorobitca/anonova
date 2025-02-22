import express from "express";
import cors from "cors";

const app = express();

// Enable CORS for all routes
app.use(
  cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Add CORS preflight
app.options("*", cors());

app.use(express.json());

const APIFY_TOKEN = "apify_api_QlSIvabctBUdF8IPFQDT8sC3w6soCU3Lw7Uj";
const ACTOR_ID = "Oliuhvq8My0EiVIT0";
const APIFY_API_BASE = "https://api.apify.com/v2";

// Proxy endpoint for Apify API
app.post("/api/apify/run", async (req, res) => {
  try {
    console.log("Received request to start extraction:", req.body);

    const response = await fetch(`${APIFY_API_BASE}/acts/${ACTOR_ID}/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${APIFY_TOKEN}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    console.log("Apify response:", data);

    res.status(response.status).json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Proxy request failed" });
  }
});

// Proxy endpoint for getting run status
app.get("/api/apify/run/:runId", async (req, res) => {
  try {
    console.log("Checking run status:", req.params.runId);

    const response = await fetch(
      `${APIFY_API_BASE}/acts/${ACTOR_ID}/runs/${req.params.runId}`,
      {
        headers: {
          Authorization: `Bearer ${APIFY_TOKEN}`,
        },
      }
    );

    const data = await response.json();
    console.log("Status response:", data);

    res.status(response.status).json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Proxy request failed" });
  }
});

// Proxy endpoint for getting dataset items
app.get("/api/apify/run/:runId/", async (req, res) => {
  try {
    console.log("Fetching dataset for run:", req.params.runId);

    const response = await fetch(
      `${APIFY_API_BASE}/acts/${ACTOR_ID}/runs/${req.params.runId}/`,
      {
        headers: {
          Authorization: `Bearer ${APIFY_TOKEN}`,
        },
      }
    );

    const data = await response.json();
    console.log("Dataset response:", data);

    res.status(response.status).json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Proxy request failed" });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API proxy server running on http://localhost:${PORT}`);
  console.log("CORS enabled for all origins");
});
