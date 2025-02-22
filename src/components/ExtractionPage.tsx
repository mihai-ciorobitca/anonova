@@ .. @@
   const handleStartExtraction = async () => {
     const keyword = extractionConfig.isHashtagMode ? extractionConfig.hashtag : extractionConfig.profileUrl;
     
     try {
       const results = await runApifyExtraction({
         keyword,
         country: extractionConfig.country,
         language: extractionConfig.language,
-        maxLeads: extractionConfig.creditsToUse, // Limit results to available credits
+        maxLeads: extractionConfig.maxResults, // Use maxResults instead of creditsToUse
         proxyConfiguration: {
           useApifyProxy: true
         }
       });
