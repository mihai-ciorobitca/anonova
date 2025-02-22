import express from 'express';
import cors from 'cors';
import { ApifyClient } from 'apify-client';

const app = express();
 
// Enable CORS with specific options
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const APIFY_TOKEN = 'apify_api_QlSIvabctBUdF8IPFQDT8sC3w6soCU3Lw7Uj';
const ACTOR_ID = 'Oliuhvq8My0EiVIT0';

// Initialize Apify client
const apifyClient = new ApifyClient({
  token: APIFY_TOKEN,
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Proxy endpoint for Apify API
app.post('/api/apify/run', async (req, res) => {
  try {
    // Validate and clean input
    if (!req.body.keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    // Clean the keyword
    let keyword = req.body.keyword.trim();
    if (keyword.startsWith('http')) {
      // Extract username from URL
      keyword = keyword.split('/').filter(Boolean).pop() || keyword;
    }
    // Remove @ or # if present
    keyword = keyword.replace(/^[@#]/, '');

    console.log('Starting extraction with keyword:', keyword);
    
    // Prepare input
    const input = {
      ...req.body,
      keyword,
      maxLeads: Math.min(req.body.maxLeads || 10, 50), // Limit to 50 results
      proxyConfiguration: { useApifyProxy: true }
    };

    // Run the Actor
    const actor = apifyClient.actor(ACTOR_ID);
    const run = await actor.start(input);
    
    console.log('Actor run started:', run.id);
    
    if (!run.defaultDatasetId) {
      throw new Error('No dataset ID returned from Apify');
    }

    // Wait for the run to finish with timeout
    let finished = false;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    
    while (!finished && attempts < maxAttempts) {
      const runStatus = await actor.run(run.id).get();
      console.log('Run status:', runStatus.status);
      
      if (runStatus.status === 'SUCCEEDED') {
        finished = true;
        console.log('Run completed successfully');
      } else if (runStatus.status === 'FAILED') {
        throw new Error('Extraction failed: ' + (runStatus.errorMessage || 'Unknown error'));
      } else if (!['READY', 'RUNNING'].includes(runStatus.status)) {
        throw new Error('Unexpected run status: ' + runStatus.status);
      }
      
      if (!finished) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        attempts++;
      }
    }
    
    if (!finished) {
      throw new Error('Extraction timed out after 5 minutes');
    }

    // Get dataset items
    let items;
    try {
      const dataset = await apifyClient.dataset(run.defaultDatasetId);
      const result = await dataset.listItems();
      items = result.items;
      console.log(`Retrieved ${items.length} items from dataset`);
    } catch (error) {
      console.error('Error fetching dataset:', error);
      throw new Error('Failed to retrieve extraction results');
    }

    console.log('Raw results from dataset:', JSON.stringify(items, null, 2));

    if (!items || items.length === 0) {
      return res.status(404).json({ error: 'No results found' });
    }

    // Validate items structure
    if (!Array.isArray(items)) {
      console.error('Invalid items structure:', items);
      throw new Error('Invalid response format from Apify');
    }

    // Function to extract text content from HTML
    const extractText = (html) => {
      if (typeof html !== 'string') return '';
      return html
        .replace(/<[^>]+>/g, ' ') // Replace HTML tags with spaces
        .replace(/&nbsp;/g, ' ')  // Replace &nbsp; with spaces
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim();
    };

    // Function to extract data from any object structure
    const extractDataFromObject = (obj) => {
      const result = {
        lead: '',
        username: '',
        userLink: '',
        emails: [],
        phones: [],
        summary: ''
      };

      // Helper to extract emails from text
      const extractEmails = (text) => {
        if (typeof text !== 'string') return [];
        const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        return matches || [];
      };

      // Helper to extract phone numbers from text
      const extractPhones = (text) => {
        if (typeof text !== 'string') return [];
        const matches = text.match(/(?:\+\d{1,3}[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}/g);
        return matches || [];
      };

      // Process all values in the object
      const processValue = (value, key) => {
        if (typeof value === 'string') {
          const text = extractText(value);
          
          // Extract emails and phones from all text
          result.emails.push(...extractEmails(text));
          result.phones.push(...extractPhones(text));

          // Map common field names
          if (key.toLowerCase().includes('name') || key.toLowerCase().includes('title')) {
            result.lead = text || result.lead;
          }
          if (key.toLowerCase().includes('user') || key.toLowerCase().includes('handle')) {
            result.username = text || result.username;
          }
          if (key.toLowerCase().includes('link') || key.toLowerCase().includes('url')) {
            result.userLink = text || result.userLink;
          }
          if (key.toLowerCase().includes('bio') || key.toLowerCase().includes('description')) {
            result.summary = text || result.summary;
          }
        } else if (Array.isArray(value)) {
          value.forEach(item => {
            if (typeof item === 'object') {
              const extracted = extractDataFromObject(item);
              result.emails.push(...extracted.emails);
              result.phones.push(...extracted.phones);
              result.lead = result.lead || extracted.lead;
              result.username = result.username || extracted.username;
              result.userLink = result.userLink || extracted.userLink;
              result.summary = result.summary || extracted.summary;
            }
          });
        } else if (value && typeof value === 'object') {
          const extracted = extractDataFromObject(value);
          result.emails.push(...extracted.emails);
          result.phones.push(...extracted.phones);
          result.lead = result.lead || extracted.lead;
          result.username = result.username || extracted.username;
          result.userLink = result.userLink || extracted.userLink;
          result.summary = result.summary || extracted.summary;
        }
      };

      // Process all fields in the object
      Object.entries(obj).forEach(([key, value]) => processValue(value, key));

      // Remove duplicates
      result.emails = [...new Set(result.emails)];
      result.phones = [...new Set(result.phones)];

      return result;
    };

    // Function to extract data from HTML table
    const extractTableData = (html) => {
      const rows = html.match(/<tr[^>]*>(.*?)<\/tr>/g) || [];
      return rows.map(row => {
        const cells = row.match(/<t[dh][^>]*>(.*?)<\/t[dh]>/g) || [];
        return cells.map(cell => {
          // Remove HTML tags and decode entities
          return cell.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
        });
      });
    };

    // Function to convert HTML content to structured data
    const parseHtmlContent = (content) => {
      if (typeof content !== 'string') return content;
      
      // Check if content is HTML
      if (content.includes('</table>')) {
        const tableData = extractTableData(content);
        if (tableData.length > 1) {
          // First row as headers
          const headers = tableData[0];
          // Rest as data
          const rows = tableData.slice(1);
          return rows.map(row => 
            Object.fromEntries(
              headers.map((header, i) => [header.toLowerCase(), row[i] || ''])
            )
          );
        }
      }
      
      return content;
    };

    // Clean and validate the data
    const cleanedItems = items.map(item => extractDataFromObject(item));
    
    console.log(`Successfully cleaned ${cleanedItems.length} items`);

    // Validate cleaned data
    if (!cleanedItems.length) {
      return res.status(404).json({ error: 'No valid data could be extracted' });
    }

    console.log('Sending response with cleaned data');
    res.json({ data: cleanedItems });
  } catch (error) {
    console.error('Proxy error:', error);
    
    // Map common errors to appropriate status codes
    let status = 500;
    if (error.message?.includes('No results') || error.message?.includes('No valid data')) {
      status = 404;
    } else if (error.message?.includes('Invalid response format')) {
      status = 422;
    }
    
    res.status(status).json({ error: error.message || 'Proxy request failed' });
  }
});

// Proxy endpoint for getting dataset items
app.get('/api/apify/run/:runId/dataset', async (req, res) => {
  try {
    const datasetUrl = 'https://api.apify.com/v2/datasets/f0FjdVLQLzYFnN3Mn/items?clean=true&format=json&limit=1000&view=overview';
    console.log('Fetching dataset from:', datasetUrl);

    const response = await fetch(datasetUrl, {
      headers: {
        'Authorization': `Bearer ${APIFY_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Dataset response:', data);

    if (!Array.isArray(data)) {
      throw new Error('Invalid dataset format: expected array');
    }

    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch dataset' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
