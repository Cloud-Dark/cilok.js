# 🍡 Cilok - AI Location Toolkit

> **Smart CLI Agent for Intelligent Location Discovery**

Cilok adalah AI agent berbasis CLI yang menggunakan kecerdasan buatan untuk membantu pencarian lokasi, navigasi, dan eksplorasi tempat dengan dukungan multiple map services.

![Cilok Demo](https://img.shields.io/badge/Status-Active-brightgreen) ![Node.js](https://img.shields.io/badge/Node.js-18+-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🤖 AI-Powered Intelligence
- **Natural Language Processing** - Berbicara dengan AI dalam bahasa natural
- **Intelligent Retry System** - AI akan mencoba 3x dengan strategi berbeda jika lokasi tidak ditemukan
- **Creative Search** - AI akan mencari variasi nama, singkatan, dan alternatif lokasi
- **Contextual Responses** - Jawaban yang relevan dan informatif

### 🗺️ Multi-Platform Map Integration
- **Free Services** (No API Key Required)
  - ✅ OpenStreetMap
  - ✅ Nominatim Geocoding
  - ✅ Overpass API
  - ✅ Open-Elevation
- **Premium Services** (Optional)
  - 🔑 Google Maps API
  - 🔑 Mapbox API

### 📍 Location Capabilities
- **Location Search** - Cari detail lokasi dengan nama
- **Geocoding/Reverse Geocoding** - Convert alamat ↔ koordinat
- **Travel Time Calculation** - Hitung jarak dan estimasi waktu tempuh
- **Nearby Places** - Temukan tempat terdekat (hotel, restoran, dll)
- **QR Code Generation** - Generate QR code untuk navigasi
- **Multi-Map Links** - Link ke berbagai map services

## 🚀 Installation

### Global Installation
```bash
npm install -g cilok.js
```

### Local Development
```bash
git clone https://github.com/Cloud-Dark/cilok
cd cilok
npm install
npm link
```

## 🎯 Quick Start

```bash
cilok
```

### First Run Setup
Pada penggunaan pertama, Cilok akan meminta konfigurasi:

**Required:**
- ✅ **OpenRouter API Key** - Untuk AI engine

**Optional (akan menggunakan free alternatives jika kosong):**
- 🔑 Google Maps API Key
- 🔑 Mapbox API Key

### Example Interaction
```
🍡 Cilok > tampilkan detail lokasi mall ambasador indonesia

🤖 AI sedang berpikir keras mencari lokasi...

🔍 Attempt 1/3: Searching with AI intelligence...
🤖 AI suggests searching for: mall ambasador Indonesia, PT mall ambasador Indonesia, mall ambasador Jakarta
✅ Found location: PT mall ambasador Indonesia

🎉 Berhasil ditemukan setelah 2 percobaan!

📍 DETAIL LOKASI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 PT mall ambasador Indonesia
📮 Jl. TB Simatupang No.26, Jakarta Selatan, DKI Jakarta
🎯 Koordinat: -6.2608, 106.7884
🏷️  Kategori: office, corporate
```

## 💬 Usage Examples

### Location Search
```bash
🍡 Cilok > tampilkan detail lokasi Monas
🍡 Cilok > dimana lokasi mall ambasador Indonesia?
🍡 Cilok > alamat lengkap Grand Indonesia
```

### Travel Planning
```bash
🍡 Cilok > dari Jakarta ke Bandung berapa jam?
🍡 Cilok > jarak dari Surabaya ke Malang?
🍡 Cilok > rute tercepat Johor Bahru ke Kuala Lumpur?
```

### Nearby Search
```bash
🍡 Cilok > hotel terdekat dari KLCC
🍡 Cilok > restoran halal di sekitar Orchard Road
🍡 Cilok > rumah sakit terdekat dari Thamrin
🍡 Cilok > bank di daerah Sudirman
```

### Coordinates
```bash
🍡 Cilok > koordinat dari Borobudur
🍡 Cilok > lokasi dari koordinat -6.2088, 106.8456
🍡 Cilok > convert alamat Plaza Indonesia ke koordinat
```

## 🔧 Commands

### System Commands
- `help` - Tampilkan bantuan
- `status` - Status layanan yang tersedia
- `debug` - Toggle debug mode
- `clear` - Bersihkan layar
- `exit` / `quit` - Keluar dari aplikasi

### Query Examples
**Berbagai cara bertanya yang didukung:**
- "Detail lokasi [nama tempat]"
- "Koordinat [alamat]"
- "Dari [asal] ke [tujuan] berapa jam?"
- "[jenis tempat] terdekat dari [lokasi]"
- "Hotel di daerah [area]"
- "Alamat lengkap [nama tempat]"

## 🔐 Configuration

### Environment Variables
```env
# Required - AI Engine
OPENROUTER_API_KEY=your_openrouter_api_key

# Optional - Premium Map Services
GOOGLE_MAPS_API_KEY=your_google_maps_key
MAPBOX_API_KEY=your_mapbox_key

# AI Model Selection
AI_MODEL=google/gemini-2.0-flash-exp:free

# Location Settings
DEFAULT_COUNTRY=ID
DEFAULT_LANGUAGE=id
USE_FREE_MAPS=true
```

### Supported AI Models
Via OpenRouter:
- `google/gemini-2.0-flash-exp:free` (default, gratis)
- `openai/gpt-4-turbo`
- `anthropic/claude-3-sonnet`
- `meta-llama/llama-3.1-8b-instruct:free`
- `mistral/mistral-7b-instruct:free`

## 🧠 How It Works

### Intelligent Search Flow
```
User Query → AI Analysis → Location Search
     ↓              ↓             ↓
  Retry 1     Extract Names    Not Found?
     ↓              ↓             ↓
  Retry 2     Try Variations   Still Not Found?
     ↓              ↓             ↓
  Retry 3     Creative Search  Suggest Alternatives
```

### AI Intelligence Features
1. **Query Understanding** - Memahami intent dari pertanyaan natural
2. **Name Variations** - Mencoba singkatan, nama lengkap, alternatif
3. **Context Learning** - Belajar dari kesalahan pencarian sebelumnya
4. **Fallback Suggestions** - Memberikan alternatif jika tidak ditemukan

## 📱 Output Features

### Rich Information Display
- 📍 **Location Details** - Nama, alamat, koordinat
- 🗺️ **Multiple Map Links** - OSM, Google, Bing, WikiMapia
- 📱 **QR Code** - Quick access ke maps
- 🏪 **Nearby Places** - POI terdekat dengan jarak
- 🚗 **Travel Information** - Rute dan estimasi waktu

### Map Services Integration
```
Premium APIs Available:
✓ Google Maps (detailed info, places, reviews)
✓ Mapbox (custom styling, advanced routing)

Free Alternatives (always available):
✓ OpenStreetMap (community-driven map data)
✓ Nominatim (OSM geocoding service)
✓ Overpass API (POI and nearby search)
✓ Open-Elevation (elevation data)
```

## 🛠️ Development

### Project Structure
```
cilok/
├── bin/
│   └── cilok.js              # CLI entry point
├── src/
│   ├── cilok-agent.js        # Main application logic
│   ├── services/
│   │   ├── ai-service.js     # AI integration & retry logic
│   │   ├── location-service.js # Map services integration
│   │   └── map-service.js    # Map links & QR generation
│   └── utils/
│       └── free-maps.js      # Free map services utilities
├── package.json
└── README.md
```

### Development Setup
```bash
# Clone repository
git clone https://github.com/Cloud-Dark/cilok
cd cilok

# Install dependencies
npm install

# Link for development
npm link

# Run
cilok

# Enable debug mode
export CILOK_DEBUG=true
cilok
```

### Testing
```bash
# Test specific functions
🍡 Cilok > debug                    # Enable debug mode
🍡 Cilok > test mall ambasador         # Test location search
🍡 Cilok > status                   # Check service status
```

## 🌟 Advanced Features

### Intelligent Retry System
Cilok menggunakan AI untuk retry dengan strategi berbeda:
- **Attempt 1**: Pencarian normal dengan query asli
- **Attempt 2**: AI mencoba variasi nama dan singkatan
- **Attempt 3**: Pencarian kreatif dengan konteks dan alternatif

### Free Map Alternatives
Jika tidak ada premium API key:
- Otomatis menggunakan OpenStreetMap ecosystem
- Nominatim untuk geocoding
- Overpass API untuk nearby search
- Tetap mendapat informasi lengkap

### Natural Language Processing
- Memahami bahasa Indonesia natural
- Support berbagai format pertanyaan
- Contextual responses
- Conversational interaction

## 📊 Performance

### Response Times
- **AI Processing**: ~2-3 detik
- **Location Search**: ~1-2 detik  
- **Retry Attempts**: ~5-10 detik total
- **Map Generation**: <1 detik

### API Rate Limits
- **OpenRouter**: Tergantung plan
- **Google Maps**: 25,000 requests/day (free tier)
- **Nominatim**: 1 request/second
- **Overpass**: No strict limits

## 🤝 Contributing

Kontribusi sangat diterima! Silakan:

1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

### Development Guidelines
- Gunakan ES6+ syntax
- Tambahkan error handling
- Update dokumentasi
- Test pada berbagai skenario

## 🐛 Troubleshooting

### Common Issues

**❌ "OpenRouter API key not found"**
```bash
# Set API key in .env file
echo "OPENROUTER_API_KEY=your_key_here" >> .env
```

**❌ "Location not found after 3 attempts"**
- Coba query dengan nama yang lebih spesifik
- Gunakan nama alternatif atau singkatan
- Periksa ejaan nama tempat

**❌ "Service timeout"**
- Periksa koneksi internet
- Coba lagi beberapa saat
- Enable debug mode untuk detail error

### Debug Mode
```bash
🍡 Cilok > debug                 # Toggle debug mode
🍡 Cilok > status                # Check service status
export CILOK_DEBUG=true          # Enable via environment
```

## 📈 Roadmap

### Version 2.0 (Coming Soon)
- [ ] **Route Planning** - Multi-point routing
- [ ] **Weather Integration** - Cuaca lokasi real-time
- [ ] **Traffic Information** - Data lalu lintas
- [ ] **Photo Integration** - Street View images
- [ ] **Business Hours** - Jam operasional tempat
- [ ] **Reviews & Ratings** - User reviews
- [ ] **Export Functions** - JSON/CSV export
- [ ] **History & Favorites** - Bookmark & riwayat
- [ ] **Multi-language** - English support
- [ ] **Voice Commands** - Speech-to-text
- [ ] **Offline Mode** - Cached data support

### Version 3.0 (Future)
- [ ] **Machine Learning** - Personalized recommendations  
- [ ] **Real-time Collaboration** - Share locations
- [ ] **Augmented Reality** - AR navigation
- [ ] **IoT Integration** - Smart city data
- [ ] **API Endpoints** - REST API for developers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Cloud-Dark**
- GitHub: [@Cloud-Dark](https://github.com/Cloud-Dark)
- Repository: [cilok](https://github.com/Cloud-Dark/cilok)

## 🙏 Acknowledgments

- **OpenRouter** - AI model access
- **OpenStreetMap** - Free map data
- **Nominatim** - Geocoding services
- **Google Maps** - Premium location services
- **Mapbox** - Advanced mapping features

## 📞 Support

Butuh bantuan? 
- 🐛 [Report Issues](https://github.com/Cloud-Dark/cilok/issues)
- 💬 [Discussions](https://github.com/Cloud-Dark/cilok/discussions)
- 📧 Contact: [Your Email]

---

<div align="center">

**Made with ❤️ in Indonesia**

[⭐ Star this project](https://github.com/Cloud-Dark/cilok) | [🍴 Fork](https://github.com/Cloud-Dark/cilok/fork) | [📝 Issues](https://github.com/Cloud-Dark/cilok/issues)

</div>