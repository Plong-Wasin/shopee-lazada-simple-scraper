const express = require('express');
const path = require('path');
const { scrapeShopee, fetchShopeeHtml } = require('./scrapers/shopee');
const { scrapeLazada, fetchLazadaHtml } = require('./scrapers/lazada');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API route for scraping
app.post('/api/scrape', async (req, res) => {
  const { platform, url } = req.body;

  // Validate input
  if (!platform || !url) {
    return res.status(400).json({
      error: 'Missing required fields: platform and url'
    });
  }

  // Validate platform
  if (!['shopee', 'lazada'].includes(platform)) {
    return res.status(400).json({
      error: 'Invalid platform. Must be either "shopee" or "lazada"'
    });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (error) {
    return res.status(400).json({
      error: 'Invalid URL format'
    });
  }

  try {
    let productData;

    // Route to appropriate scraper
    if (platform === 'shopee') {
      if (!url.includes('shopee.co.th')) {
        return res.status(400).json({
          error: 'Invalid Shopee URL. Must be from shopee.co.th'
        });
      }
      productData = await scrapeShopee(url);
    } else if (platform === 'lazada') {
      if (!url.includes('lazada.co.th')) {
        return res.status(400).json({
          error: 'Invalid Lazada URL. Must be from lazada.co.th'
        });
      }
      productData = await scrapeLazada(url);
    }

    res.json({
      success: true,
      data: productData
    });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({
      error: error.message || 'Failed to scrape product data'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Product Scraper API is running'
  });
});

// Download HTML endpoint
app.post('/api/download-html', async (req, res) => {
  const { platform, url } = req.body;

  // Validate input
  if (!platform || !url) {
    return res.status(400).json({
      error: 'Missing required fields: platform and url'
    });
  }

  // Validate platform
  if (!['shopee', 'lazada'].includes(platform)) {
    return res.status(400).json({
      error: 'Invalid platform. Must be either "shopee" or "lazada"'
    });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (error) {
    return res.status(400).json({
      error: 'Invalid URL format'
    });
  }

  try {
    let html;

    // Route to appropriate fetch function (not scrape function)
    if (platform === 'shopee') {
      if (!url.includes('shopee.co.th')) {
        return res.status(400).json({
          error: 'Invalid Shopee URL. Must be from shopee.co.th'
        });
      }
      html = await fetchShopeeHtml(url);
    } else if (platform === 'lazada') {
      if (!url.includes('lazada.co.th')) {
        return res.status(400).json({
          error: 'Invalid Lazada URL. Must be from lazada.co.th'
        });
      }
      html = await fetchLazadaHtml(url);
    }

    // Set headers for HTML download
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${platform}-page-${Date.now()}.html"`);
    
    // Send the HTML content
    res.send(html);
  } catch (error) {
    console.error('Download HTML error:', error);
    res.status(500).json({
      error: error.message || 'Failed to download HTML'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Product Scraper server is running on http://localhost:${PORT}`);
  console.log(`📝 API endpoint: http://localhost:${PORT}/api/scrape`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
});
