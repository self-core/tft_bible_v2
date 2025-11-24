# RIOT API Policy and Best Practices for TFT Bible v2

## Game Policy Use Cases
Source: https://developer.riotgames.com/docs/tft#game-policy_use-cases

### Key Policy Points:
1. **Production Key Requirement**: For any production application, you must use a Production API Key, not a Development Key
2. **Policy Compliance**: Applications must not violate Riot's policies including:
   - No cheating or game manipulation
   - No unauthorized data collection
   - No interference with game integrity
   - No monetization without proper licensing

### Use Cases Allowed:
- Statistics and analytics tools
- Educational content
- Community tools and resources
- Research and academic projects

### Prohibited Use Cases:
- Any form of cheating or unfair advantage
- Automated gameplay
- Real-money gambling or betting
- Tournament manipulation
- Commercial use without proper licensing

## Match History Best Practices
Source: https://developer.riotgames.com/docs/tft#match-history_best-practices

### Key Best Practices:
1. **Fresh Data Optimization**: Match history service is optimized for fresh data - newer matches cost less to retrieve
2. **Data Version Evolution**:
   - Patch 9.19: Basic match history with `data_version: "1"`
   - Patch 9.20: Items added (not guaranteed accurate)
   - Patch 9.21: All fields accurate
   - Patch 9.22: `character_id` field added, `data_version: "2"`

3. **Guaranteed Accurate Fields by Patch**:
   - Patch 9.19: `last_round`, `level`, `placement`, `puuid`
   - Patch 9.20+: All fields should be accurate

4. **Backfill Recommendation**: Not recommended to backfill data for Set 1 due to cost and data quality

## Data Dragon Static Data
Source: https://developer.riotgames.com/docs/tft#data-dragon

### Current Set Information:
- **Current Set**: 15 (as of latest documentation)
- **Latest Patch Convention**: 15.21.1 (latest patch for data fetching)
- **Data Dragon URL**: https://ddragon.leagueoflegends.com/cdn/dragontail-15.21.1.tgz

### Available Static Data Endpoints:
1. **Champions**: https://ddragon.leagueoflegends.com/cdn/15.21.1/data/en_US/tft-champion.json
2. **Traits**: https://ddragon.leagueoflegends.com/cdn/15.21.1/data/en_US/tft-trait.json
3. **Augments**: https://ddragon.leagueoflegends.com/cdn/15.21.1/data/en_US/tft-augments.json
4. **Items**: https://ddragon.leagueoflegends.com/cdn/15.21.1/data/en_US/tft-item.json
5. **Queues**: https://ddragon.leagueoflegends.com/cdn/15.21.1/data/en_US/tft-queues.json
6. **Regalia (Ranked)**: https://ddragon.leagueoflegends.com/cdn/15.21.1/data/en_US/tft-regalia.json
7. **Tacticians**: https://ddragon.leagueoflegends.com/cdn/15.21.1/data/en_US/tft-tactician.json
8. **Arena Mode**: https://ddragon.leagueoflegends.com/cdn/15.21.1/data/en_US/tft-arena.json

### Data Structure Notes:
- All data includes translated names and image assets
- Image paths are relative to Data Dragon CDN
- Set identification through naming conventions
- Manual update process after patches

## Project Compliance Assessment

### ✅ Compliant Use Cases for TFT Bible v2:
- Statistics and analytics tools (✓ - composition win rates, meta analysis)
- Educational content (✓ - learning optimal compositions)
- Community tools and resources (✓ - composition sharing and discovery)
- Research and academic projects (✓ - TFT meta analysis)

### ✅ Policy Compliance:
- No cheating or game manipulation
- No unauthorized data collection (using public APIs)
- No interference with game integrity
- No monetization (open source project)
- Using appropriate API keys for development

### 📋 Implementation Plan:
1. **Static Data Population**: Use Data Dragon APIs to populate MongoDB with champions, traits, augments, items for Set 15
2. **Match History Integration**: Implement proper data versioning handling for match history
3. **Fresh Data Focus**: Optimize for recent match data retrieval
4. **Production Key Migration**: Plan for Production API key when moving to production

### 🔄 Future Considerations:
- Monitor Data Dragon updates after patches
- Implement proper data versioning for match history responses
- Consider Production API key application when scaling
- Regular policy compliance reviews