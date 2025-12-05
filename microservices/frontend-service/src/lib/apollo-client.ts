// src/lib/apollo-client.ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Get the API URL from either the runtime environment or build-time environment
const getApiUrl = () => {
  // First try to get from runtime configuration (window.env)
  if (typeof window !== 'undefined' && window.env && window.env.VITE_API_URL) {
    return window.env.VITE_API_URL;
  }
  // Fallback to build-time environment variable
  return import.meta.env.VITE_API_URL || 'http://localhost:8080';
};

// Create the HTTP link for GraphQL
const httpLink = createHttpLink({
  uri: `${getApiUrl()}/graphql`,
});

// Set up authentication context if needed
const authLink = setContext((_, { headers }) => {
  // Get token from localStorage if it exists
  const token = localStorage.getItem('token');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Cache policies to improve performance
          champions: {
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            }
          },
          traits: {
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            }
          },
          compositions: {
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            }
          }
        }
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
  }
});