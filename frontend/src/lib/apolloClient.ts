// src/lib/apolloClient.ts
import {
  ApolloClient,
  ApolloLink,
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

// The schema exposes Set.status as an uppercase enum; the app contract is lowercase.
const normalizeSetStatus = new ApolloLink((operation, forward) =>
  forward(operation).map((response) => {
    const data = response.data as
      | { sets?: unknown[]; set?: { status?: unknown } }
      | undefined;
    if (Array.isArray(data?.sets)) {
      data!.sets = data!.sets.map((set) =>
        set && typeof (set as { status?: unknown }).status === 'string'
          ? { ...set, status: ((set as { status: string }).status).toLowerCase() }
          : set
      );
    }
    if (data?.set && typeof data.set.status === 'string') {
      data.set = { ...data.set, status: data.set.status.toLowerCase() };
    }
    return response;
  })
);

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([authLink, normalizeSetStatus, httpLink]),
  cache: new InMemoryCache(),
});