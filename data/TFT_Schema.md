## TFT Bible Canonical Data Schema (V0.1)

This document serves as the single source of truth for the data model of the TFT Bible project. All frontend components, backend endpoints, and data ingestion processes **MUST** adhere to this schema contract.

### 🎯 Goal
To define a stable, standardized, and comprehensive data structure for all Teamfight Tactics information, abstracting away the volatility and complexity of external APIs (Riot, scraping, etc.).

### 📚 Core Entities

#### 1. Set/Season (`TFT_Set`)
Defines the current game environment.
- **`set_id`**: (String, Unique) e.g., "SET17"
- **`set_name`**: (String) e.g., "Mythic Masters"
- **`release_date`**: (Date)
- **`game_type_support`**: (Array of Strings) Supported game modes (e.g., ["Ranked", "Casual"])

#### 2. Champion (`TFT_Champion`)
Information about a playable unit.
- **`champion_id`**: (String, Unique) Riot ID format.
- **`name`**: (String) Champion display name.
- **`icon_url`**: (String) URL to the champion icon.
- **`set_association`**: (String) Which set the champion belongs to.
- **`stats`**: (Object) Basic numerical stats.
  - **`attack_damage`**: (Float)
  - **`health`**: (Integer)
  - **`armor`**: (Float)
  - **`magic_resist`**: (Float)
  - **`movement_speed`**: (Float)

#### 3. Item (`TFT_Item`)
Information about a usable item.
- **`item_id`**: (String, Unique)
- **`name`**: (String) Item display name.
- **`effect_description`**: (String) Detailed effect.
- **`sell_value`**: (Integer) In-game sell value.
- **`type`**: (String) Item category (e.g., "Weapon", "Utility").

#### 4. Board State (`TFT_BoardState`)
Represents the temporary, active state of the game board for a specific match.
- **`board_id`**: (String, Unique) Instance ID for a specific game match.
- **`active_board_state`**: (Array of `UnitInstance`): The units currently on the board.
- **`potential_units`**: (Array of `UnitInstance`): Units in inventory/store.
- **`active_items`**: (Array of `ItemInstance`): Items currently equipped.
- **`lane_composition`**: (Object) A matrix mapping positions (e.g., 0-4) to Champion IDs and corresponding traits.

#### 5. Unit Instance (`UnitInstance`)
Represents a specific copy of a Champion or unit on a board/inventory.
- **`source_champion_id`**: (String) Links back to `TFT_Champion`.
- **`current_level`**: (Integer)
- **`equipped_items`**: (Array of `ItemInstance`): Items held by this unit.
- **`position`**: (String) Grid position on the board (e.g., "FrontRowLeft").
- **`traits_active`**: (Array of Strings) Traits derived from this unit's combination with others.

### 🧩 Relationships & Constraints

*   `TFT_BoardState` references multiple instances of `TFT_Champion` (via `UnitInstance.source_champion_id`) and `TFT_Item` (via `ItemInstance.item_id`).
*   **Mandatory:** All data points must carry a `source_api` tag (e.g., "Riot/MatchHistory", "Scraping/PublicAPI", "Manual/Derived") to indicate data reliability and origin.
`