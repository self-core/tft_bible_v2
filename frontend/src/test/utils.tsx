import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ApolloProvider } from '@apollo/client';
import { ApolloClient, InMemoryCache, ApolloLink, Observable } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { worker } from './msw/worker';
import { ReactNode } from 'react';

// Create a mock Apollo client for testing
const createMockApolloClient = () => {
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) =>
        console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
      );
    }
    if (networkError) {
      console.log(`[Network error]: ${networkError}`);
    }
  });

  const mockLink = new ApolloLink((operation) => {
    return new Observable((observer) => {
      // Mock responses based on operation
      const { operationName, variables } = operation;
      
      let mockData: Record<string, any> = {};
      
      switch (operationName) {
        case 'GetChampions':
          mockData = { champions: require('./msw/handlers').handlers.find((h: any) => h.queryName === 'GetChampions')?.mockData?.data?.champions || [] };
          break;
        case 'GetTraits':
          mockData = { traits: [] };
          break;
        case 'GetItems':
          mockData = { items: [] };
          break;
        case 'GetSets':
          mockData = { sets: [] };
          break;
        case 'GetCompositions':
          mockData = { compositions: [] };
          break;
        case 'GetComposition':
          mockData = { composition: null };
          break;
        case 'GetSet':
          mockData = { set: null };
          break;
      }
      
      observer.next({ data: mockData });
      observer.complete();
    });
  });

  return new ApolloClient({
    link: errorLink.concat(mockLink),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' },
      query: { fetchPolicy: 'cache-and-network' },
    },
  });
};

// Custom render function with providers
const customRender = (
  ui: ReactNode,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => {
  const client = createMockApolloClient();
  
  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Mock data helpers
export const mockChampion = (overrides: Record<string, any> = {}) => ({
  id: 'TFT18_Akali',
  name: 'Akali',
  cost: 1,
  traits: ['Inferno', 'Adaptor', 'Ravager'],
  stats: { hp: 600, mana: 50, damage: 55 },
  ability: { name: 'Kunai Strike', variables: [{ name: 'Damage', values: [150, 225, 335] }] },
  imageUrl: 'https://example.com/akali.png',
  splashUrl: 'https://example.com/akali-splash.png',
  iconUrl: 'https://example.com/akali-icon.png',
  ...overrides,
});

export const mockTrait = (overrides: Record<string, any> = {}) => ({
  key: 'Blossom',
  name: 'Blossom',
  description: 'Blossom units empower your Wisps and gain AD, AP, and Health.',
  breakpoints: [
    { count: 3, bonus: 'Wisps are upgraded' },
    { count: 5, bonus: 'Wisps appear in every shop' },
    { count: 7, bonus: 'Gain gold after buying a Wisp' },
    { count: 9, bonus: 'You can buy 2 Wisps per round' },
    { count: 11, bonus: 'Wisps overflow with power' },
  ],
  ...overrides,
});

export const mockItem = (overrides: Record<string, any> = {}) => ({
  id: 'TFT18_BFSword',
  name: 'B.F. Sword',
  description: 'Attack Damage +15',
  components: [],
  imageUrl: 'https://example.com/bfsword.png',
  unique: false,
  trait: null,
  ...overrides,
});

export const mockComposition = (overrides: Record<string, any> = {}) => ({
  id: 'test-comp-1',
  title: 'Blossom Ravagers',
  description: 'A strong Blossom Ravager composition',
  setId: 18,
  championIds: ['TFT18_Akali', 'TFT18_Camille'],
  traitBonuses: ['Blossom: 3', 'Ravager: 2'],
  augmentRecommendations: ['Wisp Catalyst'],
  difficulty: 'Intermediate',
  region: 'Runeterra',
  meta: {
    winrate: 52.3,
    avg_placement: 3.8,
    playrate: 0.05,
    contest_rate: 0.12,
    difficulty: 3,
    playstyle: 'Standard',
    patch: '14.18',
    cost: 28,
  },
  champions: [],
  augments: { preferred: ['Wisp Catalyst'] },
  tags: ['Blossom', 'Ravager'],
  ...overrides,
});

export const mockSet = (overrides: Record<string, any> = {}) => ({
  setId: 18,
  setName: 'Enchanted Wilds',
  status: 'active',
  champions: [mockChampion()],
  traits: [mockTrait()],
  items: [mockItem()],
  augments: [],
  mechanics: { wisp: 'Wisps mechanic activated' },
  ...overrides,
});

// Re-export everything from testing-library
export * from '@testing-library/react';
export { render as testRender, customRender as render };

// MSW worker helpers
export const startMSW = async () => {
  if (typeof window !== 'undefined') {
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
};

export const stopMSW = () => {
  worker.stop();
};

export const resetMSW = () => {
  worker.resetHandlers();
};