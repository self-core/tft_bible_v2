import axios from 'axios';

async function runE2ETests() {
  console.log('🧪 Starting End-to-End Tests...\n');
  
  const BACKEND_URL = 'http://localhost:4000';
  
  try {
    // Test 1: Health Check
    console.log('✅ Test 1: Health Check');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Service: ${healthResponse.data.service}`);
    console.log('   ✅ Health check passed\n');
    
    // Test 2: GraphQL Endpoint
    console.log('✅ Test 2: GraphQL Endpoint');
    const graphqlResponse = await axios.post(
      `${BACKEND_URL}/graphql`,
      {
        query: `
          {
            champions {
              id
              name
              cost
              traits
            }
          }
        `
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`   Status: ${graphqlResponse.status}`);
    console.log(`   Champion count: ${graphqlResponse.data.data.champions.length}`);
    
    if (graphqlResponse.data.data.champions.length > 0) {
      const firstChampion = graphqlResponse.data.data.champions[0];
      console.log(`   First champion: ${firstChampion.name} (Cost: ${firstChampion.cost})`);
      console.log(`   Traits: ${firstChampion.traits.join(', ')}`);
      console.log('   ✅ GraphQL test passed\n');
    } else {
      console.log('   ❌ GraphQL test failed - no champions returned');
      return false;
    }
    
    // Test 3: Specific Champion Query
    console.log('✅ Test 3: Specific Champion Query');
    const specificChampionResponse = await axios.post(
      `${BACKEND_URL}/graphql`,
      {
        query: `
          {
            champion(id: "TFT16_Ahri") {
              id
              name
              cost
              traits
              ability {
                name
              }
            }
          }
        `
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const championData = specificChampionResponse.data.data.champion;
    if (championData && championData.name === 'Ahri') {
      console.log(`   Champion found: ${championData.name}`);
      console.log(`   Cost: ${championData.cost}`);
      console.log(`   Ability: ${championData.ability.name}`);
      console.log('   ✅ Specific champion query passed\n');
    } else {
      console.log('   ❌ Specific champion query failed');
      return false;
    }
    
    // Test 4: Traits Query
    console.log('✅ Test 4: Traits Query');
    const traitsResponse = await axios.post(
      `${BACKEND_URL}/graphql`,
      {
        query: `
          {
            traits {
              key
              name
              description
            }
          }
        `
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`   Trait count: ${traitsResponse.data.data.traits.length}`);
    if (traitsResponse.data.data.traits.length > 0) {
      const firstTrait = traitsResponse.data.data.traits[0];
      console.log(`   First trait: ${firstTrait.name} (${firstTrait.key})`);
      console.log('   ✅ Traits query passed\n');
    } else {
      console.log('   ❌ Traits query failed - no traits returned');
      return false;
    }
    
    // Test 5: Search Functionality
    console.log('✅ Test 5: Search Functionality');
    const searchResponse = await axios.post(
      `${BACKEND_URL}/graphql`,
      {
        query: `
          {
            search(searchTerm: "Ahri") {
              champions {
                id
                name
              }
            }
          }
        `
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const searchResults = searchResponse.data.data.search.champions;
    const foundAhri = searchResults.some((champ: any) => champ.name.includes('Ahri'));
    
    if (foundAhri) {
      console.log(`   Search results count: ${searchResults.length}`);
      console.log(`   Found Ahri in results: true`);
      console.log('   ✅ Search functionality passed\n');
    } else {
      console.log('   ❌ Search functionality failed - Ahri not found in search results');
      return false;
    }
    
    console.log('🎉 All End-to-End tests passed successfully!');
    console.log('✅ Application is working correctly with all features operational');
    return true;
    
  } catch (error: any) {
    console.error('❌ End-to-End test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runE2ETests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution error:', error);
      process.exit(1);
    });
}

export default runE2ETests;