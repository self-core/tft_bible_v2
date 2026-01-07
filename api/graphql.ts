import { ApolloServer } from 'apollo-server-micro';
import { typeDefs } from '../backend-simple/src/schema';
import { resolvers } from '../backend-simple/src/resolvers';
import { NextApiRequest, NextApiResponse } from 'next';

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
});

const startServer = apolloServer.start();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await startServer;
  
  // Handle GraphQL requests using Apollo Server micro adapter
  await apolloServer.createHandler({
    path: '/api/graphql',
  })(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};