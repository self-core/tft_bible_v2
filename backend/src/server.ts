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
import { SetDataService } from './services/SetDataService';
import { imageProxyHandler } from './routes/imageProxy';

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

  // Connect to MongoDB (non-fatal — embedded fallback data is available)
  let mongoConnected = false;
  try {
    await mongoose.connect(MONGODB_URI);
    mongoConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.warn('MongoDB not available, using embedded fallback data:', error instanceof Error ? error.message : String(error));
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
  const setDataService = container.resolve(SetDataService);
  try {
    await setDataService.initialize();
  } catch (err) {
    console.warn('SetDataService initialization failed (will retry on demand):', err instanceof Error ? err.message : String(err));
  }
  const currentSetData = await setDataService.getSetData().catch(() => null);
  const currentSetId = currentSetData?.setId || 18;

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

  // Image proxy endpoint — caches CDN images to disk
  app.get('/api/images/proxy', imageProxyHandler);

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