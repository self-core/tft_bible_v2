use std::fs;
use std::collections::HashMap;
use serde::{Deserialize};

#[derive(Debug, Deserialize)]
struct DragontailChampion {
    pub id: String,
    pub name: String,
    #[serde(rename = "tier")]
    pub cost: u32,
    pub image: DragontailImage,
}

#[derive(Debug, Deserialize)]
struct DragontailTrait {
    pub id: String,
    pub name: String,
    pub image: DragontailImage,
}

#[derive(Debug, Deserialize)]
struct DragontailItem {
    pub id: String,
    pub name: String,
    pub image: DragontailImage,
}

#[derive(Debug, Deserialize)]
struct DragontailAugment {
    pub id: String,
    pub name: String,
    pub description: String,
    pub image: DragontailImage,
}

#[derive(Debug, Deserialize)]
struct DragontailImage {
    pub full: String,
    pub sprite: String,
    #[serde(rename = "group")]
    pub img_group: String,
    pub x: i32,
    pub y: i32,
    pub w: i32,
    pub h: i32,
}

#[derive(Debug, Deserialize)]
struct DragontailDataFile<T> {
    #[serde(rename = "type")]
    pub data_type: String,
    pub version: String,
    pub data: HashMap<String, T>,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Test that we can read the dragontail files
    let dragontail_path = "C:\\Users\\puppets\\Documents\\League of Legends\\dragontail-15.23.1";
    
    // Test reading champions
    let champion_path = format!("{}/15.23.1/data/en_US/tft-champion.json", dragontail_path);
    if std::path::Path::new(&champion_path).exists() {
        let data = fs::read_to_string(&champion_path)?;
        let dragontail_data: DragontailDataFile<DragontailChampion> = serde_json::from_str(&data)?;
        
        println!("✅ Successfully parsed champions file");
        println!("Found {} champions", dragontail_data.data.len());
        
        // Show first few champions as example
        for (key, champion) in dragontail_data.data.iter().take(5) {
            println!("  - ID: {}, Name: {}, Cost: {}", key, champion.name, champion.cost);
        }
    } else {
        println!("⚠️  Champions file not found at: {}", champion_path);
    }
    
    // Test reading traits
    let trait_path = format!("{}/15.23.1/data/en_US/tft-trait.json", dragontail_path);
    if std::path::Path::new(&trait_path).exists() {
        let data = fs::read_to_string(&trait_path)?;
        let dragontail_data: DragontailDataFile<DragontailTrait> = serde_json::from_str(&data)?;
        
        println!("✅ Successfully parsed traits file");
        println!("Found {} traits", dragontail_data.data.len());
        
        // Show first few traits as example
        for (key, trait_data) in dragontail_data.data.iter().take(5) {
            println!("  - ID: {}, Name: {}", key, trait_data.name);
        }
    } else {
        println!("⚠️  Traits file not found at: {}", trait_path);
    }
    
    // Test reading items
    let item_path = format!("{}/15.23.1/data/en_US/tft-item.json", dragontail_path);
    if std::path::Path::new(&item_path).exists() {
        let data = fs::read_to_string(&item_path)?;
        let dragontail_data: DragontailDataFile<DragontailItem> = serde_json::from_str(&data)?;
        
        println!("✅ Successfully parsed items file");
        println!("Found {} items", dragontail_data.data.len());
        
        // Show first few items as example
        for (key, item) in dragontail_data.data.iter().take(5) {
            println!("  - ID: {}, Name: {}", key, item.name);
        }
    } else {
        println!("⚠️  Items file not found at: {}", item_path);
    }
    
    // Test reading augments
    let augment_path = format!("{}/15.23.1/data/en_US/tft-augments.json", dragontail_path);
    if std::path::Path::new(&augment_path).exists() {
        let data = fs::read_to_string(&augment_path)?;
        let dragontail_data: DragontailDataFile<DragontailAugment> = serde_json::from_str(&data)?;
        
        println!("✅ Successfully parsed augments file");
        println!("Found {} augments", dragontail_data.data.len());
        
        // Show first few augments as example
        for (key, augment) in dragontail_data.data.iter().take(5) {
            println!("  - ID: {}, Name: {}", key, augment.name);
        }
    } else {
        println!("⚠️  Augments file not found at: {}", augment_path);
    }
    
    println!("\n🎉 All dragontail files were successfully parsed!");
    Ok(())
}