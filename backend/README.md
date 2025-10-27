# Kerala Horizon Backend API

A comprehensive backend system for the Kerala Horizon travel companion application, providing RESTful APIs for all travel-related features.

## 🚀 Features

### Core Services
- **Authentication & Authorization** - Firebase Auth integration
- **Transport & Connectivity** - Real-time bus tracking, train schedules, flight status
- **Accommodation Management** - Hotel booking, homestay listings, QR check-in
- **Food & Cuisine** - Restaurant discovery, safety ratings, cooking classes
- **Digital Wallet** - UPI, card payments, Razorpay/Stripe integration
- **AI-Powered Features** - Smart recommendations, language assistance
- **Emergency Services** - SOS alerts, safety tools, disaster management

### Technical Features
- **RESTful API Design** - Clean, consistent endpoints
- **Real-time Data** - Live transport tracking, weather updates
- **Payment Integration** - Multiple payment gateways
- **Security** - JWT authentication, rate limiting, data encryption
- **Caching** - Redis and Node.js caching for performance
- **Monitoring** - Comprehensive logging and error tracking

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Cache**: Redis + Node Cache
- **Authentication**: Firebase Auth
- **Payments**: Razorpay, Stripe
- **APIs**: Google Maps, OpenWeather, KSRTC, IRCTC
- **Deployment**: Docker, Nginx

## 📦 Installation

### Prerequisites
- Node.js 18+
- Redis server
- Firebase project
- API keys for external services

### Setup

1. **Clone and Install**
```bash
cd backend
npm install
```

2. **Environment Configuration**
```bash
cp config.example.js .env
# Update .env with your actual values
```

3. **Firebase Setup**
- Create a Firebase project
- Enable Firestore and Authentication
- Generate service account key
- Update Firebase configuration in .env

4. **Start Development Server**
```bash
npm run dev
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Transport & Connectivity
- `GET /api/transport/location` - Get nearby transport
- `GET /api/transport/bus/tracking` - Real-time bus tracking
- `GET /api/transport/train/schedules` - Train schedules
- `GET /api/transport/flight/status` - Flight status
- `GET /api/transport/route/plan` - Route planning

### Accommodation
- `GET /api/stay/search` - Search accommodations
- `POST /api/stay/:id/book` - Book accommodation
- `POST /api/stay/:id/checkin` - QR/Aadhaar check-in
- `GET /api/stay/emergency/suggestions` - Emergency stay

### Food & Cuisine
- `GET /api/food/restaurants/search` - Search restaurants
- `GET /api/food/cuisine/guide` - Cuisine guide
- `POST /api/food/ai/suggestions` - AI dish suggestions
- `GET /api/food/cooking/classes` - Cooking classes

### Digital Wallet
- `GET /api/wallet/balance` - Wallet balance
- `POST /api/wallet/add-money` - Add money to wallet
- `POST /api/wallet/pay` - Make payment
- `POST /api/wallet/upi/pay` - UPI payment
- `POST /api/wallet/card/pay` - Card payment

## 🔐 Security

- **Authentication**: Firebase JWT tokens
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS**: Configured for frontend domain
- **Helmet**: Security headers
- **Input Validation**: Express-validator
- **Data Encryption**: Sensitive data encrypted

## 📊 Monitoring

- **Logging**: Winston with file and console outputs
- **Error Tracking**: Comprehensive error handling
- **Health Checks**: `/health` endpoint
- **Performance**: Request duration tracking

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
```bash
# Install dependencies
npm install --production

# Start server
npm start
```

## 🔧 Configuration

### Environment Variables
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `FIREBASE_*` - Firebase configuration
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `RAZORPAY_*` - Razorpay payment gateway
- `STRIPE_*` - Stripe payment gateway

### API Keys Required
- Google Maps API
- Google Places API
- OpenWeather API
- KSRTC API (if available)
- IRCTC API (if available)
- Razorpay/Stripe keys

## 📈 Performance

- **Caching**: Redis for session and data caching
- **Compression**: Gzip compression enabled
- **Rate Limiting**: Prevents API abuse
- **Connection Pooling**: Database connection optimization

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📝 API Documentation

### Request/Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Kerala Horizon Backend** - Powering Kerala's digital tourism experience










