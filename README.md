# TFT Bible - Scalable Set-Based Architecture

A comprehensive Teamfight Tactics (TFT) companion application built with Node.js and GraphQL following a scalable set-based architecture designed to evolve with each new TFT set. Optimized for easy deployment on Vercel or Railway.

## 🏗️ Architecture

- **Architecture**: Set-based document architecture supporting multiple TFT sets
- **Backend**: Node.js with TypeScript, Apollo Server, Express.js
- **API**: Single GraphQL endpoint at `/graphql` with comprehensive schema
- **Data Model**: Flexible document-per-set structure for easy evolution
- **Frontend**: React frontend with Apollo Client for GraphQL integration
- **Deployment**: Optimized for Vercel Serverless Functions or Railway container
- **Development**: Simple Node.js environment with npm/yarn

## 🎯 Set-Based Design Philosophy

The architecture follows a **document-per-set** approach ensuring that changes in future TFT sets do not break historical data:

- **Set Documents**: Each TFT set (e.g., Set 12, Set 16) stored as a complete document
- **Versioned IDs**: Champion IDs prefixed with set numbers (e.g. `TFT16_Ahri`)
- **Flexible Traits**: Trait breakpoints defined per set with evolving mechanics
- **Scalable Structure**: Easy to add new sets without affecting existing data

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

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Access the API**
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
# Server
PORT=4000
```

## 📁 Project Structure

```
tft_bible_v2/
├── backend-simple/             # Set-based Node.js backend
│   ├── src/                   # Source code
│   │   ├── server.ts          # Express + Apollo server
│   │   ├── schema.ts          # GraphQL schema definition
│   │   ├── resolvers.ts       # GraphQL resolvers with set-based data
│   │   ├── interfaces.ts      # TypeScript interfaces for set architecture
│   │   └── types/             # TypeScript types
│   ├── package.json           # Dependencies and scripts
│   ├── tsconfig.json          # TypeScript configuration
│   ├── Dockerfile             # Docker build
│   └── .env.example           # Environment variables example
├── microservices/
│   └── frontend-service/      # React frontend
├── docs/                      # Documentation including schema design
├── data/                      # TFT data files
├── scripts/                   # Utility scripts
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

## 📊 API Endpoints

### GraphQL Schema
- `champions`: All champions in the current set
- `championsBySet(setId: Int!)`: Champions for a specific set
- `champion(id: ID!)`: Specific champion by ID
- `traits`: All trait definitions
- `trait(key: String!)`: Specific trait by key
- `items`: All items in the current set
- `item(id: ID!)`: Specific item by ID
- `sets`: All TFT sets
- `set(setId: Int!)`: Specific set by ID
- `compositions`: All compositions
- `compositionsBySet(setId: Int!)`: Compositions for a specific set
- `composition(id: ID!)`: Specific composition by ID
- `search(searchTerm: String!)`: Search across all entities

## 🤝 Contributing

Please read the contributing guidelines in the main repository for details on our code of conduct and the process for submitting pull requests.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔄 Current Status

- ✅ Set-based architecture implemented
- ✅ Flexible schema supporting multiple TFT sets
- ✅ Realistic TFT data based on Set 16 and current meta
- ✅ Optimized for Vercel and Railway deployment
- ✅ Complete frontend integration with Apollo Client
- ✅ Comprehensive data models with set evolution capability
- ✅ Ready for production deployment
- ✅ Support for Lore & Legends (Set 16) content
- ✅ Scalable for future TFT sets