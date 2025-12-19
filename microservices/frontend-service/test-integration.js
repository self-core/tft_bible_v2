// Simple test script to verify GraphQL API integration
// This can be run as part of your testing process

import { graphQLApi } from './src/lib/graphql-api';
import { GET_CHAMPIONS, GET_TRAITS, GET_COMPOSITIONS } from './src/lib/graphql';

async function testAPIIntegration() {
  console.log('Testing GraphQL API Integration...');
  
  try {
    console.log('1. Testing Champions Query...');
    const championsResponse = await graphQLApi.getChampions({ limit: 5 });
    console.log(`✓ Champions query successful: ${championsResponse.data.champions.length} champions returned`);
    
    console.log('2. Testing Traits Query...');
    const traitsResponse = await graphQLApi.getTraits({ limit: 5 });
    console.log(`✓ Traits query successful: ${traitsResponse.data.traits.length} traits returned`);
    
    console.log('3. Testing Compositions Query...');
    const compositionsResponse = await graphQLApi.getCompositions({ limit: 3 });
    console.log(`✓ Compositions query successful: ${compositionsResponse.data.compositions.length} compositions returned`);
    
    console.log('\n✓ All GraphQL API tests passed successfully!');
    console.log('Frontend can successfully communicate with the GraphQL gateway.');
    
  } catch (error) {
    console.error('✗ API Integration test failed:', error);
    process.exit(1);
  }
}

// Run the test
testAPIIntegration();