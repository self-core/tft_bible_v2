import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tft_bible_simple';

async function startServer() {
  const app = express();

  // Apply middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // Context function to pass data to resolvers
      return {};
    },
  });

  await server.start();

  // Apply Apollo GraphQL middleware
  server.applyMiddleware({ app, path: '/graphql' });

  // Basic health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', service: 'TFT Bible Backend' });
  });

  // Start the server
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`📊 Health check at http://localhost:${PORT}/health`);
    console.log(`📋 GraphQL Playground at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});