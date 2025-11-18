use mongodb::{Collection, Database};
use serde::{Deserialize, Serialize};
use crate::errors::ApiError;
use bson::oid::ObjectId;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Set {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub name: String,
    pub short_name: String,
    pub version: String,
    pub is_active: bool,
    pub release_date: DateTime<Utc>,
    pub end_date: Option<DateTime<Utc>>,
    pub description: Option<String>,
    pub image_url: Option<String>,
    #[serde(with = "bson::serde_helpers::chrono_datetime_as_bson_datetime")]
    pub created_at: DateTime<Utc>,
    #[serde(with = "bson::serde_helpers::chrono_datetime_as_bson_datetime")]
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetSummary {
    #[serde(rename = "_id")]
    pub id: ObjectId,
    pub name: String,
    pub short_name: String,
    pub version: String,
    pub is_active: bool,
    pub release_date: DateTime<Utc>,
    pub description: Option<String>,
    pub image_url: Option<String>,
}

pub struct SetService {
    pub sets_collection: Collection<Set>,
}

impl SetService {
    pub fn new(db: &Database) -> Self {
        let sets_collection: Collection<Set> = db.collection("sets");
        Self { sets_collection }
    }

    pub async fn get_all_sets(&self) -> Result<Vec<SetSummary>, ApiError> {
        let mut cursor = self.sets_collection.find(None, None).await
            .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

        let mut sets = Vec::new();
        while let Some(set) = cursor.next().await {
            if let Ok(set) = set {
                sets.push(SetSummary {
                    id: set.id.unwrap_or_default(),
                    name: set.name,
                    short_name: set.short_name,
                    version: set.version,
                    is_active: set.is_active,
                    release_date: set.release_date,
                    description: set.description,
                    image_url: set.image_url,
                });
            }
        }

        Ok(sets)
    }

    pub async fn get_active_set(&self) -> Result<Option<Set>, ApiError> {
        let set = self.sets_collection
            .find_one(
                mongodb::bson::doc! {"is_active": true}, 
                None
            )
            .await
            .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

        Ok(set)
    }

    pub async fn get_set_by_id(&self, id: &ObjectId) -> Result<Option<Set>, ApiError> {
        let set = self.sets_collection
            .find_one(
                mongodb::bson::doc! {"_id": id}, 
                None
            )
            .await
            .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

        Ok(set)
    }

    pub async fn get_set_by_name(&self, name: &str) -> Result<Option<Set>, ApiError> {
        let set = self.sets_collection
            .find_one(
                mongodb::bson::doc! {"name": &name}, 
                None
            )
            .await
            .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

        Ok(set)
    }

    pub async fn create_set(&self, mut set: Set) -> Result<Set, ApiError> {
        // Set timestamps
        let now = Utc::now();
        set.created_at = now;
        set.updated_at = now;

        // Insert the set
        let result = self.sets_collection
            .insert_one(&set, None)
            .await
            .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

        // Get the inserted set
        let inserted_set = self.sets_collection
            .find_one(
                mongodb::bson::doc! {"_id": result.inserted_id},
                None
            )
            .await
            .map_err(|e| ApiError::DatabaseError(e.to_string()))?
            .ok_or_else(|| ApiError::NotFound("Set was created but could not be retrieved".to_string()))?;

        Ok(inserted_set)
    }

    pub async fn update_set(&self, id: &ObjectId, mut set: Set) -> Result<Option<Set>, ApiError> {
        // Set update timestamp
        set.updated_at = Utc::now();

        let result = self.sets_collection
            .replace_one(
                mongodb::bson::doc! {"_id": id},
                set,
                None
            )
            .await
            .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

        if result.modified_count > 0 {
            let updated_set = self.sets_collection
                .find_one(
                    mongodb::bson::doc! {"_id": id},
                    None
                )
                .await
                .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

            Ok(updated_set)
        } else {
            Ok(None)
        }
    }

    pub async fn delete_set(&self, id: &ObjectId) -> Result<bool, ApiError> {
        let result = self.sets_collection
            .delete_one(
                mongodb::bson::doc! {"_id": id},
                None
            )
            .await
            .map_err(|e| ApiError::DatabaseError(e.to_string()))?;

        Ok(result.deleted_count > 0)
    }
}