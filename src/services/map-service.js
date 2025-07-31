const qrcode = require('qrcode-terminal');
const chalk = require('chalk');

class MapService {
  constructor() {
    this.mapboxKey = process.env.MAPBOX_API_KEY;
    this.googleMapsKey = process.env.GOOGLE_MAPS_API_KEY;
  }

  async initialize() {
    // MapService doesn't require initialization
  }
  generateLocationLinks(lat, lng) {
   console.log(chalk.blue('🌍 Map Links:'));
   
   // Always available - OpenStreetMap
   const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`;
   console.log(chalk.blue(`• OpenStreetMap: ${osmUrl}`));
   
   // Google Maps (always works without API key for web links)
   const googleUrl = `https://maps.google.com/maps?q=${lat},${lng}`;
   console.log(chalk.green(`• Google Maps: ${googleUrl}`));
   
   // Additional free map services
   const bingUrl = `https://www.bing.com/maps?cp=${lat}~${lng}&lvl=15`;
   console.log(chalk.cyan(`• Bing Maps: ${bingUrl}`));
   
   const wikiMapiaUrl = `http://wikimapia.org/#lang=id&lat=${lat}&lon=${lng}&z=15`;
   console.log(chalk.yellow(`• WikiMapia: ${wikiMapiaUrl}`));
   
   // Premium services if available
   if (this.mapboxKey) {
     const mapboxUrl = `https://www.mapbox.com/maps/?center=${lng},${lat}&zoom=15`;
     console.log(chalk.magenta(`• Mapbox: ${mapboxUrl}`));
   }
   
   // Generate QR Code for the most universal link (Google Maps)
   console.log(chalk.white('\n📱 QR Code (Google Maps):'));
   this.generateQRCode(googleUrl);
 }

 generateQRCode(url) {
   qrcode.generate(url, { small: true }, (qr) => {
     console.log(qr);
   });
 }

 getMapboxStaticMap(lat, lng, zoom = 15, width = 400, height = 300) {
   if (!this.mapboxKey) return null;
   
   return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${lng},${lat})/${lng},${lat},${zoom}/${width}x${height}?access_token=${this.mapboxKey}`;
 }

 getGoogleMapsUrl(lat, lng) {
   return `https://maps.google.com/maps?q=${lat},${lng}`;
 }

 getOpenStreetMapUrl(lat, lng, zoom = 15) {
   return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=${zoom}`;
 }

 getBingMapsUrl(lat, lng) {
   return `https://www.bing.com/maps?cp=${lat}~${lng}&lvl=15`;
 }

 getWikiMapiaUrl(lat, lng) {
   return `http://wikimapia.org/#lang=id&lat=${lat}&lon=${lng}&z=15`;
 }

 // Generate static map image URL (free alternatives)
 getStaticMapUrl(lat, lng, zoom = 15, width = 400, height = 300) {
   // Use OpenStreetMap static map service (free)
   return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&maptype=mapnik&markers=${lat},${lng},red-pushpin`;
 }

 // Get elevation data (free service)
 async getElevation(lat, lng) {
   try {
     const response = await axios.get(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`);
     return response.data.results[0]?.elevation || null;
   } catch (error) {
     return null;
   }
 }
}

module.exports = MapService;