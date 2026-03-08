const express = require('express');
const router = express.Router();

/**
 * GET /api/location/detect
 * Detects user location based on their IP address using an external API
 */
router.get('/detect', async (req, res) => {
  try {
    // Get IP from request headers (handling proxies like Vercel/Render)
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // If it's a comma separated list, take the first one
    if (ip && ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    
    // For local development, '::1' or '127.0.0.1' won't work with geo APIs
    if (!ip || ip === '::1' || ip === '127.0.0.1') {
      // In production we should use the actual IP
      // For local testing, ipapi.co will use the requester's IP if we don't provide one
      ip = ''; 
    }

    console.log(`🌍 [Location] Detecting for IP: ${ip || 'Self'}`);

    // 1. Priority: Checked for native Cloudflare/Vercel/Render headers
    const cfCountry = req.headers['cf-ipcountry'];
    const vercelCountry = req.headers['x-vercel-ip-country'];
    
    if (cfCountry || vercelCountry) {
      const countryCode = cfCountry || vercelCountry;
      console.log(`🌍 [Location] Detected from Headers: ${countryCode}`);
      
      // Basic mapping for header-only detection
      const defaults = {
        'PK': { country: 'Pakistan', currency: 'PKR' },
        'GB': { country: 'United Kingdom', currency: 'GBP' },
        'US': { country: 'United States', currency: 'USD' }
      };
      
      const mapped = defaults[countryCode] || { country: countryCode, currency: 'GBP' };
      
      return res.json({
        success: true,
        countryCode,
        country: mapped.country,
        currency: mapped.currency,
        city: 'Detected (Header)',
        ip: ip || 'Hidden'
      });
    }

    console.log(`🌍 [Location] Detecting for IP: ${ip || 'Self'}`);

    // List of providers for fallback
    const providers = [
      {
        name: 'ipapi.co',
        url: ip ? `https://ipapi.co/${ip}/json/` : `https://ipapi.co/json/`,
        parser: (data) => ({
          country: data.country_name,
          countryCode: data.country_code,
          city: data.city,
          currency: data.currency
        })
      },
      {
        name: 'freeipapi.com',
        url: ip ? `https://freeipapi.com/api/json/${ip}` : `https://freeipapi.com/api/json`,
        parser: (data) => ({
          country: data.countryName,
          countryCode: data.countryCode,
          city: data.cityName,
          currency: data.currencyCode
        })
      },
      {
        name: 'ip-api.com',
        url: ip ? `http://ip-api.com/json/${ip}` : `http://ip-api.com/json/`,
        parser: (data) => ({
          country: data.country,
          countryCode: data.countryCode,
          city: data.city,
          currency: 'PKR' // Fallback currency
        })
      }
    ];

    for (const provider of providers) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout per provider
      
      try {
        console.log(`🔍 [Location] Trying ${provider.name}...`);
        const response = await fetch(provider.url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const data = await response.json();

        if (data.error || data.reason === 'RateLimited' || data.status === 'fail' || data.message === 'limit exceeded') {
          console.warn(`⚠️ [Location] ${provider.name} failed/limited.`);
          continue;
        }

        const locationData = provider.parser(data);
        if (!locationData.countryCode) continue;

        console.log(`✅ [Location] Detected via ${provider.name}:`, locationData.countryCode);
        
        return res.json({
          success: true,
          ...locationData,
          ip: ip || 'Self'
        });
      } catch (err) {
        clearTimeout(timeoutId);
        console.warn(`⚠️ [Location] ${provider.name} request failed or timed out:`, err.message);
      }
    }

    // FINAL FALLBACK
    console.error('💥 [Location] All location providers failed.');
    return res.json({
      success: false,
      country: 'Pakistan',
      countryCode: 'PK',
      currency: 'PKR',
    });
  } catch (error) {
    console.error('💥 [Location] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to detect location'
    });
  }
});

module.exports = router;
