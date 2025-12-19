# TFT Bible - Simplified Architecture

A comprehensive Teamfight Tactics (TFT) companion application built with Node.js and GraphQL in a simplified single-backend architecture optimized for easy deployment on Vercel or Railway.

## 🏗️ Architecture

- **Architecture**: Simplified single backend service with GraphQL API
- **Backend**: Node.js with TypeScript, Apollo Server, Express.js
- **API**: Single GraphQL endpoint at `/graphql` with comprehensive schema
- **Database**: MongoDB for data persistence (configurable)
- **Frontend**: React frontend with Apollo Client for GraphQL integration
- **Deployment**: Optimized for Vercel Serverless Functions or Railway container
- **Development**: Simple Node.js environment with npm/yarn

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/self-core/tft_bible_v2.git
   cd tft_bible_v2
   ```

2. **Install backend dependencies**
   ```bash
   cd backend-simple
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env to include your MongoDB connection string
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the API**
   - GraphQL Playground: http://localhost:4000/graphql
   - Health check: http://localhost:4000/health

## 🔧 Running in Production

### With Node.js
```bash
npm run build
npm start
```

### With Docker
```bash
docker build -t tft-bible-backend .
docker run -p 4000:4000 tft-bible-backend
```

### Environment Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/tft_bible_simple

# Server
PORT=4000

# For Railway deployment
MONGO_CONNECTION_STRING=your-mongodb-connection-string
```

## 📁 Project Structure

```
tft_bible_v2/
├── backend-simple/             # Simplified Node.js backend
│   ├── src/                   # Source code
│   │   ├── server.ts          # Express + Apollo server
│   │   ├── schema.ts          # GraphQL schema definition
│   │   ├── resolvers.ts       # GraphQL resolvers
│   │   ├── interfaces.ts      # TypeScript interfaces
│   │   └── types/             # TypeScript types
│   ├── package.json           # Dependencies and scripts
│   ├── tsconfig.json          # TypeScript configuration
│   ├── Dockerfile             # Docker build
│   └── .env.example           # Environment variables example
├── microservices/
│   └── frontend-service/      # React frontend
├── vercel.json               # Vercel deployment configuration
├── railway.config.yml        # Railway deployment configuration
└── README.md                 # This file
```

## 🚀 Deployment

### Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect and deploy the Node.js application
3. Add environment variables in Vercel dashboard

### Deploy to Railway
1. Connect your GitHub repository to Railway
2. Railway will automatically build and deploy from the Dockerfile
3. Add environment variables in Railway dashboard

## 🤝 Contributing

Please read the contributing guidelines in the main repository for details on our code of conduct and the process for submitting pull requests.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔄 Current Status

- ✅ Simplified architecture implemented
- ✅ Comprehensive GraphQL API with champions, traits, items, and compositions
- ✅ Realistic TFT data based on Set 16 and current meta
- ✅ Optimized for Vercel and Railway deployment
- ✅ Complete frontend integration with Apollo Client
- ✅ Comprehensive data models with realistic TFT content
- ✅ Ready for production deployment
- ✅ Support for Lore & Legends (Set 16) content