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

    // Call external Geo API
    const apiUrl = ip ? `https://ipapi.co/${ip}/json/` : `https://ipapi.co/json/`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error) {
      console.warn('⚠️ [Location] External API returned error:', data.reason);
      return res.status(400).json({
        success: false,
        message: data.reason || 'Location detection failed'
      });
    }

    const locationData = {
      country: data.country_name,
      countryCode: data.country_code,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      ip: data.ip,
      region: data.region,
      currency: data.currency
    };

    console.log('✅ [Location] Detected:', locationData.city, locationData.countryCode);

    res.json({
      success: true,
      ...locationData
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
