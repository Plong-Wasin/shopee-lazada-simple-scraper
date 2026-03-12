const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetch HTML from Lazada URL (for download purposes)
 * @param {string} url - Lazada product URL
 * @returns {Promise<string>} - HTML content
 */
async function fetchLazadaHtml(url) {
  try {
    // Fetch HTML from Lazada
    const response = await axios.get(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.7559.132 Mobile Safari/537.36 (compatible; Google-InspectionTool/1.0;)'
      }
    });

    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch Lazada HTML: ${error.message}`);
  }
}

/**
 * Scrape product data from Lazada URL
 * @param {string} url - Lazada product URL
 * @returns {Promise<Object>} - Product data object
 */
async function scrapeLazada(url) {
  try {
    // Fetch HTML from Lazada
    const response = await axios.get(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.7559.132 Mobile Safari/537.36 (compatible; Google-InspectionTool/1.0;)'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const result = {
      brand: '',
      brand_name: '',
      product_name: '',
      type: '',
      flavor_style: '',
      weight_g: '',
      normal_price_thb: '',
      shipping_cost: '',
      product_url: url,
      additional_notes: '',
      image_url: '',
      meta_description: ''
    };

    // Extract meta description
    const descMatch = html.match(/<meta name="description" content="([^"]*)"/);
    if (descMatch) {
      result.meta_description = descMatch[1]
        .replace(/"/g, '"')
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>');
    }

    // Extract og:url (product URL)
    const urlMatch = html.match(/<meta property="og:url" content="([^"]*)"/);
    if (urlMatch) {
      result.product_url = urlMatch[1];
    }

    // Extract og:image (image URL)
    const imageMatch = html.match(/<meta property="og:image" content="([^"]*)"/);
    if (imageMatch) {
      result.image_url = imageMatch[1];
    }

    // Extract og:title (product name)
    const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/);
    if (titleMatch) {
      const title = titleMatch[1]
        .replace(/"/g, '"')
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>');
      result.product_name = title.replace(/\s*\|\s*Lazada\.co\.th$/, '');
    }

    // Extract pdpTrackingData for brand_name and product details
    const trackingDataMatch = html.match(/var pdpTrackingData = "(.*)"/);
    if (trackingDataMatch) {
      try {
        const jsonStr = trackingDataMatch[1];
        const unescapedJson = jsonStr.replace(/\\"/g, '"');
        const trackingData = JSON.parse(unescapedJson);
        
        if (trackingData.brand_name) {
          result.brand_name = trackingData.brand_name;
          result.brand = trackingData.brand_name;
        }
        
        if (trackingData.pdt_name) {
          result.product_name = trackingData.pdt_name;
        }
        
        if (trackingData.pdt_price) {
          // Try multiple patterns for price extraction
          let priceMatch = trackingData.pdt_price.match(/฿([\d,]+\.?\d*)/);
          
          // If Thai Baht symbol not found, try other patterns
          if (!priceMatch) {
            priceMatch = trackingData.pdt_price.match(/(\d[\d,]*\.?\d*)/);
          }
          
          if (priceMatch) {
            result.normal_price_thb = priceMatch[1].replace(/,/g, '');
          }
        }
      } catch (e) {
        console.error('Error parsing tracking data:', e.message);
      }
    }

    // Extract additional notes from product description section
    const descriptionSectionMatch = html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (descriptionSectionMatch) {
      let notes = descriptionSectionMatch[1]
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (notes && notes.length > 10) {
        result.additional_notes = notes;
      }
    }

    // Extract shipping cost from the page
    const shippingMatch = html.match(/฿([\d,]+\.?\d*)/g);
    if (shippingMatch && shippingMatch.length > 0) {
      // Try to find shipping cost (usually smaller than product price)
      const prices = shippingMatch.map(p => parseFloat(p.replace(/[฿,]/g, '')));
      if (prices.length > 1) {
        // Assume the smallest price is shipping cost
        const minPrice = Math.min(...prices);
        if (minPrice < 100) { // Shipping cost is usually less than 100 THB
          result.shipping_cost = minPrice.toFixed(2);
        }
      }
    }

    // Add HTML to the result
    result.html = html;

    return result;
  } catch (error) {
    throw new Error(`Failed to scrape Lazada: ${error.message}`);
  }
}

module.exports = { scrapeLazada, fetchLazadaHtml };
