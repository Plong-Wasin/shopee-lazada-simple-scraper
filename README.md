# Product Scraper - Shopee & Lazada

A web-based scraper for extracting product data from Shopee and Lazada e-commerce platforms. Built with Node.js, Express, and Axios.

⚠️ **Important Notice:** This project is designed and tested specifically for **.co.th** domains (Thailand). It cannot be used with other regional domains such as shopee.tw.

**Note:** This entire project was written by AI. I only provided the concept, principles, and guidance on how to handle specific problems when they arose during development.

## Features

- 🛍️ Scrape product data from Shopee.co.th
- 🏪 Scrape product data from Lazada.co.th
- 🌐 Modern web interface
- 📱 Responsive design
- ⚡ Fast scraping with proper headers
- 📦 Extracts comprehensive product information

## Extracted Data

The scraper extracts the following product information:

- Brand name
- Product name
- Product type
- Flavor/Style
- Weight (in grams)
- Normal price (THB)
- Shipping cost (THB)
- Product URL
- Image URL
- Meta description
- Additional notes/description

## Installation

### Local Development

1. Navigate to the shopee-lazada-simple-scraper directory:
```bash
cd shopee-lazada-simple-scraper
```

2. Install dependencies:
```bash
npm install
```

### Using Docker

1. Navigate to the shopee-lazada-simple-scraper directory:
```bash
cd shopee-lazada-simple-scraper
```

2. Build and run with Docker Compose:
```bash
docker-compose up -d
```

3. View logs:
```bash
docker-compose logs -f
```

4. Stop the container:
```bash
docker-compose down
```

#### Local Overrides

For local development with custom settings, use `docker-compose.local.yml`:

```bash
# Use local overrides
docker-compose -f docker-compose.yml -f docker-compose.local.yml up -d
```

The `docker-compose.local.yml` file allows you to override settings for your local environment without committing them to version control. Common overrides include:
- Different port mappings
- Development environment variables
- Disabled health checks for faster startup
- No auto-restart policy

Copy `docker-compose.local.yml` and modify it for your needs.

## Usage

### Start the server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

**Using Docker Compose:**
```bash
docker-compose up -d
```

The server will start on `http://localhost:3002` (Docker Compose maps port 3002 to container port 3000)

### Using the web interface

1. Open your browser and go to `http://localhost:3000`
2. Select the platform (Shopee or Lazada)
3. Paste the product URL
4. Click "Scrape Product Data"
5. View the extracted product information

### API Endpoint

**POST** `/api/scrape`

Request body:
```json
{
  "platform": "shopee",
  "url": "https://shopee.co.th/product-url"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "brand": "Brand Name",
    "brand_name": "Brand Name",
    "product_name": "Product Name",
    "type": "",
    "flavor_style": "",
    "weight_g": "100",
    "normal_price_thb": "299.00",
    "shipping_cost": "30.00",
    "product_url": "https://...",
    "additional_notes": "Product description...",
    "image_url": "https://...",
    "meta_description": "Meta description..."
  }
}
```

## Example URLs

### Shopee
```
https://shopee.co.th/Se-ed-(ซีเอ็ด)-หนังสือ-Money-Mastery-มั่งคั่งทั้งชีวิต-i.119383836.23237467185
```

### Lazada
```
https://www.lazada.co.th/products/product-name-i12345678-s12345678.html
```

## Project Structure

```
web-scraper/
├── package.json          # Project dependencies
├── server.js             # Express server with API routes
├── scrapers/
│   ├── shopee.js        # Shopee scraper module
│   └── lazada.js        # Lazada scraper module
├── public/
│   └── index.html       # Web interface
└── README.md            # This file
```

## Dependencies

- **express**: Web framework for Node.js
- **axios**: HTTP client for making requests
- **cheerio**: jQuery-like HTML parser for Lazada

## Notes

- The scraper uses proper headers to mimic browser requests
- Shopee data is extracted from embedded JSON in the page
- Lazada data is extracted using HTML parsing and regex
- Some fields may be empty depending on the product page structure

### Price Limitations

**Shopee:**
- ⚠️ Cannot extract product prices from Shopee product pages
- The scraper can extract all other product information except for the actual price

**Lazada:**
- ⚠️ Cannot extract the actual/real price from Lazada product pages
- Only the original/strike-through price (before promotion) can be extracted
- The current promotional price is not accessible through the scraper

## Troubleshooting

### Scraping fails
- Ensure the URL is valid and accessible
- Check that the product page structure hasn't changed
- Verify your internet connection

### Port already in use (local)
Change the port by setting the `PORT` environment variable:
```bash
PORT=8080 npm start
```

### Port already in use (Docker)
Edit the `docker-compose.yml` file to change the host port mapping:
```yaml
ports:
  - "8080:3000"  # Change 8080 to your desired port
```

Then rebuild and restart:
```bash
docker-compose down
docker-compose up -d
```

## License

MIT
