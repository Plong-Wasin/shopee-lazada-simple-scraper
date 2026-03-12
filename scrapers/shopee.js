const axios = require("axios");

/**
 * Fetch HTML from Shopee URL (for download purposes)
 * @param {string} url - Shopee product URL
 * @returns {Promise<string>} - HTML content
 */
async function fetchShopeeHtml(url) {
  try {
    // Fetch HTML from Shopee
    const response = await axios.get(url, {
      headers: {
        Accept: "*/*, application/signed-exchange;v=b3",
        "Accept-Encoding": "gzip, deflate, br",
        "Amp-Cache-Transform": 'google;v="1..2"',
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.116 Mobile Safari/537.36 (compatible; Google-InspectionTool/1.0;)",
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch Shopee HTML: ${error.message}`);
  }
}

/**
 * Scrape product data from Shopee URL
 * @param {string} url - Shopee product URL
 * @returns {Promise<Object>} - Product data object
 */
async function scrapeShopee(url) {
  try {
    // Fetch HTML from Shopee
    const response = await axios.get(url, {
      headers: {
        Accept: "*/*, application/signed-exchange;v=b3",
        "Accept-Encoding": "gzip, deflate, br",
        "Amp-Cache-Transform": 'google;v="1..2"',
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.116 Mobile Safari/537.36 (compatible; Google-InspectionTool/1.0;)",
      },
    });

    const html = response.data;

    // Extract meta description
    const extractMetaDescription = (html) => {
      const patterns = [
        /<meta\s+data-rh="true"\s+name="description"\s+content="([^"]*)"/,
        /<meta\s+name="description"\s+data-rh="true"\s+content="([^"]*)"/,
        /<meta\s+name="description"\s+content="([^"]*)"/,
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
          return match[1];
        }
      }
      return "";
    };

    // Extract canonical link (product URL)
    const extractCanonicalUrl = (html) => {
      const canonicalMatch = html.match(
        /<link\s+data-rh="true"\s+rel="canonical"\s+href="([^"]*)"/,
      );
      if (canonicalMatch) {
        return canonicalMatch[1];
      }
      return "";
    };

    const metaDescription = extractMetaDescription(html);
    const canonicalUrl = extractCanonicalUrl(html);

    // Find the script tag with type="text/mfe-initial-data"
    const scriptMatch = html.match(
      /<script\s+type="text\/mfe-initial-data"[^>]*>([\s\S]+?)<\/script>/,
    );

    if (!scriptMatch) {
      throw new Error(
        'Could not find <script type="text/mfe-initial-data"> in the HTML',
      );
    }

    const jsonStr = scriptMatch[1].trim();
    const jsonData = JSON.parse(jsonStr);

    // Extract data following the same structure
    const initialState = jsonData.initialState || {};
    const domainPDP = initialState.DOMAIN_PDP || {};
    const pdpData = domainPDP.data || {};
    const cachedMap = pdpData.PDP_BFF_DATA?.cachedMap || {};

    // Get the first item from cachedMap
    const itemKey = Object.keys(cachedMap)[0];
    const itemData = cachedMap[itemKey]?.item || {};
    const contextData = initialState.DOMAIN_CONTEXT?.data || {};

    // Helper function to find attribute value by name
    const findAttributeValue = (attributes, name) => {
      if (!attributes || !Array.isArray(attributes)) return "";
      const attr = attributes.find((a) => a.name === name);
      return attr ? attr.value : "";
    };

    // Extract shipping cost from RW_VARIATION_SELECTION
    const extractShippingCost = (initialState) => {
      const rwVariation =
        initialState.RW_VARIATION_SELECTION?.data?.itemLevel?.product_shipping;
      if (!rwVariation) return "";

      const preSelectedChannel = rwVariation.pre_selected_shipping_channel;
      if (!preSelectedChannel || !preSelectedChannel.price_before_discount)
        return "";

      const price = preSelectedChannel.price_before_discount.single_value;
      if (price !== null && price !== undefined) {
        return (price / 100000).toFixed(2); // Convert from smallest unit to Baht
      }

      return "";
    };

    // Extract description from RW_VARIATION_SELECTION
    const extractDescription = (initialState) => {
      const rwVariation =
        initialState.RW_VARIATION_SELECTION?.data?.itemLevel?.item;
      if (!rwVariation || !rwVariation.description) return "";
      return rwVariation.description;
    };

    // Build product data
    const productData = {
      brand: itemData.brand || "",
      brand_name: itemData.brand || "",
      product_name: itemData.title || "",
      type: "", // Category not directly available
      flavor_style: "", // Flavor/Style not directly available
      weight_g:
        findAttributeValue(itemData.attributes, "น้ำหนักของสินค้า") || "",
      normal_price_thb: "", // Price data not available in this JSON
      shipping_cost: extractShippingCost(initialState),
      product_url: canonicalUrl || url,
      additional_notes: extractDescription(initialState),
      image_url: itemData.image
        ? `https://down-th.img.susercontent.com/${itemData.image}`
        : "",
      meta_description: metaDescription,
      html: html, // Include the fetched HTML
    };

    return productData;
  } catch (error) {
    throw new Error(`Failed to scrape Shopee: ${error.message}`);
  }
}

module.exports = { scrapeShopee, fetchShopeeHtml };
