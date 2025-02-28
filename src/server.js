import express from 'express';
import cors from 'cors';

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const app = express();

const PORT = 3000;

// Enable CORS for all routes
app.use(cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add CORS preflight
app.options('*', cors());

app.use(express.json());

// APIFY
const APIFY_TOKEN = 'apify_api_T7QbfS4QT59lCgRsbtaYX1OwDx4mWo4n6oLU';
const APIFY_API_BASE = 'https://api.apify.com/v2';

// LINKEDIN
const LINKEDIN_ACTOR_ID = 'Oliuhvq8My0EiVIT0';

// ANONOVA
const ANONOVA_API_KEY = 'db6667ea-e034-4edb-9ea3-fb0af39bdf3e';
const ANONOVA_API_BASE = 'https://src-marketing101.com/api/orders';

// TWITTER
const TWITTER_ACTOR_ID = 'dqJrJj2vnv8K7XMNK'; // Twitter scraper actor ID

// Proxy endpoint for Apify API
app.post('/api/apify/run', async (req, res) => {
    const platform = req.query.platform || 'linkedin';
    const actorId = platform === 'twitter' ? TWITTER_ACTOR_ID : LINKEDIN_ACTOR_ID;

    try {
        console.log('Received request to start extraction:', req.body);

        const response = await fetch(`${APIFY_API_BASE}/acts/${actorId}/runs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${APIFY_TOKEN}`,
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();
        console.log('Apify response:', data);

        res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy request failed' });
    }
});

// Proxy endpoint for getting run status
app.get('/api/apify/run/:runId', async (req, res) => {
    try {
        console.log('Checking run status:', req.params.runId);

        const platform = req.query.platform || 'linkedin';
        const actorId = platform === 'twitter' ? TWITTER_ACTOR_ID : LINKEDIN_ACTOR_ID;

        const runResponse = await fetch(`${APIFY_API_BASE}/acts/${actorId}/runs/${req.params.runId}`, {
            headers: {
                'Authorization': `Bearer ${APIFY_TOKEN}`,
            },
        });

        if (!runResponse.ok) {
            throw new Error(`Failed to fetch run status: ${runResponse.status} ${runResponse.statusText}`);
        }

        const runData = await runResponse.json();
        console.log('Status response:', runData);

        // If run is successful, include the dataset ID in the response
        if (runData.data?.status === 'SUCCEEDED' && runData.data?.defaultDatasetId) {
            // Fetch dataset items
            const datasetResponse = await fetch(
                `${APIFY_API_BASE}/datasets/${runData.data.defaultDatasetId}/items?clean=true&format=json&limit=1000&view=overview`,
                {
                    headers: {
                        'Authorization': `Bearer ${APIFY_TOKEN}`,
                    },
                }
            );

            if (!datasetResponse.ok) {
                throw new Error(`Failed to fetch dataset: ${datasetResponse.status} ${datasetResponse.statusText}`);
            }

            const datasetData = await datasetResponse.json();

            // Validate dataset is an array
            if (!Array.isArray(datasetData)) {
                throw new Error('Invalid dataset format: expected array');
            }

            // Return both run status and dataset data
            res.status(200).json({
                data: {
                    ...runData.data,
                    dataset: datasetData
                }
            });
        } else {
            // Return just the run status if not succeeded
            res.status(200).json(runData);
        }
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: error.message || 'Proxy request failed' });
    }
});

// Proxy endpoint for Anonova API
app.post('/api/orders/create', async (req, res) => {
    try {
        const source = req.query.taskSource;
        const sourceType = req.query.taskType || 'FL';
        const maxLeads = req.query.maxLeads || 10;

        if (!source) {
            return res.status(400).json({ error: 'Source is required' });
        }

        const response = await fetch(`${ANONOVA_API_BASE}/create/?source=${encodeURIComponent(source)}&source_type=${encodeURIComponent(sourceType)}&max_leads=${encodeURIComponent(String(maxLeads))}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': ANONOVA_API_KEY,
            },
            body: JSON.stringify(req.body),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create order');
        }

        const data = await response.json();
        console.log(`This is the response from Anonova: ${data.id}`);
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: error.message || 'Proxy request failed' });
    }
});

app.get('/api/orders/:order_id/download', async (req, res) => {
    try {
        const orderId = req.params.order_id;
        const apiUrl = `${ANONOVA_API_BASE}/${orderId}/download`;

        // Fetch CSV from external API
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'X-API-Key': ANONOVA_API_KEY,
                'accept': '*/*'
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch order: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();

        // Generate a random filename (UUID-like)
        const blobName = crypto.randomUUID(); // Generates a unique ID
        const filename = `${blobName}.csv`; // Example: "3f81d5c0-9b32-41ad-940b-b7612f71f013.csv"

        // Define the public folder path
        const PUBLIC_FOLDER = path.join(process.cwd(), 'downloads');

        // Ensure the public folder exists
        if (!fs.existsSync(PUBLIC_FOLDER)) {
            fs.mkdirSync(PUBLIC_FOLDER);
        }

        // Write CSV text to a file
        const filePath = path.join(PUBLIC_FOLDER, filename);
        fs.writeFileSync(filePath, csvText);

        console.log(`✅ Order CSV saved as: ${filename}`);

        // Generate the download URL
        const downloadUrl = `http://localhost:${PORT}/download/${filename}`;
        res.status(200).json({ downloadUrl });
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ error: "Failed to generate CSV file" });
    }
});

app.get('/download/:filename', (req, res) => {
    const PUBLIC_FOLDER = path.join(process.cwd(), 'downloads');
    const filePath = path.join(PUBLIC_FOLDER, req.params.filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

app.get('/api/orders/:order_id', async (req, res) => {
    try {
        const response = await fetch(`${ANONOVA_API_BASE}/${req.params.order_id}`, {
            headers: {
                'X-API-Key': ANONOVA_API_KEY,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch order: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy request failed' });
    }
});

app.get('/api/orders/list', async (req, res) => {
    try {
        const response = await fetch(`${ANONOVA_API_BASE}/list/?page=${req.query.page || 1}`, {
            headers: {
                'X-API-Key': ANONOVA_API_KEY,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to list orders: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy request failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('CORS enabled for all origins');
});
