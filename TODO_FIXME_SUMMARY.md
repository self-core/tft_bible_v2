# TODO and FIXME Summary for TFT Bible Project

## Backend TODOs

### Handlers
1. **augments.rs** - `// TODO: Implement when needed` (handlers/mod.rs line 5)
2. **sets.rs** - `// TODO: Implement when needed` (handlers/mod.rs line 6)
3. **items.rs** - `// TODO: Implement proper data fetching from database` (handlers/items.rs line 20)
4. **compositions.rs** - `// TODO: Implement proper data fetching from database` (handlers/compositions.rs line 21)
5. **compositions.rs** - `// TODO: Add user_id from auth` (handlers/compositions.rs line 72)
6. **compositions.rs** - `// TODO: Add user_id from auth` (handlers/compositions.rs line 91)
7. **compositions.rs** - `// TODO: Add user_id from auth` (handlers/compositions.rs line 109)
8. **compositions.rs** - `// TODO: Add user_id from auth` (handlers/compositions.rs line 123)
9. **champions.rs** - `// TODO: Implement proper data fetching from database` (handlers/champions.rs line 20)

### Services
10. **compositions.rs** - `// TODO: traits and augments filters will be parsed once added to DTOs` (services/compositions.rs line 140)

### Queue Consumer (Riot API Integration)
11. **consumer.rs** - `// TODO: Save match data to database` (queue/consumer.rs line 107)
12. **consumer.rs** - `// TODO: Save summoner data to database` (queue/consumer.rs line 134)
13. **consumer.rs** - `// TODO: Implement actual tournament data processing logic` (queue/consumer.rs line 144)
14. **consumer.rs** - `// TODO: Implement actual TFT sets refresh logic` (queue/consumer.rs line 148)

## Frontend TODOs

### Builder Component
15. **Builder.tsx** - `// TODO: Implement save functionality` (components/Builder/Builder.tsx line 368)

### Other Frontend
16. **CompositionDetail.tsx** - `// TODO: Implement voting API call` (pages/CompositionDetail.tsx line 22)

## Summary

The project contains 16 TODO/FIXME comments that represent areas for future development:

- **2 TODOs** related to implementing new modules (augments and sets)
- **3 TODOs** related to database integration for data fetching
- **4 TODOs** related to authentication (adding user_id from auth)
- **1 TODO** related to filtering functionality in services
- **4 TODOs** related to Riot API integration and data processing
- **2 TODOs** related to frontend functionality (save and voting API calls)

Most of the backend TODOs are related to database integration, authentication, and Riot API data processing, suggesting that the application is currently using mock data and needs to implement proper data persistence and authentication systems.