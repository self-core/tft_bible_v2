use bson::{doc, oid::ObjectId, DateTime};
use once_cell::sync::Lazy;
use std::sync::RwLock;
use serde_json;

use crate::models::*;
use crate::errors::ApiError;

// Load compositions from scraped data at startup
static COMPOSITIONS: Lazy<RwLock<Vec<Composition>>> = Lazy::new(|| {
    match CompositionService::load_scraped_compositions() {
        Ok(compositions) => RwLock::new(compositions),
        Err(e) => {
            eprintln!("Failed to load scraped compositions: {}", e);
            // Fallback to empty vec if loading fails
            RwLock::new(vec![])
        }
    }
});

pub struct CompositionService;

impl CompositionService {
    pub fn new(_db: &mongodb::Database) -> Self {
        Self
    }

    // Load compositions from scraped data file
    fn load_scraped_compositions() -> Result<Vec<Composition>, ApiError> {
        let data = include_str!("../../scraped_compositions.json");
        let scraped: serde_json::Value = serde_json::from_str(data)
            .map_err(|e| ApiError::InternalServerError(format!("Failed to parse scraped data: {}", e)))?;

        let compositions = scraped["data"].as_array()
            .ok_or_else(|| ApiError::InternalServerError("Invalid scraped data format".to_string()))?;

        let mut result = Vec::new();
        let now = DateTime::now();
        let set_id = ObjectId::new();

        for comp in compositions {
            let name = comp["name"].as_str()
                .ok_or_else(|| ApiError::InternalServerError("Missing composition name".to_string()))?;
            let description = comp["description"].as_str()
                .unwrap_or("");
            let category = comp["category"].as_str()
                .unwrap_or("General");
            let tier = comp["tier"].as_str()
                .unwrap_or("C");
            let difficulty = comp["difficulty"].as_u64()
                .unwrap_or(3) as u32;
            let winrate = comp["winrate"].as_f64()
                .unwrap_or(0.5);
            let avg_placement = comp["avg_placement"].as_f64()
                .unwrap_or(4.0);
            let playrate = comp["playrate"].as_f64()
                .unwrap_or(0.1);
            let patch = comp["patch"].as_str()
                .unwrap_or("15.21");
            let playstyle = comp["playstyle"].as_str()
                .unwrap_or("Balanced");

            // Parse tags
            let tags: Vec<String> = comp["tags"].as_array()
                .unwrap_or(&vec![])
                .iter()
                .filter_map(|t| t.as_str())
                .map(|s| s.to_string())
                .collect();

            // Parse champions
            let champions: Vec<CompositionChampion> = comp["champions"].as_array()
                .unwrap_or(&vec![])
                .iter()
                .filter_map(|champ| {
                    let name = champ["name"].as_str()?;
                    let items: Vec<ObjectId> = champ["items"].as_array()
                        .unwrap_or(&vec![])
                        .iter()
                        .filter_map(|item| item.as_str())
                        .map(|_| ObjectId::new()) // Will be resolved later
                        .collect();

                    Some(CompositionChampion {
                        champion_id: ObjectId::new(), // Will be resolved later
                        star_level: 1, // Default star level
                        items,
                        position: Position { x: 0, y: 0 }, // Default position
                        priority: 1, // Default priority
                        is_core: true, // Assume all champions in scraped data are core
                        alternatives: vec![],
                    })
                })
                .collect();

            // Parse augments
            let augments: Vec<ObjectId> = comp["augments"].as_array()
                .unwrap_or(&vec![])
                .iter()
                .filter_map(|a| a.as_str())
                .map(|_| ObjectId::new()) // Will be resolved later
                .collect();

            // Parse traits
            let traits: Vec<String> = comp["traits"].as_array()
                .unwrap_or(&vec![])
                .iter()
                .filter_map(|t| t.as_str())
                .map(|s| s.to_string())
                .collect();

            let composition = Composition {
                id: Some(ObjectId::new()),
                set_id,
                author_id: None,
                name: name.to_string(),
                description: description.to_string(),
                category: category.to_string(),
                tags,
                champions,
                augments: CompositionAugments {
                    preferred: augments,
                    acceptable: vec![],
                    avoid: vec![],
                },
                positioning: None,
                gameplan: None,
                meta: CompositionMeta {
                    tier: tier.to_string(),
                    difficulty,
                    cost: "Flexible".to_string(),
                    patch: patch.to_string(),
                    playstyle: playstyle.to_string(),
                    winrate,
                    avg_placement,
                    playrate,
                    contest_rate: 0.15, // Default value
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
            };

            result.push(composition);
        }

        Ok(result)
    }

    pub async fn get_compositions(
        &self,
        params: CompositionQuery,
    ) -> Result<PaginatedResponse<CompositionSummary>, ApiError> {
        // Build MongoDB filter
        let mut filter = doc! { "is_active": true };

        // tier
        if let Some(ref tier) = params.tier {
            filter.insert("meta.tier", doc! { "$regex": format!("^{}$", tier), "$options": "i" });
        }

        // category
        if let Some(ref category) = params.category {
            filter.insert("category", doc! { "$regex": format!("^{}$", category), "$options": "i" });
        }

        // tags (comma-separated)
        if let Some(ref tags) = params.tags {
            let wanted: Vec<String> = tags.split(',').map(|s| s.trim().to_string()).collect();
            filter.insert("tags", doc! { "$in": wanted });
        }

        // text search on name/description
        if let Some(ref q) = params.champion {
            filter.insert("$or", vec![
                doc! { "name": doc! { "$regex": q, "$options": "i" } },
                doc! { "description": doc! { "$regex": q, "$options": "i" } }
            ]);
        }

        // patch
        if let Some(ref patch) = params.patch {
            filter.insert("meta.patch", patch);
        }

        // difficulty
        if let Some(diff) = params.difficulty {
            filter.insert("meta.difficulty", diff);
        }

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

        let sort_doc = doc! {
            "meta.tier": 1,
            "meta.difficulty": 1,
            "meta.winrate": -1
        };

        // Pagination
        let per_page = params.limit.unwrap_or(8).clamp(1, 100) as u64;
        let skip = params.offset.unwrap_or(0) as u64;

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
        items.sort_by(|a, b| {
            tier_rank(&a.meta.tier)
                .cmp(&tier_rank(&b.meta.tier))
                .then(a.meta.difficulty.cmp(&b.meta.difficulty))
        });

        // Pagination
        let per_page = params.limit.unwrap_or(8).clamp(1, 100) as usize;
        let skip = params.offset.unwrap_or(0) as usize;
        let total = items.len() as u32;
        let total_pages = ((total as usize + per_page - 1) / per_page) as u32;
        let current_page = (skip / per_page) as u32 + 1;
        let start = skip.min(items.len());
        let end = (start + per_page).min(items.len());
        let page_items = &items[start..end];

        let compositions = page_items.to_vec();

        let summaries = compositions
            .into_iter()
            .map(|c| CompositionSummary {
                id: c.id.unwrap_or_else(ObjectId::new),
                name: c.name,
                category: c.category,
                tier: c.meta.tier,
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
            page: current_page,
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

    pub async fn increment_views(&self, id: ObjectId) -> Result<(), ApiError> {
        let mut data = COMPOSITIONS.write().unwrap();
        if let Some(comp) = data.iter_mut().find(|c| c.id == Some(id)) {
            comp.views += 1;
            comp.updated_at = DateTime::now();
            Ok(())
        } else {
            Err(ApiError::NotFound("Composition not found".to_string()))
        }
    }

    pub async fn vote(
        &self,
        _id: ObjectId,
        _vote_type: &str,
        _user_id: Option<ObjectId>,
    ) -> Result<Votes, ApiError> {
        Err(ApiError::Forbidden("Voting is disabled in mock mode".to_string()))
    }
}

