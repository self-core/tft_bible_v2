use mongodb::{Collection, Database};
use serde::{Deserialize, Serialize};
use crate::errors::ApiError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trait {
    #[serde(rename = "_id")]
    pub id: String,
    pub name: String,
    pub trait_type: String, // "Origin", "Class", "Unique"
    pub description: String,
    pub image_url: String,
    pub breakpoints: Vec<TraitBreakpoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraitBreakpoint {
    pub units: i32,
    pub style: i32, // 0=bronze, 1=silver, 2=gold, 3=chromatic
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraitSummary {
    #[serde(rename = "_id")]
    pub id: String,
    pub name: String,
    pub trait_type: String,
    pub description: String,
    pub image_url: String,
}

pub struct TraitService {
    pub traits_collection: Collection<Trait>,
}

impl TraitService {
    pub fn new(db: &Database) -> Self {
        let traits_collection: Collection<Trait> = db.collection("traits");
        Self { traits_collection }
    }

    pub async fn get_all_traits(&self) -> Result<Vec<TraitSummary>, ApiError> {
        let mut cursor = self.traits_collection.find(None, None).await
            .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

        let mut traits = Vec::new();
        while let Some(trait_item) = cursor.next().await {
            if let Ok(trait_item) = trait_item {
                traits.push(TraitSummary {
                    id: trait_item.id,
                    name: trait_item.name,
                    trait_type: trait_item.trait_type,
                    description: trait_item.description,
                    image_url: trait_item.image_url,
                });
            }
        }

        Ok(traits)
    }

    pub async fn get_trait_by_name(&self, name: &str) -> Result<Option<Trait>, ApiError> {
        let trait_item = self.traits_collection
            .find_one(mongodb::bson::doc! {"name": &name}, None)
            .await
            .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

        Ok(trait_item)
    }
}