const axios = require('axios');

class FreeMapsUtils {
  constructor() {
    this.services = {
      nominatim: 'https://nominatim.openstreetmap.org',
      overpass: 'https://overpass-api.de/api/interpreter',
      elevation: 'https://api.open-elevation.com/api/v1/lookup',
      staticMap: 'https://staticmap.openstreetmap.de/staticmap.php'
    };
  }

  // Get timezone for coordinates
  async getTimezone(lat, lng) {
    try {
      // Using a free timezone API
      const response = await axios.get(`http://worldtimeapi.org/api/timezone/etc/gmt`);
      return response.data.timezone;
    } catch (error) {
      return null;
    }
  }

  // Get weather data (free service)
  async getWeather(lat, lng) {
    try {
      // Using open-meteo (free weather API)
      const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: lat,
          longitude: lng,
          current_weather: true,
          timezone: 'auto'
        }
      });
      
      return response.data.current_weather;
    } catch (error) {
      return null;
    }
  }

  // Get country/region info
  async getCountryInfo(lat, lng) {
    try {
      const response = await axios.get(`${this.services.nominatim}/reverse`, {
        params: {
          lat: lat,
          lon: lng,
          format: 'json',
          addressdetails: 1,
          zoom: 5
        },
        headers: {
          'User-Agent': 'Cilok Location Toolkit'
        }
      });

      if (response.data && response.data.address) {
        return {
          country: response.data.address.country,
          country_code: response.data.address.country_code,
          state: response.data.address.state,
          city: response.data.address.city || response.data.address.town
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  // Generate alternative map service URLs
  getAlternativeMapUrls(lat, lng) {
    return {
      openstreetmap: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`,
      google: `https://maps.google.com/maps?q=${lat},${lng}`,
      bing: `https://www.bing.com/maps?cp=${lat}~${lng}&lvl=15`,
      wikimapia: `http://wikimapia.org/#lang=id&lat=${lat}&lon=${lng}&z=15`,
      yandex: `https://yandex.com/maps/?ll=${lng},${lat}&z=15`,
      here: `https://wego.here.com/?map=${lat},${lng},15,normal`
    };
  }

  // Get static map image without API key
  getStaticMapImageUrl(lat, lng, zoom = 15, width = 400, height = 300) {
    return `${this.services.staticMap}?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&maptype=mapnik&markers=${lat},${lng},red-pushpin`;
  }
}

module.exports = FreeMapsUtils;