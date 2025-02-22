import express from 'express';
import cors from 'cors';

const app = express();

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

const APIFY_TOKEN = 'apify_api_QlSIvabctBUdF8IPFQDT8sC3w6soCU3Lw7Uj';
const ACTOR_ID = 'Oliuhvq8My0EiVIT0';
const APIFY_API_BASE = 'https://api.apify.com/v2';

// Proxy endpoint for Apify API
app.post('/api/apify/run', async (req, res) => {
    try {
        console.log('Received request to start extraction:', req.body);

        const response = await fetch(`${APIFY_API_BASE}/acts/${ACTOR_ID}/runs`, {
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

        const runResponse = await fetch(`${APIFY_API_BASE}/acts/${ACTOR_ID}/runs/${req.params.runId}`, {
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('CORS enabled for all origins');
});