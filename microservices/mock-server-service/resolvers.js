// mock-server/resolvers.js
const db = require('./db.json');

// Mock data resolvers
const resolvers = {
  Query: {
    health: () => 'OK',
    
    champions: (parent, { limit }) => {
      let champions = db.champions || [];
      
      if (limit) {
        champions = champions.slice(0, limit);
      }
      
      return champions.map(champion => ({
        ...champion,
        stats: {
          health: champion.health || 600,
          mana: champion.mana || 0,
          startingMana: champion.startingMana || 0,
          armor: champion.armor || 20,
          magicResist: champion.magicResist || 20,
          attackDamage: champion.attackDamage || 50,
          attackSpeed: champion.attackSpeed || 0.65,
          attackRange: champion.attackRange || 1,
          critChance: champion.critChance || 0.25,
          critMultiplier: champion.critMultiplier || 1.5,
        },
        ability: {
          name: champion.abilityName || 'Unknown Ability',
          description: champion.abilityDescription || 'No description available',
          type: champion.abilityType || 'Active',
          targeting: champion.abilityTargeting || 'Enemies',
          damageType: champion.abilityDamageType || 'Physical',
        }
      }));
    },
    
    traits: () => {
      return db.traits || [];
    },
    
    items: () => {
      return db.items || [];
    }
  },
  
  Mutation: {
    traitTracker: (parent, { input }) => {
      // This is a mock implementation - in a real system, this would calculate the optimal path
      // For now, return a simple mock response
      
      // Extract target traits from input
      const targetTraits = input.targetTraits || [];
      
      // Find champions that have the required traits
      const mockChampions = db.champions ? db.champions.filter(champ => {
        return targetTraits.some(target => 
          champ.traits && champ.traits.includes(target.traitName)
        );
      }) : [];
      
      // Create a mock path with some of these champions
      const path = mockChampions.slice(0, 3).map(champ => ({
        champion: {
          ...champ,
          stats: {
            health: champ.health || 600,
            mana: champ.mana || 0,
            startingMana: champ.startingMana || 0,
            armor: champ.armor || 20,
            magicResist: champ.magicResist || 20,
            attackDamage: champ.attackDamage || 50,
            attackSpeed: champ.attackSpeed || 0.65,
            attackRange: champ.attackRange || 1,
            critChance: champ.critChance || 0.25,
            critMultiplier: champ.critMultiplier || 1.5,
          },
          ability: {
            name: champ.abilityName || 'Unknown Ability',
            description: champ.abilityDescription || 'No description available',
            type: champ.abilityType || 'Active',
            targeting: champ.abilityTargeting || 'Enemies',
            damageType: champ.abilityDamageType || 'Physical',
          }
        },
        traitsGained: champ.traits || [],
        cost: champ.cost || 1,
        efficiency: 0.8 // Mock efficiency
      }));
      
      return {
        path,
        efficiency: 0.75 // Mock overall efficiency
      };
    }
  }
};

module.exports = resolvers;