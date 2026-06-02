import 'reflect-metadata';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { container } from './services/container';
import { MetaService } from './services/MetaService';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tft_bible_simple';

async function startServer() {
  const app: any = express();

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
    process.exit(1); // Exit if database connection fails
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

  // Schedule meta data refresh
  const metaService = container.resolve(MetaService);
  const currentSetId = parseInt(process.env.TFT_CURRENT_SET || '17', 10);

  // Initial meta refresh on startup (non-blocking)
  if (process.env.RIOT_API_KEY) {
    metaService.refreshMetaData(currentSetId).catch(err => console.warn('Initial meta refresh failed:', err instanceof Error ? err.message : String(err)));

    // Schedule refresh — wait for completion before scheduling next cycle
    const scheduleNext = () => {
      setTimeout(async () => {
        try {
          await metaService.refreshMetaData(currentSetId);
        } catch (err) {
          console.warn('Scheduled meta refresh failed:', err instanceof Error ? err.message : String(err));
        }
        scheduleNext();
      }, 6 * 60 * 60 * 1000);
    };
    scheduleNext();
  }

  // Basic health check endpoint
  app.get('/health', (_req: any, res: any) => {
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