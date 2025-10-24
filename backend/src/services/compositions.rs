use bson::{doc, oid::ObjectId, DateTime};
use futures::stream::TryStreamExt;
use mongodb::options::FindOptions;
use mongodb::{Collection, Database};
use serde_json;

use crate::models::*;
use crate::errors::ApiError;

pub struct CompositionService {
    pub collection: Collection<Composition>,
}

impl CompositionService {
    pub fn new(db: &Database) -> Self {
        Self {
            collection: db.collection("compositions"),
        }
    }

    // Method to populate MongoDB with scraped compositions (for initial setup)
    pub async fn populate_from_scraped_data(&self) -> Result<(), ApiError> {
        let data = include_str!("../../scraped_compositions.json");
        let scraped: serde_json::Value = serde_json::from_str(data)
            .map_err(|e| ApiError::InternalServerError(format!("Failed to parse scraped data: {}", e)))?;

        let compositions = scraped["data"].as_array()
            .ok_or_else(|| ApiError::InternalServerError("Invalid scraped data format".to_string()))?;

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

            // Insert into MongoDB
            self.collection.insert_one(&composition).await
                .map_err(|e| ApiError::InternalServerError(format!("Failed to insert composition: {}", e)))?;
        }

        Ok(())
    }

    pub async fn get_compositions(
        &self,
        params: CompositionQuery,
    ) -> Result<PaginatedResponse<CompositionSummary>, ApiError> {
        // Build MongoDB filter
        let mut filter = doc! { "is_public": true };

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
        fn tier_rank(t: &str) -> i32 {
            match t.to_uppercase().as_str() {
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
        let per_page = params.limit.unwrap_or(12).clamp(1, 100) as i64;
        let skip = params.offset.unwrap_or(0) as u64;

        // Get total count
        let total = self.collection.count_documents(filter.clone()).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to count compositions: {}", e)))?;

        // Get paginated results
        let options = FindOptions::builder()
            .sort(Some(sort_doc))
            .skip(Some(skip))
            .limit(Some(per_page))
            .build();

        let cursor = self.collection.find(filter).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to find compositions: {}", e)))?;

        let compositions: Vec<Composition> = cursor.try_collect().await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to collect compositions: {}", e)))?;

        let total_pages = ((total as f64 / per_page as f64).ceil()) as u32;
        let current_page = (skip as f64 / per_page as f64).floor() as u32 + 1;

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
            total: total as u32,
            page: current_page,
            per_page: per_page as u32,
            total_pages,
        })
    }

    pub async fn get_by_id(&self, id: ObjectId) -> Result<Composition, ApiError> {
        let filter = doc! { "_id": id, "is_public": true };
        let composition = self.collection.find_one(filter).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to find composition: {}", e)))?
            .ok_or_else(|| ApiError::NotFound("Composition not found".to_string()))?;
        Ok(composition)
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
        let filter = doc! { "_id": id, "is_public": true };
        let update = doc! {
            "$inc": { "views": 1 },
            "$set": { "updated_at": DateTime::now() }
        };

        let result = self.collection.update_one(filter, update).await
            .map_err(|e| ApiError::InternalServerError(format!("Failed to increment views: {}", e)))?;

        if result.modified_count == 0 {
            return Err(ApiError::NotFound("Composition not found".to_string()));
        }

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
}

