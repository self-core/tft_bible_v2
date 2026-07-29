// src/lib/apolloClient.ts
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Determine the GraphQL API URL based on environment
const getGraphqlUrl = () => {
  // Use VITE_GRAPHQL_URL environment variable if available, otherwise fallback
  const envUrl = import.meta.env.VITE_GRAPHQL_URL;
  if (envUrl) {
    return envUrl;
  }

  // Use relative URL for Docker deployment (nginx will proxy to backend)
  // In Docker environment, the frontend and backend will communicate through nginx proxy
  return '/graphql';
};

const httpLink = createHttpLink({
  uri: getGraphqlUrl(),
});

// Request interceptor to add auth headers if needed
const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = localStorage.getItem('auth_token');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});