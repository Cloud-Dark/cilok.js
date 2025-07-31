const axios = require('axios');
const chalk = require('chalk');

class LocationService {
    constructor() {
        this.googleMapsKey = process.env.GOOGLE_MAPS_API_KEY;
        this.mapboxKey = process.env.MAPBOX_API_KEY;
        this.useFreeMaps = !this.googleMapsKey && !this.mapboxKey;

        // Nominatim (OpenStreetMap) settings
        this.nominatimBaseUrl = 'https://nominatim.openstreetmap.org';
        this.overpassBaseUrl = 'https://overpass-api.de/api/interpreter';
    }

    async initialize() {
        if (this.useFreeMaps) {
            console.log('🗺️  Using free OpenStreetMap services');
        }
    }

    async searchLocation(locationName) {
        if (this.googleMapsKey) {
            return await this.searchLocationGoogle(locationName);
        } else {
            return await this.searchLocationNominatim(locationName);
        }
    }

    async searchLocationGoogle(locationName) {
        try {
            const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
                params: {
                    query: locationName,
                    key: this.googleMapsKey,
                    language: 'id',
                    region: 'id'
                }
            });

            if (response.data.results.length === 0) {
                throw new Error('Location not found');
            }

            const place = response.data.results[0];
            const details = await this.getPlaceDetails(place.place_id);
            const nearby = await this.getNearbyPlaces(
                place.geometry.location.lat,
                place.geometry.location.lng
            );

            return {
                name: place.name,
                formatted_address: place.formatted_address,
                coordinates: {
                    lat: place.geometry.location.lat,
                    lng: place.geometry.location.lng
                },
                types: place.types,
                rating: place.rating,
                details: details,
                nearby: nearby.slice(0, 5)
            };
        } catch (error) {
            throw new Error(`Location search failed: ${error.message}`);
        }
    }

    async searchLocationNominatim(locationName) {
        try {
            console.log(chalk.gray(`[DEBUG] Searching: "${locationName}" via Nominatim`));

            const response = await axios.get(`${this.nominatimBaseUrl}/search`, {
                params: {
                    q: locationName,
                    format: 'json',
                    addressdetails: 1,
                    limit: 5, // Increase limit for better results
                    countrycodes: 'id',
                    'accept-language': 'id'
                },
                headers: {
                    'User-Agent': 'Cilok Location Toolkit (https://github.com/Cloud-Dark/cilok)'
                },
                timeout: 10000 // 10 second timeout
            });

            console.log(chalk.gray(`[DEBUG] Nominatim returned ${response.data.length} results`));

            if (response.data.length === 0) {
                // Try searching without country restriction
                console.log(chalk.yellow('[DEBUG] Retrying without country restriction...'));
                const globalSearch = await axios.get(`${this.nominatimBaseUrl}/search`, {
                    params: {
                        q: locationName,
                        format: 'json',
                        addressdetails: 1,
                        limit: 5,
                        'accept-language': 'id'
                    },
                    headers: {
                        'User-Agent': 'Cilok Location Toolkit (https://github.com/Cloud-Dark/cilok)'
                    },
                    timeout: 10000
                });

                if (globalSearch.data.length === 0) {
                    throw new Error(`Location "${locationName}" not found`);
                }

                response.data = globalSearch.data;
            }

            const place = response.data[0];
            const lat = parseFloat(place.lat);
            const lng = parseFloat(place.lon);

            console.log(chalk.gray(`[DEBUG] Found: ${place.display_name} at ${lat}, ${lng}`));

            // Get nearby places using Overpass API
            let nearby = [];
            try {
                nearby = await this.getNearbyPlacesOverpass(lat, lng);
                console.log(chalk.gray(`[DEBUG] Found ${nearby.length} nearby places`));
            } catch (nearbyError) {
                console.log(chalk.yellow(`[DEBUG] Nearby search failed: ${nearbyError.message}`));
            }

            return {
                name: place.display_name.split(',')[0],
                formatted_address: place.display_name,
                coordinates: { lat, lng },
                types: [place.type, place.class].filter(Boolean),
                osm_id: place.osm_id,
                osm_type: place.osm_type,
                importance: place.importance,
                nearby: nearby.slice(0, 5)
            };
        } catch (error) {
            console.error(chalk.red('[DEBUG] Nominatim search error:'), error.message);
            throw new Error(`Location search failed: ${error.message}`);
        }
    }

    async getCoordinates(address) {
        if (this.googleMapsKey) {
            return await this.getCoordinatesGoogle(address);
        } else {
            return await this.getCoordinatesNominatim(address);
        }
    }

    async getCoordinatesGoogle(address) {
        try {
            const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                params: {
                    address: address,
                    key: this.googleMapsKey,
                    language: 'id',
                    region: 'id'
                }
            });

            if (response.data.results.length === 0) {
                throw new Error('Address not found');
            }

            const result = response.data.results[0];
            return {
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng,
                formatted_address: result.formatted_address,
                accuracy: result.geometry.location_type
            };
        } catch (error) {
            throw new Error(`Geocoding failed: ${error.message}`);
        }
    }

    async getCoordinatesNominatim(address) {
        try {
            const response = await axios.get(`${this.nominatimBaseUrl}/search`, {
                params: {
                    q: address,
                    format: 'json',
                    addressdetails: 1,
                    limit: 1,
                    countrycodes: 'id'
                },
                headers: {
                    'User-Agent': 'Cilok Location Toolkit (https://github.com/Cloud-Dark/cilok)'
                }
            });

            if (response.data.length === 0) {
                throw new Error('Address not found');
            }

            const result = response.data[0];
            return {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                formatted_address: result.display_name,
                accuracy: result.importance
            };
        } catch (error) {
            throw new Error(`Geocoding failed: ${error.message}`);
        }
    }

    async reverseGeocode(lat, lng) {
        if (this.googleMapsKey) {
            return await this.reverseGeocodeGoogle(lat, lng);
        } else {
            return await this.reverseGeocodeNominatim(lat, lng);
        }
    }

    async reverseGeocodeGoogle(lat, lng) {
        try {
            const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                params: {
                    latlng: `${lat},${lng}`,
                    key: this.googleMapsKey,
                    language: 'id'
                }
            });

            if (response.data.results.length === 0) {
                throw new Error('No location found for these coordinates');
            }

            const result = response.data.results[0];
            const nearby = await this.getNearbyPlaces(lat, lng);

            return {
                name: result.address_components[0]?.long_name || 'Unknown Location',
                formatted_address: result.formatted_address,
                coordinates: { lat, lng },
                types: result.types,
                nearby: nearby.slice(0, 5)
            };
        } catch (error) {
            throw new Error(`Reverse geocoding failed: ${error.message}`);
        }
    }

    async reverseGeocodeNominatim(lat, lng) {
        try {
            const response = await axios.get(`${this.nominatimBaseUrl}/reverse`, {
                params: {
                    lat: lat,
                    lon: lng,
                    format: 'json',
                    addressdetails: 1,
                    zoom: 18
                },
                headers: {
                    'User-Agent': 'Cilok Location Toolkit (https://github.com/Cloud-Dark/cilok)'
                }
            });

            if (!response.data || response.data.error) {
                throw new Error('No location found for these coordinates');
            }

            const result = response.data;
            const nearby = await this.getNearbyPlacesOverpass(lat, lng);

            return {
                name: result.name || result.display_name.split(',')[0],
                formatted_address: result.display_name,
                coordinates: { lat, lng },
                types: [result.type, result.class].filter(Boolean),
                nearby: nearby.slice(0, 5)
            };
        } catch (error) {
            throw new Error(`Reverse geocoding failed: ${error.message}`);
        }
    }

    async searchNearby(location, type = 'restaurant') {
        // First get coordinates of the location
        const coords = await this.getCoordinates(location);

        if (this.googleMapsKey) {
            return await this.getNearbyPlaces(coords.lat, coords.lng, 1000, type);
        } else {
            return await this.getNearbyPlacesOverpass(coords.lat, coords.lng, type);
        }
    }

    async getNearbyPlaces(lat, lng, radius = 500, type = null) {
        try {
            const params = {
                location: `${lat},${lng}`,
                radius: radius,
                key: this.googleMapsKey,
                language: 'id'
            };

            if (type) {
                params.type = type;
            }

            const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
                params
            });

            return response.data.results.map(place => ({
                name: place.name,
                types: place.types,
                rating: place.rating,
                address: place.vicinity,
                distance: this.calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng)
            }));
        } catch (error) {
            return [];
        }
    }

    async getNearbyPlacesOverpass(lat, lng, type = null) {
        try {
            // Convert type to OSM amenity
            const osmType = this.convertTypeToOSM(type);

            const query = `
        [out:json][timeout:25];
        (
          node["amenity"~"${osmType}"](around:1000,${lat},${lng});
          way["amenity"~"${osmType}"](around:1000,${lat},${lng});
          relation["amenity"~"${osmType}"](around:1000,${lat},${lng});
        );
        out center meta;
      `;

            const response = await axios.post(this.overpassBaseUrl, query, {
                headers: {
                    'Content-Type': 'text/plain',
                    'User-Agent': 'Cilok Location Toolkit (https://github.com/Cloud-Dark/cilok)'
                }
            });

            const elements = response.data.elements || [];

            return elements
                .filter(element => element.tags && element.tags.name)
                .map(element => {
                    const elementLat = element.lat || (element.center && element.center.lat);
                    const elementLng = element.lon || (element.center && element.center.lon);

                    return {
                        name: element.tags.name,
                        types: [element.tags.amenity, element.tags.cuisine].filter(Boolean),
                        address: this.buildAddressFromTags(element.tags),
                        distance: elementLat && elementLng ?
                            this.calculateDistance(lat, lng, elementLat, elementLng) : null,
                        osm_id: element.id,
                        osm_type: element.type
                    };
                })
                .filter(place => place.distance)
                .sort((a, b) => {
                    const distA = parseFloat(a.distance.replace('m', '').replace('km', '000'));
                    const distB = parseFloat(b.distance.replace('m', '').replace('km', '000'));
                    return distA - distB;
                });

        } catch (error) {
            console.error('Overpass API error:', error.message);
            return [];
        }
    }

    convertTypeToOSM(type) {
        const typeMapping = {
            'restaurant': 'restaurant|cafe|fast_food|food_court',
            'food': 'restaurant|cafe|fast_food|food_court',
            'hospital': 'hospital|clinic|pharmacy',
            'school': 'school|university|college',
            'bank': 'bank|atm',
            'gas_station': 'fuel',
            'shopping': 'marketplace|mall|shop'
        };

        return typeMapping[type] || 'restaurant|cafe|fast_food|bank|hospital|school|fuel';
    }

    buildAddressFromTags(tags) {
        const parts = [];
        if (tags['addr:street']) parts.push(tags['addr:street']);
        if (tags['addr:city']) parts.push(tags['addr:city']);
        if (tags['addr:state']) parts.push(tags['addr:state']);

        return parts.length > 0 ? parts.join(', ') : '';
    }

    async getPlaceDetails(placeId) {
        try {
            const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
                params: {
                    place_id: placeId,
                    key: this.googleMapsKey,
                    fields: 'name,formatted_address,formatted_phone_number,website,opening_hours,rating,reviews',
                    language: 'id'
                }
            });

            return response.data.result;
        } catch (error) {
            return null;
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in kilometers

        if (d < 1) {
            return `${Math.round(d * 1000)}m`;
        } else {
            return `${d.toFixed(1)}km`;
        }
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
}

module.exports = LocationService;