Kerala Horizon

Kerala Horizon is a full-stack, TypeScript-based travel companion web application designed to enhance tourism experiences across Kerala. The platform integrates trip planning, transportation systems, accommodation discovery, cultural exploration, sustainability tracking, and safety tools within a modular and scalable architecture.

The system is built primarily using TypeScript and React, with Firebase services and Node.js backend support.

Technology Stack
Primary Languages

TypeScript (69%)

JavaScript (26%)

HTML / CSS

Shell scripting

Dockerfile configuration

Frontend

React (TypeScript-based)

Tailwind CSS

React Router DOM

Framer Motion

React i18next (Internationalization)

Backend

Node.js API (backend directory)

Firebase Authentication

Firestore Database

Firebase Storage

Firebase Hosting

Firebase Cloud Functions (optional deployment)

External Integrations (Configurable)

Google Maps API

Google Places API

OpenWeather API

OpenAI API

Razorpay

Stripe

Architecture Overview

Kerala Horizon follows a modular feature-based architecture:

Component-driven UI structure

Context-based theme management

Internationalization with RTL support

Cloud-based backend infrastructure

Environment-based configuration

Scalable module separation

Core Modules

The application is organized into structured feature modules:

Transport and Connectivity

Stay and Accommodation

Food and Local Cuisine

Culture and Experiences

Sustainability Tracking

Community Features

AI Travel Tools

Trip Planning System

Digital Wallet

Emergency and SOS Tools

Shopping and Marketplace

Settings and Localization

Each module is implemented inside the /src/components/Features directory.

Multilingual Support

The platform supports internationalization using React i18next.

Supported languages:

English

Malayalam

Hindi

Tamil

Arabic (RTL supported)

German

Project Structure
src/
├── components/
│   ├── Layout/
│   └── Features/
├── contexts/
├── i18n/
├── firebase.js
├── App.js / App.tsx
└── index.js / index.tsx

Backend:

backend/
└── server.js
Installation
Prerequisites

Node.js 16+

npm or yarn

Firebase project configuration

Frontend Setup
git clone https://github.com/abhi-s-aji/kerala_horizon.git
cd kerala_horizon
npm install
npm start

The application runs at:

http://localhost:3000

Backend Setup
cd backend
npm install
node server.js

Backend API runs at:

http://localhost:5000

Environment Variables

Create a .env file in the backend directory:

NODE_ENV=development
PORT=5000
FIREBASE_PROJECT_ID=your_project_id
JWT_SECRET=your_secret_key
GOOGLE_MAPS_API_KEY=your_key
OPENWEATHER_API_KEY=your_key
OPENAI_API_KEY=your_key
Deployment
Frontend (Firebase Hosting)
npm run build
firebase deploy
Backend

Deploy using:

Firebase Functions
or

Google Cloud Run
or

Any Node.js hosting provider

Security Features

Firebase Authentication

JWT-based authentication system

Environment-based secret management

Secure API configuration

HTTPS deployment via Firebase

Design Principles

Mobile-first responsive design

Modular, scalable structure

TypeScript-first development

Internationalization-ready architecture

Accessibility-conscious UI

Performance-optimized build

Author

Abhi S Aji
B.Tech Computer Science and Software Engineering Student
