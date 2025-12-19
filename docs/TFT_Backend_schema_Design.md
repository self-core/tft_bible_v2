Here is the consolidated technical blueprint for your **Scalable TFT Schema & Architecture**. You can save this as `TFT_Architecture_Design.md`.

---

# TFT Evolving Metadata Architecture

## 1. The Core Problem

TFT releases new "Sets" every quarter. Each set features:

* **Rotations:** Existing champions are removed; new ones are added.
* **Stat Changes:** The same champion (e.g., Ahri) has different costs/stats across sets.
* **New Mechanics:** Every set introduces a "gimmick" (Augments, Encounters, Portals).
* **Volatile Scaling:** Ability damage and trait breakpoints change frequently.

## 2. Recommended Data Model (NoSQL Document)

Using a **Document-per-Set** approach ensures that changes in Set 13 do not break the historical data of Set 12.

### Schema Structure (JSON)

```json
{
  "set_id": 12,
  "set_name": "Magic n' Mayhem",
  "champions": [
    {
      "id": "TFT12_Ahri",
      "name": "Ahri",
      "cost": 2,
      "traits": ["Scholar", "Arcana"],
      "stats": { "hp": 600, "mana": 30 },
      "ability": {
        "name": "Orb of Deception",
        "variables": { "Damage": [200, 300, 450] }
      }
    }
  ],
  "traits": [
    {
      "key": "Scholar",
      "breakpoints": [
        { "count": 2, "bonus": "3 Mana per attack" },
        { "count": 4, "bonus": "5 Mana per attack" }
      ]
    }
  ]
}

```

---

## 3. Code Implementation (TypeScript)

### Entities & Interfaces

Define flexible interfaces using `Record<string, any>` to handle set-specific mechanics without changing the code.

```typescript
export interface ISetChampion {
  id: string;         // Unique ID (e.g., TFT12_Ahri)
  name: string;
  cost: number;
  traits: string[];
  stats: Record<string, number>; 
  ability: {
    name: string;
    variables: Record<string, number[]>; // Values for 1, 2, and 3 stars
  };
}

export interface ISetData {
  setId: number;
  champions: ISetChampion[];
  traits: any[]; // Nested trait definitions
  mechanics: Record<string, any>;
}

```

### Repository Pattern

The repository abstracts the database logic so the application only interacts with the "Current Set."

```typescript
export interface ITFTRepository {
  getSetData(setId: number): Promise<ISetData>;
  getChampion(setId: number, id: string): Promise<ISetChampion | null>;
}

```

---

## 4. Service Layer (Data Dragon Integration)

The Service Layer acts as the **Hydrator**. It fetches the massive ~20MB JSON from CommunityDragon and transforms it into your clean schema.

### Key Logic:

1. **Filtering:** Filter the global `items` list by checking if `apiName` starts with `TFT[SetNumber]_`.
2. **Mapping:** Convert the nested `ability.variables` (which are messy in the API) into a simple key-value pair for easy use in the UI.
3. **Persistence:** Save the transformed object to your NoSQL DB once per patch.

---

## 5. Architectural Summary Table

| Layer | Responsibility | Why it's needed |
| --- | --- | --- |
| **DDragon API** | External Data Source | Raw, unorganized data for every set. |
| **Service Layer** | Transformation | Cleans and filters raw JSON into your interfaces. |
| **NoSQL DB** | Persistence | Stores "Snapshots" of each set for fast retrieval. |
| **Repository** | Data Access | Provides a consistent API for your frontend/app. |

---

## 6. Implementation Strategy

1. **Avoid Flat Tables:** Do not use columns for traits. Use arrays or join tables.
2. **Version Everything:** Always prefix champion IDs with the Set number (e.g., `TFT12_`).
3. **The "Sync" Job:** Create a script that runs whenever a new patch drops. It should:
* Fetch the latest JSON.
* Run the Service Layer mapping.
* `upsert` the data into your `sets` collection in the database.



---

**Next Step Suggestion:**
Would you like me to provide a **Docker Compose** setup or a **Node.js express boilerplate** to host this service layer and database locally?