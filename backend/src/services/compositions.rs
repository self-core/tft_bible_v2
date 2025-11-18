use bson::oid::ObjectId;
use chrono::Utc;
use once_cell::sync::Lazy;
use std::sync::RwLock;

use crate::models::*;
use crate::errors::ApiError;

// Simple in-memory mock storage guarded by RwLock
static COMPOSITIONS: Lazy<RwLock<Vec<Composition>>> = Lazy::new(|| {
    let now = Utc::now();
    let set_id = ObjectId::new();

    let sample = vec![
        Composition {
            id: Some(ObjectId::new()),
            set_id,
            author_id: None,
            name: "Bastion Bruisers".to_string(),
            description: "Frontline focused comp with Bastion synergies".to_string(),
            category: "Frontline".to_string(),
            tags: vec!["beginner".to_string(), "frontline".to_string()],
            champions: vec![],
            augments: CompositionAugments { preferred: vec![], acceptable: vec![], avoid: vec![] },
            positioning: None,
            gameplan: None,
            meta: CompositionMeta {
                tier: "A".to_string(),
                difficulty: 2,
                cost: "Flexible".to_string(),
                patch: "15.23".to_string(),
                playstyle: "Defensive".to_string(),
                winrate: 0.53,
                avg_placement: 3.9,
                playrate: 0.12,
                contest_rate: 0.18,
            },
            matchups: None,
            votes: Votes { upvotes: 0, downvotes: 0 },
            views: 0,
            favorites: 0,
            comments: vec![],
            is_public: true,
            is_verified: false,
            is_featured: false,
            created_at: now,
            updated_at: now,
        },
        Composition {
            id: Some(ObjectId::new()),
            set_id,
            author_id: None,
            name: "Luchador Reroll".to_string(),
            description: "Aggressive reroll around Luchador core".to_string(),
            category: "Reroll".to_string(),
            tags: vec!["aggressive".to_string(), "reroll".to_string()],
            champions: vec![],
            augments: CompositionAugments { preferred: vec![], acceptable: vec![], avoid: vec![] },
            positioning: None,
            gameplan: None,
            meta: CompositionMeta {
                tier: "S".to_string(),
                difficulty: 3,
                cost: "Budget".to_string(),
                patch: "15.23".to_string(),
                playstyle: "Aggressive".to_string(),
                winrate: 0.58,
                avg_placement: 3.4,
                playrate: 0.16,
                contest_rate: 0.25,
            },
            matchups: None,
            votes: Votes { upvotes: 0, downvotes: 0 },
            views: 0,
            favorites: 0,
            comments: vec![],
            is_public: true,
            is_verified: false,
            is_featured: false,
            created_at: now,
            updated_at: now,
        },
    ];
    RwLock::new(sample)
});

pub struct CompositionService;

impl CompositionService {
    pub fn new(_db: &mongodb::Database) -> Self {
        Self
    }

    pub async fn get_compositions(
        &self,
        params: CompositionQuery,
    ) -> Result<PaginatedResponse<CompositionSummary>, ApiError> {
        let data = COMPOSITIONS.read().unwrap().clone();

        // Filtering
        let mut filtered: Vec<Composition> = data.into_iter().filter(|c| c.is_public).collect();

        // tier
        if let Some(ref tier) = params.tier {
            filtered = filtered.into_iter().filter(|c| c.meta.tier.eq_ignore_ascii_case(tier)).collect();
        }

        // category
        if let Some(ref category) = params.category {
            filtered = filtered.into_iter().filter(|c| c.category.eq_ignore_ascii_case(category)).collect();
        }

        // tags (comma-separated)
        if let Some(ref tags) = params.tags {
            let wanted: Vec<String> = tags.split(',').map(|s| s.trim().to_lowercase()).collect();
            filtered = filtered.into_iter().filter(|c| {
                let set: std::collections::HashSet<String> = c.tags.iter().map(|t| t.to_lowercase()).collect();
                wanted.iter().all(|t| set.contains(t))
            }).collect();
        }

        // text search on name/description
        if let Some(ref q) = params.champion { // reuse 'champion' param as generic search? we also have SearchQuery elsewhere
            let ql = q.to_lowercase();
            filtered = filtered.into_iter().filter(|c| {
                c.name.to_lowercase().contains(&ql) || c.description.to_lowercase().contains(&ql)
            }).collect();
        }

        // patch
        if let Some(ref patch) = params.patch {
            filtered = filtered.into_iter().filter(|c| c.meta.patch == *patch).collect();
        }

        // difficulty
        if let Some(diff) = params.difficulty {
            filtered = filtered.into_iter().filter(|c| c.meta.difficulty == diff).collect();
        }

        // TODO: traits and augments filters will be parsed once added to DTOs

        let mut items: Vec<Composition> = filtered;

        // Sorting: by tier then difficulty
        fn tier_rank(t: &str) -> u8 {
            match t {
                "S" => 0,
                "A" => 1,
                "B" => 2,
                "C" => 3,
                "D" => 4,
                _ => 5,
            }
        }
        items.sort_by(|a, b| {
            tier_rank(&a.meta.tier)
                .cmp(&tier_rank(&b.meta.tier))
                .then(a.meta.difficulty.cmp(&b.meta.difficulty))
        });

        // Pagination
        let per_page = params.limit.unwrap_or(8).clamp(1, 100) as usize;
        let page = (params.offset.unwrap_or(0) / per_page as u64) as usize + 1;
        let total = items.len() as u32;
        let total_pages = ((total as usize + per_page - 1) / per_page) as u32;
        let start = ((page - 1) * per_page).min(items.len());
        let end = (start + per_page).min(items.len());
        let page_items = &items[start..end];

        let summaries = page_items
            .iter()
            .map(|c| CompositionSummary {
                id: c.id.unwrap_or_else(ObjectId::new),
                name: c.name.clone(),
                category: c.category.clone(),
                tier: c.meta.tier.clone(),
                difficulty: c.meta.difficulty,
                winrate: c.meta.winrate,
                views: c.views,
                upvotes: c.votes.upvotes,
                author: None,
                champion_count: c.champions.len() as u32,
                main_champions: vec![],
                created_at: c.created_at,
            })
            .collect();

        Ok(PaginatedResponse {
            data: summaries,
            total,
            page: page as u32,
            per_page: per_page as u32,
            total_pages,
        })
    }

    pub async fn get_by_id(&self, id: ObjectId) -> Result<Composition, ApiError> {
        let data = COMPOSITIONS.read().unwrap();
        let comp = data.iter().find(|c| c.id == Some(id)).cloned();
        comp.ok_or_else(|| ApiError::NotFound("Composition not found".to_string()))
    }

    // Stubs for future CRUD
    pub async fn create(
        &self,
        _request: CreateCompositionRequest,
        _user_id: Option<ObjectId>,
    ) -> Result<Composition, ApiError> {
        Err(ApiError::Forbidden("Write operations are disabled in mock mode".to_string()))
    }

    pub async fn update(
        &self,
        _id: ObjectId,
        _request: UpdateCompositionRequest,
        _user_id: Option<ObjectId>,
    ) -> Result<Composition, ApiError> {
        Err(ApiError::Forbidden("Write operations are disabled in mock mode".to_string()))
    }

    pub async fn delete(&self, _id: ObjectId, _user_id: Option<ObjectId>) -> Result<(), ApiError> {
        Err(ApiError::Forbidden("Write operations are disabled in mock mode".to_string()))
    }

    pub async fn increment_views(&self, _id: ObjectId) -> Result<(), ApiError> {
        Ok(())
    }

    pub async fn vote(
        &self,
        _id: ObjectId,
        _vote_type: &str,
        _user_id: Option<ObjectId>,
    ) -> Result<Votes, ApiError> {
        Err(ApiError::Forbidden("Voting is disabled in mock mode".to_string()))
    }

    pub async fn export_composition(&self, id: ObjectId, set_name: &str) -> Result<String, ApiError> {
        let composition = self.get_by_id(id).await?;

        let export_data = CompositionImportExport {
            name: composition.name,
            description: composition.description,
            category: composition.category,
            tags: composition.tags,
            champions: composition.champions,
            augments: composition.augments,
            positioning: composition.positioning,
            gameplan: composition.gameplan,
            meta: composition.meta,
            matchups: composition.matchups,
            export_date: Utc::now(),
            tft_set: set_name.to_string(),
        };

        // Serialize to JSON string
        let json_string = serde_json::to_string(&export_data)
            .map_err(|e| ApiError::InternalServerError(format!("Serialization error: {}", e)))?;

        // Encode to Base64 to create a shareable string
        let encoded = base64::encode(&json_string);
        Ok(encoded)
    }

    pub async fn import_composition(&self, import_string: &str) -> Result<Composition, ApiError> {
        // Decode from Base64
        let decoded_bytes = base64::decode(import_string)
            .map_err(|e| ApiError::BadRequest(format!("Invalid import string: {}", e)))?;

        let json_string = String::from_utf8(decoded_bytes)
            .map_err(|e| ApiError::BadRequest(format!("Invalid import string: {}", e)))?;

        // Deserialize from JSON
        let import_data: CompositionImportExport = serde_json::from_str(&json_string)
            .map_err(|e| ApiError::BadRequest(format!("Invalid composition data: {}", e)))?;

        // Create a new composition from import data
        // Note: In a real implementation, you'd need to validate champion/item/other IDs exist in the DB
        let new_composition = Composition {
            id: Some(ObjectId::new()), // Generate a new ID
            set_id: ObjectId::new(), // This would be looked up by set_name in a real implementation
            author_id: None, // Will be set by the importing user
            name: import_data.name,
            description: import_data.description,
            category: import_data.category,
            tags: import_data.tags,
            champions: import_data.champions,
            augments: import_data.augments,
            positioning: import_data.positioning,
            gameplan: import_data.gameplan,
            meta: import_data.meta,
            matchups: import_data.matchups,
            votes: Votes { upvotes: 0, downvotes: 0 },
            views: 0,
            favorites: 0,
            comments: vec![],
            is_public: false, // User will need to publish after importing
            is_verified: false,
            is_featured: false,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        Ok(new_composition)
    }
}

