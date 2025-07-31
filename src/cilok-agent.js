const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const boxen = require('boxen');
require('dotenv').config();

const LocationService = require('./services/location-service');
const AIService = require('./services/ai-service');
const MapService = require('./services/map-service');

class CilokAgent {
    constructor() {
        this.envPath = path.join(process.cwd(), '.env');
        this.locationService = new LocationService();
        this.aiService = new AIService();
        this.mapService = new MapService();
        this.isRunning = false;
        this.debugMode = process.env.CILOK_DEBUG === 'true'; // Enable debug dengan env var
    }

    async start() {
        await this.checkAndSetupEnv();
        await this.initializeServices();
        this.showWelcome();
        await this.startInteractiveSession();
    }

    async checkAndSetupEnv() {
        if (!fs.existsSync(this.envPath)) {
            console.log(chalk.yellow('🔧 Setting up Cilok for the first time...'));
            await this.createEnvFile();
        }

        // Reload environment variables
        require('dotenv').config({ path: this.envPath });

        // Check only for OpenRouter API key (required)
        if (!process.env.OPENROUTER_API_KEY) {
            console.log(chalk.red('❌ Missing OpenRouter API key!'));
            await this.promptForOpenRouterKey();
        }

        // Map services are optional - will use free alternatives
        this.checkMapServices();
    }

    checkMapServices() {
        const hasGoogleMaps = !!process.env.GOOGLE_MAPS_API_KEY;
        const hasMapbox = !!process.env.MAPBOX_API_KEY;

        if (!hasGoogleMaps && !hasMapbox) {
            console.log(chalk.yellow('ℹ️  No premium map APIs detected'));
            console.log(chalk.cyan('🗺️  Using free OpenStreetMap & Nominatim services'));
        } else {
            const services = [];
            if (hasGoogleMaps) services.push('Google Maps');
            if (hasMapbox) services.push('Mapbox');
            console.log(chalk.green(`✅ Premium map services: ${services.join(', ')}`));
        }
    }

    async createEnvFile() {
        const questions = [
            {
                type: 'password',
                name: 'openrouterKey',
                message: 'Enter your OpenRouter API Key:',
                mask: '*',
                validate: (input) => input.length > 0 || 'OpenRouter API Key is required'
            },
            {
                type: 'input',
                name: 'model',
                message: 'Enter AI model (default: google/gemini-2.0-flash-exp:free):',
                default: 'google/gemini-2.0-flash-exp:free'
            },
            {
                type: 'confirm',
                name: 'useMapAPIs',
                message: 'Do you want to add premium map API keys? (Google Maps/Mapbox)',
                default: false
            }
        ];

        const answers = await inquirer.prompt(questions);

        let additionalQuestions = [];
        if (answers.useMapAPIs) {
            additionalQuestions = [
                {
                    type: 'password',
                    name: 'googleMapsKey',
                    message: 'Enter your Google Maps API Key (optional):',
                    mask: '*'
                },
                {
                    type: 'password',
                    name: 'mapboxKey',
                    message: 'Enter your Mapbox API Key (optional):',
                    mask: '*'
                }
            ];

            const mapAnswers = await inquirer.prompt(additionalQuestions);
            Object.assign(answers, mapAnswers);
        }

        const envContent = `
# Cilok Configuration
OPENROUTER_API_KEY=${answers.openrouterKey}
AI_MODEL=${answers.model}

# Map Services (Optional - will use free alternatives if not provided)
GOOGLE_MAPS_API_KEY=${answers.googleMapsKey || ''}
MAPBOX_API_KEY=${answers.mapboxKey || ''}

# Location Services
DEFAULT_COUNTRY=ID
DEFAULT_LANGUAGE=id
USE_FREE_MAPS=true
    `.trim();

        fs.writeFileSync(this.envPath, envContent);
        console.log(chalk.green('✅ Configuration saved to .env file'));
    }

    async promptForOpenRouterKey() {
        const { openrouterKey } = await inquirer.prompt([
            {
                type: 'password',
                name: 'openrouterKey',
                message: 'Enter your OpenRouter API Key:',
                mask: '*',
                validate: (input) => input.length > 0 || 'OpenRouter API Key is required'
            }
        ]);

        // Update .env file
        let envContent = fs.readFileSync(this.envPath, 'utf8');
        envContent = envContent.replace(/OPENROUTER_API_KEY=.*/, `OPENROUTER_API_KEY=${openrouterKey}`);
        fs.writeFileSync(this.envPath, envContent);

        process.env.OPENROUTER_API_KEY = openrouterKey;
    }

    async initializeServices() {
        const spinner = ora('Initializing services...').start();

        try {
            await this.aiService.initialize();
            await this.locationService.initialize();
            await this.mapService.initialize();

            spinner.succeed('Services initialized successfully');
        } catch (error) {
            spinner.fail('Failed to initialize services');
            console.error(chalk.red(error.message));
            process.exit(1);
        }
    }

    showWelcome() {
        const hasGoogleMaps = !!process.env.GOOGLE_MAPS_API_KEY;
        const hasMapbox = !!process.env.MAPBOX_API_KEY;

        let mapServices = [];
        if (hasGoogleMaps) mapServices.push(chalk.green('✓ Google Maps'));
        if (hasMapbox) mapServices.push(chalk.green('✓ Mapbox'));

        // Always available free services
        mapServices.push(chalk.blue('✓ OpenStreetMap'));
        mapServices.push(chalk.blue('✓ Nominatim Geocoding'));

        const welcome = boxen(
            chalk.cyan.bold('🍡 CILOK') + '\n' +
            chalk.white('AI Agent for Location Toolkit\n\n') +
            chalk.gray('Connected to:') + '\n' +
            chalk.green('✓ OpenRouter AI') + '\n' +
            mapServices.join('\n') + '\n\n' +
            chalk.yellow('Type "help" for available commands'),
            {
                padding: 1,
                margin: 1,
                borderStyle: 'round',
                borderColor: 'cyan'
            }
        );

        console.log(welcome);
        console.log(chalk.cyan('Welcome back to Cilok! 🎉\n'));
    }

    // ... rest of the methods remain the same
    async startInteractiveSession() {
        this.isRunning = true;

        while (this.isRunning) {
            const { query } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'query',
                    message: chalk.cyan('🍡 Cilok >'),
                    prefix: ''
                }
            ]);

            if (!query.trim()) continue;

            await this.processQuery(query.trim());
        }
    }

    async testLocationSearch(query) {
        console.log(chalk.cyan(`🧪 Testing location search: "${query}"`));

        try {
            const result = await this.locationService.searchLocation(query);
            console.log(chalk.green('✅ Test successful!'));
            console.log(JSON.stringify(result, null, 2));
        } catch (error) {
            console.log(chalk.red('❌ Test failed!'));
            console.error(error);
        }
    }
    async processQuery(query) {
        const lowerQuery = query.toLowerCase();

        // Handle system commands
        if (lowerQuery === 'exit' || lowerQuery === 'quit') {
            console.log(chalk.yellow('👋 Goodbye!'));
            this.isRunning = false;
            return;
        }

        if (lowerQuery === 'help') {
            this.showHelp();
            return;
        }

        if (lowerQuery === 'clear') {
            console.clear();
            this.showWelcome();
            return;
        }

        if (lowerQuery === 'status') {
            this.showServiceStatus();
            return;
        }

        // Handle travel time queries specially
        if (this.isTravelTimeQuery(query)) {
            await this.handleTravelTimeQuery(query);
            return;
        }

        // Handle hotel/nearby queries specially  
        if (this.isNearbyQuery(query)) {
            await this.handleNearbyQuery(query);
            return;
        }

        // General AI conversation
        const spinner = ora('🤖 AI sedang berpikir...').start();

        try {
            const response = await this.aiService.processLocationQuery(query);
            spinner.stop();

            console.log(chalk.white(response));

            // Check if we need to perform location search
            if (this.needsLocationSearch(query, response)) {
                console.log(chalk.cyan('\n🔍 Memulai pencarian lokasi intelligent...'));
                await this.performIntelligentSearch(query);
            }

        } catch (error) {
            spinner.fail('AI conversation failed');
            console.error(chalk.red(error.message));
        }
    }
    isTravelTimeQuery(query) {
        const travelKeywords = ['berapa jam', 'berapa lama', 'jarak', 'waktu tempuh', 'dari', 'ke'];
        return travelKeywords.some(keyword => query.toLowerCase().includes(keyword));
    }
    extractTravelLocations(query) {
        // Extract "dari X ke Y" pattern
        const patterns = [
            /dari\s+([^ke]+)\s+ke\s+(.+)/i,
            /\b([a-zA-Z\s]+)\s+ke\s+([a-zA-Z\s]+)/i
        ];

        for (const pattern of patterns) {
            const match = query.match(pattern);
            if (match) {
                return {
                    origin: match[1].trim(),
                    destination: match[2].trim().replace(/\?.*$/, '').replace(/berapa.*$/, '').trim()
                };
            }
        }

        return { origin: null, destination: null };
    }
    isNearbyQuery(query) {
        const nearbyKeywords = ['hotel', 'restoran', 'rumah sakit', 'bank', 'terdekat', 'di daerah'];
        return nearbyKeywords.some(keyword => query.toLowerCase().includes(keyword));
    }
    async handleNearbyQuery(query) {
        console.log(chalk.cyan('🏨 Mencari tempat yang Anda inginkan...'));

        const spinner = ora('🔍 AI sedang menganalisis permintaan...').start();

        try {
            const result = await this.aiService.intelligentLocationSearch(query, this.locationService);
            spinner.stop();

            if (result.success) {
                console.log(chalk.green('\n✅ Lokasi ditemukan!'));
                console.log(chalk.white(result.aiResponse));
                console.log('');
                this.displayLocationDetails(result.result);
            } else {
                console.log(chalk.yellow('\n🤔 Lokasi spesifik tidak ditemukan, tapi saya punya saran:'));
                console.log(chalk.white(result.aiResponse));
            }

        } catch (error) {
            spinner.fail('Pencarian gagal');
            console.error(chalk.red(error.message));
        }
    }
    async handleTravelTimeQuery(query) {
        const spinner = ora('🗺️ Menghitung rute dan waktu tempuh...').start();

        try {
            // Extract origin and destination
            const locations = this.extractTravelLocations(query);

            if (locations.origin && locations.destination) {
                // Get coordinates for both locations
                const originCoords = await this.locationService.getCoordinates(locations.origin);
                const destCoords = await this.locationService.getCoordinates(locations.destination);

                // Calculate distance and estimated time
                const distance = this.calculateDistance(
                    originCoords.lat, originCoords.lng,
                    destCoords.lat, destCoords.lng
                );

                const estimatedTime = this.estimateTravelTime(distance);

                spinner.succeed('Rute dihitung!');

                console.log(chalk.cyan('\n🚗 INFORMASI PERJALANAN'));
                console.log(chalk.gray('━'.repeat(40)));
                console.log(chalk.white.bold(`${locations.origin} → ${locations.destination}`));
                console.log(chalk.yellow(`📏 Jarak: ${distance}`));
                console.log(chalk.green(`⏱️  Estimasi waktu: ${estimatedTime}`));
                console.log(chalk.blue(`🗺️  Rute: Jalur tercepat via jalan utama`));

                // Show coordinates
                console.log(chalk.gray(`\n📍 ${locations.origin}: ${originCoords.lat}, ${originCoords.lng}`));
                console.log(chalk.gray(`📍 ${locations.destination}: ${destCoords.lat}, ${destCoords.lng}`));

                // Generate route links
                console.log(chalk.magenta('\n🔗 Link Navigasi:'));
                const googleMapsRoute = `https://maps.google.com/maps/dir/${originCoords.lat},${originCoords.lng}/${destCoords.lat},${destCoords.lng}`;
                console.log(chalk.blue(`• Google Maps: ${googleMapsRoute}`));

                console.log('');

            } else {
                spinner.fail('Lokasi asal atau tujuan tidak terdeteksi');

                // Fallback to AI
                const response = await this.aiService.processLocationQuery(query);
                console.log(chalk.white(response));
            }

        } catch (error) {
            spinner.fail('Gagal menghitung rute');
            console.error(chalk.red(error.message));

            // Fallback to AI
            try {
                const response = await this.aiService.processLocationQuery(query);
                console.log(chalk.white(response));
            } catch (aiError) {
                console.error(chalk.red('AI fallback juga gagal:', aiError.message));
            }
        }
    }
    needsLocationSearch(query, response) {
        const needsSearch = [
            'mencari', 'akan mencari', 'saya akan mencari',
            'detail lokasi', 'koordinat', 'alamat'
        ];

        return needsSearch.some(phrase =>
            response.toLowerCase().includes(phrase)
        );
    }
    estimateTravelTime(distanceStr) {
        const distance = parseFloat(distanceStr.replace(/[^\d.]/g, ''));

        if (distance < 50) {
            return `${Math.round(distance / 25 * 60)} menit - 1.5 jam`;
        } else if (distance < 200) {
            return `${Math.round(distance / 60)} - ${Math.round(distance / 50)} jam`;
        } else {
            return `${Math.round(distance / 70)} - ${Math.round(distance / 50)} jam`;
        }
    }
    showServiceStatus() {
        console.log('\n' + chalk.cyan('🔧 SERVICE STATUS'));
        console.log(chalk.gray('━'.repeat(40)));

        // AI Service
        console.log(chalk.green('✓ OpenRouter AI') + chalk.gray(` (${process.env.AI_MODEL})`));

        // Map Services
        if (process.env.GOOGLE_MAPS_API_KEY) {
            console.log(chalk.green('✓ Google Maps API') + chalk.gray(' (Premium)'));
        } else {
            console.log(chalk.yellow('○ Google Maps API') + chalk.gray(' (Not configured)'));
        }

        if (process.env.MAPBOX_API_KEY) {
            console.log(chalk.green('✓ Mapbox API') + chalk.gray(' (Premium)'));
        } else {
            console.log(chalk.yellow('○ Mapbox API') + chalk.gray(' (Not configured)'));
        }

        console.log(chalk.blue('✓ OpenStreetMap') + chalk.gray(' (Free)'));
        console.log(chalk.blue('✓ Nominatim Geocoding') + chalk.gray(' (Free)'));
        console.log('');
    }

    async handleAIResponse(response) {
        try {
            const data = JSON.parse(response);
            await this.handleStructuredResponse(data);
        } catch (error) {
            // It's a natural text response, handle accordingly
            await this.handleNaturalResponse(response);
        }
    }
    async handleStructuredResponse(data) {
        // Fallback for old JSON format
        switch (data.action) {
            case 'search_location':
                await this.handleLocationSearch(data);
                break;
            case 'get_coordinates':
                await this.handleCoordinatesSearch(data);
                break;
            case 'reverse_geocode':
                await this.handleReverseGeocode(data);
                break;
            case 'nearby_search':
                await this.handleNearbySearch(data);
                break;
            default:
                console.log(chalk.white(data.message || JSON.stringify(data)));
        }
    }
    async handleNaturalResponse(response) {
        console.log(chalk.white(response));

        // Try to detect if this is a location search request
        if (this.isLocationQuery(response)) {
            console.log(chalk.cyan('\n🔍 Memulai pencarian lokasi intelligent...'));
            await this.performIntelligentSearch(response);
        }
    }
    async performIntelligentSearch(query) {
        const spinner = ora('🤖 AI sedang berpikir keras mencari lokasi...').start();

        try {
            const result = await this.aiService.intelligentLocationSearch(query, this.locationService);
            spinner.stop();

            if (result.success) {
                console.log(chalk.green(`\n🎉 Berhasil ditemukan setelah ${result.attempt} percobaan!`));
                console.log(chalk.gray(`Search query: "${result.searchQuery}"`));
                console.log('');

                // Show AI's natural response first
                console.log(chalk.white(result.aiResponse));
                console.log('');

                // Then show detailed location info
                this.displayLocationDetails(result.result);

            } else {
                console.log(chalk.yellow(`\n🤔 Setelah ${result.attempts} percobaan, lokasi tidak ditemukan.`));
                console.log('');
                console.log(chalk.white(result.aiResponse));

                if (result.searchHistory.length > 0) {
                    console.log(chalk.gray('\n📝 Riwayat pencarian:'));
                    result.searchHistory.forEach((search, index) => {
                        console.log(chalk.gray(`  ${index + 1}. "${search.query}" - ${search.error}`));
                    });
                }
            }

        } catch (error) {
            spinner.fail('Intelligent search failed');
            console.error(chalk.red(error.message));
        }
    }

    isLocationQuery(text) {
        const locationKeywords = [
            'mencari', 'lokasi', 'tempat', 'alamat', 'koordinat',
            'detail', 'dimana', 'letak', 'berada', 'transcosmos',
            'hotel', 'rumah sakit', 'restoran', 'bank'
        ];

        return locationKeywords.some(keyword =>
            text.toLowerCase().includes(keyword)
        );
    }
    async handleLocationSearch(data) {
        const spinner = ora('📍 Searching location...').start();

        try {
            // Debug log
            console.log('\n[DEBUG] Search parameters:', data.parameters);

            const locationQuery = data.parameters.location || data.parameters.query;
            if (!locationQuery) {
                throw new Error('No location query provided');
            }

            const locationData = await this.locationService.searchLocation(locationQuery);
            spinner.succeed('Location found!');

            this.displayLocationDetails(locationData);

        } catch (error) {
            spinner.fail(`Location search failed: ${error.message}`);
            console.error(chalk.red('Error details:', error));

            // Fallback: try to search with raw query
            if (data.query && data.query !== data.parameters.location) {
                console.log(chalk.yellow('🔄 Trying alternative search...'));
                try {
                    const fallbackResult = await this.locationService.searchLocation(data.query);
                    this.displayLocationDetails(fallbackResult);
                } catch (fallbackError) {
                    console.error(chalk.red('Fallback search also failed:', fallbackError.message));
                }
            }
        }
    }

    async handleCoordinatesSearch(data) {
        const spinner = ora('🎯 Getting coordinates...').start();

        try {
            const coords = await this.locationService.getCoordinates(data.parameters.address);
            spinner.succeed('Coordinates found!');

            this.displayCoordinates(coords);

        } catch (error) {
            spinner.fail('Failed to get coordinates');
            console.error(chalk.red(error.message));
        }
    }

    async handleReverseGeocode(data) {
        const spinner = ora('🗺️  Reverse geocoding...').start();

        try {
            const location = await this.locationService.reverseGeocode(data.parameters.lat, data.parameters.lng);
            spinner.succeed('Location identified!');

            this.displayLocationDetails(location);

        } catch (error) {
            spinner.fail('Reverse geocoding failed');
            console.error(chalk.red(error.message));
        }
    }

    async handleNearbySearch(data) {
        const spinner = ora('🔍 Searching nearby places...').start();

        try {
            const places = await this.locationService.searchNearby(
                data.parameters.location,
                data.parameters.type || 'restaurant'
            );
            spinner.succeed('Nearby places found!');

            this.displayNearbyPlaces(places);

        } catch (error) {
            spinner.fail('Nearby search failed');
            console.error(chalk.red(error.message));
        }
    }

    displayLocationDetails(location) {
        console.log('\n' + chalk.cyan('📍 DETAIL LOKASI'));
        console.log(chalk.gray('━'.repeat(50)));

        console.log(chalk.white.bold(`🏢 ${location.name}`));
        console.log(chalk.gray(`📮 ${location.formatted_address}`));

        if (location.coordinates) {
            console.log(chalk.yellow(`🎯 Koordinat: ${location.coordinates.lat}, ${location.coordinates.lng}`));
        }

        if (location.types && location.types.length > 0) {
            console.log(chalk.blue(`🏷️  Kategori: ${location.types.join(', ')}`));
        }

        if (location.rating) {
            const stars = '⭐'.repeat(Math.floor(location.rating));
            console.log(chalk.green(`${stars} Rating: ${location.rating}/5`));
        }

        if (location.nearby && location.nearby.length > 0) {
            console.log(chalk.green('\n🏪 Tempat Terdekat:'));
            location.nearby.forEach((place, index) => {
                const icon = this.getPlaceIcon(place.types);
                console.log(chalk.white(`  ${icon} ${place.name} ${place.distance ? `(${place.distance})` : ''}`));
            });
        }

        if (location.coordinates) {
            console.log(chalk.magenta('\n🗺️ Akses Cepat:'));
            this.mapService.generateLocationLinks(location.coordinates.lat, location.coordinates.lng);
        }

        // Add practical info
        console.log(chalk.cyan('\n💡 Tips:'));
        console.log(chalk.gray('• Gunakan QR code untuk navigasi langsung'));
        console.log(chalk.gray('• Simpan koordinat untuk referensi'));
        console.log(chalk.gray('• Periksa jam operasional sebelum berkunjung'));

        console.log('');
    }
    getPlaceIcon(types) {
        if (!types || types.length === 0) return '📍';

        const iconMap = {
            restaurant: '🍽️',
            food: '🍽️',
            cafe: '☕',
            hospital: '🏥',
            pharmacy: '💊',
            bank: '🏦',
            atm: '💳',
            school: '🏫',
            university: '🎓',
            hotel: '🏨',
            gas_station: '⛽',
            fuel: '⛽',
            shopping: '🛍️',
            mall: '🏬'
        };

        for (const type of types) {
            if (iconMap[type]) return iconMap[type];
        }

        return '📍';
    }

    displayCoordinates(coords) {
        console.log('\n' + chalk.cyan('🎯 COORDINATES'));
        console.log(chalk.gray('━'.repeat(30)));
        console.log(chalk.yellow(`Latitude: ${coords.lat}`));
        console.log(chalk.yellow(`Longitude: ${coords.lng}`));
        if (coords.accuracy) {
            console.log(chalk.blue(`Accuracy: ${coords.accuracy}`));
        }

        console.log(chalk.magenta('\n📱 Links & QR Code:'));
        this.mapService.generateLocationLinks(coords.lat, coords.lng);
        console.log('');
    }

    displayNearbyPlaces(places) {
        console.log('\n' + chalk.cyan('🏪 NEARBY PLACES'));
        console.log(chalk.gray('━'.repeat(40)));

        places.forEach((place, index) => {
            console.log(chalk.white.bold(`${index + 1}. ${place.name}`));
            if (place.address) {
                console.log(chalk.gray(`   📍 ${place.address}`));
            }
            if (place.distance) {
                console.log(chalk.blue(`   📏 ${place.distance}`));
            }
            if (place.types && place.types.length > 0) {
                console.log(chalk.yellow(`   🏷️  ${place.types.slice(0, 3).join(', ')}`));
            }
            console.log('');
        });
    }

    showHelp() {
        const help = boxen(
            chalk.cyan.bold('🍡 CILOK COMMANDS\n\n') +
            chalk.white('Location Queries:') + '\n' +
            chalk.gray('• "tampilkan detail lokasi [nama tempat]"') + '\n' +
            chalk.gray('• "koordinat dari [alamat]"') + '\n' +
            chalk.gray('• "lokasi dari koordinat [lat, lng]"') + '\n' +
            chalk.gray('• "tempat makan terdekat dari [lokasi]"') + '\n\n' +
            chalk.white('System Commands:') + '\n' +
            chalk.gray('• help - Show this help') + '\n' +
            chalk.gray('• status - Show service status') + '\n' +
            chalk.gray('• clear - Clear screen') + '\n' +
            chalk.gray('• exit/quit - Exit Cilok'),
            {
                padding: 1,
                borderStyle: 'round',
                borderColor: 'blue'
            }
        );

        console.log(help);
    }
}

module.exports = CilokAgent;